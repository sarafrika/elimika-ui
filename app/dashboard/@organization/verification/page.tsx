'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle2, Clock, Eye, Loader2, Pencil, RefreshCw, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import type {
  CourseTrainingApplication,
  CourseTrainingRateCard,
  ProgramTrainingApplication,
} from '@/services/client';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
  updateProgramTrainingApplicationMutation,
  updateTrainingApplicationMutation,
  withdrawProgramTrainingApplicationMutation,
  withdrawTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../_components/ui';

type OfferingKind = 'course' | 'program';

type RequestRow = {
  kind: OfferingKind;
  /** Training application uuid. */
  applicationUuid: string;
  /** Course or program uuid the request targets. */
  offeringUuid: string;
  name: string;
  status: string;
  rateCard?: CourseTrainingRateCard;
  applicationNotes?: string | null;
  reviewNotes?: string | null;
  createdDate?: string | Date;
  reviewedAt?: string | Date | null;
};

type EditForm = {
  currency: string;
  privateOnline: string;
  privateInperson: string;
  groupOnline: string;
  groupInperson: string;
  notes: string;
};

const num = (value: string): number => {
  const parsed = Number(value.trim());
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDate = (value?: string | Date | null): string =>
  value ? format(new Date(value), 'dd MMM yyyy') : '—';

const formatRate = (rateCard?: CourseTrainingRateCard): string => {
  if (!rateCard) return '—';
  const rate = rateCard.group_online_rate ?? rateCard.private_online_rate;
  if (rate === undefined || rate === null) return '—';
  return `${rateCard.currency ?? ''} ${Number(rate).toLocaleString()}`.trim();
};

const isPending = (status: string) => status?.toLowerCase() === 'pending';
const canReapply = (status: string) => ['rejected', 'revoked'].includes(status?.toLowerCase());

export default function OrganisationTrainingRequestsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const qc = useQueryClient();

  const searchParams = {
    applicant_uuid_eq: organisationUuid,
    applicant_type_eq: 'organisation',
  };
  const pageable = { page: 0, size: 100 };

  const courseOptions = searchTrainingApplicationsOptions({
    query: { searchParams, pageable },
  });
  const programOptions = searchProgramTrainingApplicationsOptions({
    query: { searchParams, pageable },
  });

  const coursesQuery = useQuery({ ...courseOptions, enabled: Boolean(organisationUuid) });
  const programsQuery = useQuery({ ...programOptions, enabled: Boolean(organisationUuid) });

  const courseApplications: CourseTrainingApplication[] = useMemo(
    () => coursesQuery.data?.data?.content ?? [],
    [coursesQuery.data]
  );
  const programApplications: ProgramTrainingApplication[] = useMemo(
    () => programsQuery.data?.data?.content ?? [],
    [programsQuery.data]
  );

  const courseUuids = useMemo(
    () =>
      Array.from(
        new Set(
          courseApplications
            .map(row => row.course_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [courseApplications]
  );
  const programUuids = useMemo(
    () =>
      Array.from(
        new Set(
          programApplications
            .map(row => row.program_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [programApplications]
  );

  const { courseMap } = useCoursesByIds(courseUuids);
  const { programMap } = useProgramsByIds(programUuids);

  const rows: RequestRow[] = useMemo(() => {
    const courseRows: RequestRow[] = courseApplications
      .filter(app => app.uuid && app.course_uuid)
      .map(app => ({
        kind: 'course' as const,
        applicationUuid: app.uuid as string,
        offeringUuid: app.course_uuid as string,
        name: courseMap[app.course_uuid as string]?.name ?? 'Course',
        status: app.status ?? 'pending',
        rateCard: app.rate_card,
        applicationNotes: app.application_notes,
        reviewNotes: app.review_notes,
        createdDate: app.created_date,
        reviewedAt: app.reviewed_at,
      }));

    const programRows: RequestRow[] = programApplications
      .filter(app => app.uuid && app.program_uuid)
      .map(app => ({
        kind: 'program' as const,
        applicationUuid: app.uuid as string,
        offeringUuid: app.program_uuid as string,
        name: programMap[app.program_uuid as string]?.title ?? 'Programme',
        status: app.status ?? 'pending',
        rateCard: app.rate_card,
        applicationNotes: app.application_notes,
        reviewNotes: app.review_notes,
        createdDate: app.created_date,
        reviewedAt: app.reviewed_at,
      }));

    return [...courseRows, ...programRows].sort((a, b) => {
      const aDate = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const bDate = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return bDate - aDate;
    });
  }, [courseApplications, programApplications, courseMap, programMap]);

  const counts = useMemo(() => {
    const acc = { pending: 0, approved: 0, rejected: 0, revoked: 0 };
    for (const row of rows) {
      const key = row.status?.toLowerCase() as keyof typeof acc;
      if (key in acc) acc[key] += 1;
    }
    return acc;
  }, [rows]);

  const isLoading = coursesQuery.isLoading || programsQuery.isLoading;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: courseOptions.queryKey });
    qc.invalidateQueries({ queryKey: programOptions.queryKey });
  };

  // View
  const [viewRow, setViewRow] = useState<RequestRow | null>(null);

  // Edit
  const [editRow, setEditRow] = useState<RequestRow | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

  // Withdraw
  const [withdrawRow, setWithdrawRow] = useState<RequestRow | null>(null);

  const updateCourse = useMutation(updateTrainingApplicationMutation());
  const updateProgram = useMutation(updateProgramTrainingApplicationMutation());
  const withdrawCourse = useMutation(withdrawTrainingApplicationMutation());
  const withdrawProgram = useMutation(withdrawProgramTrainingApplicationMutation());

  const updatePending = updateCourse.isPending || updateProgram.isPending;
  const withdrawPending = withdrawCourse.isPending || withdrawProgram.isPending;

  const openEdit = (row: RequestRow) => {
    setEditRow(row);
    setForm({
      currency: row.rateCard?.currency ?? 'KES',
      privateOnline: String(row.rateCard?.private_online_rate ?? ''),
      privateInperson: String(row.rateCard?.private_inperson_rate ?? ''),
      groupOnline: String(row.rateCard?.group_online_rate ?? ''),
      groupInperson: String(row.rateCard?.group_inperson_rate ?? ''),
      notes: row.applicationNotes ?? '',
    });
  };

  const closeEdit = () => {
    setEditRow(null);
    setForm(null);
  };

  const handleUpdate = () => {
    if (!editRow || !form) return;

    const body = {
      rate_card: {
        currency: form.currency.trim() || undefined,
        private_online_rate: num(form.privateOnline),
        private_inperson_rate: num(form.privateInperson),
        group_online_rate: num(form.groupOnline),
        group_inperson_rate: num(form.groupInperson),
      },
      application_notes: form.notes.trim() || undefined,
    };

    const onSuccess = () => {
      toast.success('Training request updated.');
      invalidate();
      closeEdit();
    };
    const onError = (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Unable to update the request.');

    if (editRow.kind === 'course') {
      updateCourse.mutate(
        {
          path: { courseUuid: editRow.offeringUuid, applicationUuid: editRow.applicationUuid },
          body,
        },
        { onSuccess, onError }
      );
    } else {
      updateProgram.mutate(
        {
          path: { programUuid: editRow.offeringUuid, applicationUuid: editRow.applicationUuid },
          body,
        },
        { onSuccess, onError }
      );
    }
  };

  const handleWithdraw = () => {
    if (!withdrawRow) return;

    const onSuccess = () => {
      toast.success('Training request withdrawn.');
      invalidate();
      setWithdrawRow(null);
    };
    const onError = (error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Unable to withdraw the request.');

    if (withdrawRow.kind === 'course') {
      withdrawCourse.mutate(
        {
          path: {
            courseUuid: withdrawRow.offeringUuid,
            applicationUuid: withdrawRow.applicationUuid,
          },
        },
        { onSuccess, onError }
      );
    } else {
      withdrawProgram.mutate(
        {
          path: {
            programUuid: withdrawRow.offeringUuid,
            applicationUuid: withdrawRow.applicationUuid,
          },
        },
        { onSuccess, onError }
      );
    }
  };

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Training requests'
          description='Track your organisation’s applications to train courses and programmes, and manage them while they await review.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <StatCard label='Pending' value={counts.pending} icon={Clock} tone='warning' />
          <StatCard label='Approved' value={counts.approved} icon={CheckCircle2} tone='success' />
          <StatCard label='Rejected' value={counts.rejected} icon={XCircle} tone='destructive' />
          <StatCard label='Revoked' value={counts.revoked} icon={RefreshCw} tone='neutral' />
        </div>

        <SectionCard
          title='Your requests'
          description='Courses and programmes your organisation has applied to train.'
          bodyClassName='p-0'
        >
          {isLoading ? (
            <div className='flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground'>
              <Loader2 className='size-4 animate-spin' /> Loading training requests…
            </div>
          ) : rows.length === 0 ? (
            <div className='space-y-2 p-10 text-center'>
              <p className='text-sm font-medium text-foreground'>No training requests yet</p>
              <p className='text-sm text-muted-foreground'>
                Apply to train a course or programme from the{' '}
                <Link href='/dashboard/courses' className='underline underline-offset-4'>
                  course catalogue
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offering</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={`${row.kind}-${row.applicationUuid}`}>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium text-foreground'>{row.name}</span>
                          {row.reviewNotes ? (
                            <span className='text-xs text-muted-foreground'>
                              Review: {row.reviewNotes}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className='capitalize text-muted-foreground'>
                        {row.kind === 'program' ? 'Programme' : 'Course'}
                      </TableCell>
                      <TableCell>{formatRate(row.rateCard)}</TableCell>
                      <TableCell>{formatDate(row.createdDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1.5'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setViewRow(row)}
                            aria-label='View details'
                          >
                            <Eye className='size-4' />
                          </Button>
                          {isPending(row.status) ? (
                            <>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => openEdit(row)}
                                aria-label='Edit request'
                              >
                                <Pencil className='size-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setWithdrawRow(row)}
                                aria-label='Withdraw request'
                              >
                                <Trash2 className='size-4 text-destructive' />
                              </Button>
                            </>
                          ) : null}
                          {canReapply(row.status) ? (
                            <Button variant='outline' size='sm' asChild>
                              <Link href='/dashboard/courses'>Re-apply</Link>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* View details */}
      <Dialog open={Boolean(viewRow)} onOpenChange={open => !open && setViewRow(null)}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{viewRow?.name}</DialogTitle>
            <DialogDescription>
              {viewRow?.kind === 'program' ? 'Programme' : 'Course'} training request
            </DialogDescription>
          </DialogHeader>
          {viewRow ? (
            <DetailGrid
              items={[
                { label: 'Status', value: <StatusBadge status={viewRow.status} /> },
                { label: 'Currency', value: viewRow.rateCard?.currency ?? '—' },
                {
                  label: 'Private · online',
                  value: viewRow.rateCard?.private_online_rate ?? '—',
                },
                {
                  label: 'Private · in-person',
                  value: viewRow.rateCard?.private_inperson_rate ?? '—',
                },
                { label: 'Group · online', value: viewRow.rateCard?.group_online_rate ?? '—' },
                {
                  label: 'Group · in-person',
                  value: viewRow.rateCard?.group_inperson_rate ?? '—',
                },
                { label: 'Submitted', value: formatDate(viewRow.createdDate) },
                { label: 'Reviewed', value: formatDate(viewRow.reviewedAt) },
                { label: 'Application notes', value: viewRow.applicationNotes ?? '—' },
                { label: 'Review notes', value: viewRow.reviewNotes ?? '—' },
              ]}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit (pending only) */}
      <Dialog open={Boolean(editRow)} onOpenChange={open => !open && closeEdit()}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit training request</DialogTitle>
            <DialogDescription>
              Update your rate card and notes while the request is pending review.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Currency</Label>
                <Input
                  value={form.currency}
                  maxLength={3}
                  onChange={event =>
                    setForm({ ...form, currency: event.target.value.toUpperCase() })
                  }
                  placeholder='KES'
                />
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Private · online rate</Label>
                  <Input
                    type='number'
                    min={0}
                    step='0.01'
                    value={form.privateOnline}
                    onChange={event => setForm({ ...form, privateOnline: event.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Private · in-person rate</Label>
                  <Input
                    type='number'
                    min={0}
                    step='0.01'
                    value={form.privateInperson}
                    onChange={event => setForm({ ...form, privateInperson: event.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Group · online rate</Label>
                  <Input
                    type='number'
                    min={0}
                    step='0.01'
                    value={form.groupOnline}
                    onChange={event => setForm({ ...form, groupOnline: event.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Group · in-person rate</Label>
                  <Input
                    type='number'
                    min={0}
                    step='0.01'
                    value={form.groupInperson}
                    onChange={event => setForm({ ...form, groupInperson: event.target.value })}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Application notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={event => setForm({ ...form, notes: event.target.value })}
                  placeholder='Optional context for the reviewer'
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant='outline' onClick={closeEdit} disabled={updatePending}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updatePending}>
              {updatePending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw confirm (pending only) */}
      <AlertDialog open={Boolean(withdrawRow)} onOpenChange={open => !open && setWithdrawRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw training request?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your organisation’s pending application to train{' '}
              <span className='font-medium text-foreground'>{withdrawRow?.name}</span>. You can
              re-apply later from the course catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                handleWithdraw();
              }}
              disabled={withdrawPending}
            >
              {withdrawPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
