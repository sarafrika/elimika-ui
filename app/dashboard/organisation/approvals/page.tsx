'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { KpiCard } from '@/components/dashboard';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
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
import { dayjs } from '@/lib/date';
import { cn } from '@/lib/utils';
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
import { OrgPage } from '../_components/org-page';

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
  privateOnlineHourly: string;
  privateOnlineSession: string;
  privateOnlineDaily: string;
  privateInpersonHourly: string;
  privateInpersonSession: string;
  privateInpersonDaily: string;
  groupOnlineHourly: string;
  groupOnlineSession: string;
  groupOnlineDaily: string;
  groupInpersonHourly: string;
  groupInpersonSession: string;
  groupInpersonDaily: string;
  notes: string;
};

const RATE_MODALITIES = [
  { prefix: 'privateOnline', label: 'Private · online' },
  { prefix: 'privateInperson', label: 'Private · in-person' },
  { prefix: 'groupOnline', label: 'Group · online' },
  { prefix: 'groupInperson', label: 'Group · in-person' },
] as const;

const RATE_BASIS_GROUPS = [
  { suffix: 'Hourly', title: 'Per hour', hint: 'Required. The rate for an hour of teaching.' },
  {
    suffix: 'Session',
    title: 'Per session',
    hint: 'Optional. Leave blank and this applicant cannot take jobs contracted per session.',
  },
  {
    suffix: 'Daily',
    title: 'Per day',
    hint: 'Optional. A calendar day, however many sessions fall in it.',
  },
] as const;

const RATE_CARD_KEY: Record<string, Record<string, keyof CourseTrainingRateCard>> = {
  privateOnline: {
    Hourly: 'private_online_hourly_rate',
    Session: 'private_online_session_rate',
    Daily: 'private_online_daily_rate',
  },
  privateInperson: {
    Hourly: 'private_inperson_hourly_rate',
    Session: 'private_inperson_session_rate',
    Daily: 'private_inperson_daily_rate',
  },
  groupOnline: {
    Hourly: 'group_online_hourly_rate',
    Session: 'group_online_session_rate',
    Daily: 'group_online_daily_rate',
  },
  groupInperson: {
    Hourly: 'group_inperson_hourly_rate',
    Session: 'group_inperson_session_rate',
    Daily: 'group_inperson_daily_rate',
  },
};

const num = (value: string): number => {
  const parsed = Number(value.trim());
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Blank stays blank: applyRateCard overwrites every cell, so sending 0 for an unpriced basis would
// advertise free work rather than leaving the applicant ineligible for jobs contracted that way.
const optionalNum = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const formatDate = (value?: string | Date | null): string =>
  value ? dayjs.utc(value).format('DD MMM YYYY') : '—';

const formatRate = (rateCard?: CourseTrainingRateCard): string => {
  if (!rateCard) return '—';
  const rate = rateCard.group_online_hourly_rate ?? rateCard.private_online_hourly_rate;
  if (rate === undefined || rate === null) return '—';
  return `${rateCard.currency ?? ''} ${Number(rate).toLocaleString()}`.trim();
};

const isPending = (status: string) => status?.toLowerCase() === 'pending';
const canReapply = (status: string) => ['rejected', 'revoked'].includes(status?.toLowerCase());

const STATUS_TONE: Record<string, string> = {
  pending: 'border-warning/30 bg-warning/10 text-warning',
  approved: 'border-success/30 bg-success/10 text-success',
  rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  revoked: 'border-primary/30 bg-primary/10 text-primary',
};

/** Status pill for a training application. */
function StatusPill({ status }: { status?: string | null }) {
  const key = (status ?? '').toLowerCase();
  const label = (status ?? 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <Badge
      variant='outline'
      className={cn(
        'rounded-md px-2.5 py-0.5 text-xs font-medium',
        STATUS_TONE[key] ?? 'border-border bg-muted/40 text-muted-foreground'
      )}
    >
      {label}
    </Badge>
  );
}

/** Labelled figure used in the request detail dialog. */
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='bg-muted/20 rounded-lg border px-3 py-2.5'>
      <p className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</p>
      <div className='text-foreground mt-1 text-sm font-medium'>{value ?? '—'}</div>
    </div>
  );
}

export default function OrganisationApprovalsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const qc = useQueryClient();

  const searchParams = {
    applicant_uuid_eq: organisationUuid,
    applicant_type_eq: 'organisation',
  };
  const pageable = { page: 0, size: 100 };

  const courseOptions = searchTrainingApplicationsOptions({ query: { searchParams, pageable } });
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

  const [viewRow, setViewRow] = useState<RequestRow | null>(null);
  const [editRow, setEditRow] = useState<RequestRow | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
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
      privateOnlineHourly: String(row.rateCard?.private_online_hourly_rate ?? ''),
      privateOnlineSession: String(row.rateCard?.private_online_session_rate ?? ''),
      privateOnlineDaily: String(row.rateCard?.private_online_daily_rate ?? ''),
      privateInpersonHourly: String(row.rateCard?.private_inperson_hourly_rate ?? ''),
      privateInpersonSession: String(row.rateCard?.private_inperson_session_rate ?? ''),
      privateInpersonDaily: String(row.rateCard?.private_inperson_daily_rate ?? ''),
      groupOnlineHourly: String(row.rateCard?.group_online_hourly_rate ?? ''),
      groupOnlineSession: String(row.rateCard?.group_online_session_rate ?? ''),
      groupOnlineDaily: String(row.rateCard?.group_online_daily_rate ?? ''),
      groupInpersonHourly: String(row.rateCard?.group_inperson_hourly_rate ?? ''),
      groupInpersonSession: String(row.rateCard?.group_inperson_session_rate ?? ''),
      groupInpersonDaily: String(row.rateCard?.group_inperson_daily_rate ?? ''),
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
        private_online_hourly_rate: num(form.privateOnlineHourly),
        private_inperson_hourly_rate: num(form.privateInpersonHourly),
        group_online_hourly_rate: num(form.groupOnlineHourly),
        group_inperson_hourly_rate: num(form.groupInpersonHourly),
        private_online_session_rate: optionalNum(form.privateOnlineSession),
        private_online_daily_rate: optionalNum(form.privateOnlineDaily),
        private_inperson_session_rate: optionalNum(form.privateInpersonSession),
        private_inperson_daily_rate: optionalNum(form.privateInpersonDaily),
        group_online_session_rate: optionalNum(form.groupOnlineSession),
        group_online_daily_rate: optionalNum(form.groupOnlineDaily),
        group_inperson_session_rate: optionalNum(form.groupInpersonSession),
        group_inperson_daily_rate: optionalNum(form.groupInpersonDaily),
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
    <OrgPage className='space-y-6'>
      <PageHeader
        title='Approvals'
        description='Track your organisation’s applications to train courses and programmes, and manage them while they await review.'
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiCard
          title='Pending'
          value={counts.pending}
          icon={<Clock className='h-5 w-5' />}
          variant='amber'
        />
        <KpiCard
          title='Approved'
          value={counts.approved}
          icon={<CheckCircle2 className='h-5 w-5' />}
          variant='green'
        />
        <KpiCard
          title='Rejected'
          value={counts.rejected}
          icon={<XCircle className='h-5 w-5' />}
          variant='coral'
        />
        <KpiCard
          title='Revoked'
          value={counts.revoked}
          icon={<RefreshCw className='h-5 w-5' />}
          variant='indigo'
        />
      </div>

      <Card>
        <CardContent className='space-y-4 p-6'>
          <div className='space-y-1'>
            <h2 className='text-foreground text-base font-semibold'>Your requests</h2>
            <p className='text-muted-foreground text-sm'>
              Courses and programmes your organisation has applied to train.
            </p>
          </div>

          {isLoading ? (
            <div className='space-y-2'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title='No training requests yet'
              description='Apply to train a course or programme from the course catalogue.'
            />
          ) : (
            <div className='overflow-x-auto rounded-lg border'>
              <Table className='min-w-[820px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='whitespace-nowrap'>Offering</TableHead>
                    <TableHead className='whitespace-nowrap'>Type</TableHead>
                    <TableHead className='whitespace-nowrap'>Rate</TableHead>
                    <TableHead className='whitespace-nowrap'>Submitted</TableHead>
                    <TableHead className='whitespace-nowrap'>Status</TableHead>
                    <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={`${row.kind}-${row.applicationUuid}`}>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='text-foreground font-medium'>{row.name}</span>
                          {row.reviewNotes ? (
                            <span className='text-muted-foreground text-xs'>
                              Review: {row.reviewNotes}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap capitalize'>
                        {row.kind === 'program' ? 'Programme' : 'Course'}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        {formatRate(row.rateCard)}
                      </TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap'>
                        {formatDate(row.createdDate)}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        <StatusPill status={row.status} />
                      </TableCell>
                      <TableCell className='text-right whitespace-nowrap'>
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
                                <Trash2 className='text-destructive size-4' />
                              </Button>
                            </>
                          ) : null}
                          {canReapply(row.status) ? (
                            <Button variant='outline' size='sm' asChild>
                              <Link href='/dashboard/organisation/courses'>Re-apply</Link>
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
        </CardContent>
      </Card>

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
            <div className='grid gap-3 sm:grid-cols-2'>
              <Detail label='Status' value={<StatusPill status={viewRow.status} />} />
              <Detail label='Currency' value={viewRow.rateCard?.currency ?? '—'} />
              {RATE_BASIS_GROUPS.map(group =>
                RATE_MODALITIES.map(modality => {
                  const cell = RATE_CARD_KEY[modality.prefix][group.suffix];
                  return (
                    <Detail
                      key={cell}
                      label={`${modality.label} · ${group.title.toLowerCase()}`}
                      value={viewRow.rateCard?.[cell] ?? '—'}
                    />
                  );
                })
              )}
              <Detail label='Submitted' value={formatDate(viewRow.createdDate)} />
              <Detail label='Reviewed' value={formatDate(viewRow.reviewedAt)} />
              <Detail label='Application notes' value={viewRow.applicationNotes ?? '—'} />
              <Detail label='Review notes' value={viewRow.reviewNotes ?? '—'} />
            </div>
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
              {RATE_BASIS_GROUPS.map(group => (
                <div key={group.suffix} className='space-y-3'>
                  <div>
                    <h4 className='text-sm font-medium'>{group.title}</h4>
                    <p className='text-muted-foreground text-xs'>{group.hint}</p>
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {RATE_MODALITIES.map(modality => {
                      const key = `${modality.prefix}${group.suffix}` as keyof EditForm;
                      return (
                        <div key={key} className='space-y-2'>
                          <Label>{modality.label} rate</Label>
                          <Input
                            type='number'
                            min={0}
                            step='0.01'
                            value={form[key]}
                            onChange={event => setForm({ ...form, [key]: event.target.value })}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
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
              <span className='text-foreground font-medium'>{withdrawRow?.name}</span>. You can
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
    </OrgPage>
  );
}
