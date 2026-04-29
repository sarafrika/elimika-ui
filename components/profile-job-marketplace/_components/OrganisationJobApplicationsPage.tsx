'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  AssignInstructorData,
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  ReviewApplicationData,
} from '@/services/client';
import {
  assignInstructorMutation,
  getInstructorByUuidOptions,
  listJobApplicationsOptions,
  listJobApplicationsQueryKey,
  listJobsOptions,
  listJobsQueryKey,
  reviewApplicationMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';

type JobApplicationsPageProps = {
  jobUuid: string;
};

function formatLabel(value?: string | null) {
  if (!value) return 'Not provided';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not provided';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function OrganisationJobApplicationsPage({ jobUuid }: JobApplicationsPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const organisation = useOrganisation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'approved' | 'rejected' | 'assigned'>('ALL');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [pendingReview, setPendingReview] = useState<{
    application: ClassMarketplaceJobApplication;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);

  // const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
  //   ...listJobsOptions({
  //     query: {
  //       pageable: {
  //         page: 0,
  //         size: PAGE_SIZE,
  //         sort: ['created_date,desc'],
  //       },
  //       ...(isOrganizationView && organisationUuid ? { organisation_uuid: organisationUuid } : {}),
  //     },
  //   }),
  //   enabled: true,
  // });
  const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
    ...listJobsOptions({ query: { pageable: {}, organisation_uuid: "ec237ec5-f13c-4248-bf70-8d0099cb3a15" } }),
    enabled: true,
  });

  const job =
    (jobsResponse?.data?.content ?? []).find((item: ClassMarketplaceJob) => item.uuid === jobUuid) ??
    null;

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions({
      path: { jobUuid },
      query: {
        pageable: {},
      },
    }),
    enabled: Boolean(jobUuid),
  });

  const applications: ClassMarketplaceJobApplication[] = applicationsQuery.data?.data?.content ?? [];

  const applicantQueries = useQueries({
    queries: applications.map(application => ({
      ...getInstructorByUuidOptions({
        path: { uuid: application.instructor_uuid ?? '' },
      }),
      enabled: Boolean(application.instructor_uuid),
    })),
  });

  const reviewMutation = useMutation({
    ...reviewApplicationMutation(),
    onSuccess: async () => {
      toast.success('Application reviewed successfully.');
      setReviewNotes('');
      setPendingReview(null);
      setReviewDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: listJobApplicationsQueryKey({ path: { jobUuid }, query: { pageable: {} } }) });
      await queryClient.invalidateQueries({ queryKey: listJobsQueryKey({ query: { pageable: {} } }) });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to review this application.');
    },
  });

  const assignMutation = useMutation({
    ...assignInstructorMutation(),
    onSuccess: async () => {
      toast.success('Instructor assigned and class created.');
      await queryClient.invalidateQueries({ queryKey: listJobApplicationsQueryKey({ path: { jobUuid }, query: { pageable: {} } }) });
      await queryClient.invalidateQueries({ queryKey: listJobsQueryKey({ query: { pageable: {} } }) });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to assign this instructor.');
    },
  });

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return applications.filter((application, index) => {
      const user = applicantQueries[0]?.data?.data ?? null;
      const searchable = [
        user?.first_name,
        user?.last_name,
        user?.full_name,
        user?.email,
        user?.phone_number,
        application.application_note,
        application.review_notes,
        application.status,
        application.instructor_uuid,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applicantQueries, applications, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter(application => application.status === 'pending').length,
      approved: applications.filter(application => application.status === 'approved').length,
      rejected: applications.filter(application => application.status === 'rejected').length,
      assigned: applications.filter(application => application.status === 'assigned').length,

    }),
    [applications]
  );

  const openReviewDialog = (application: ClassMarketplaceJobApplication, action: 'APPROVE' | 'REJECT') => {
    setPendingReview({ application, action });
    setReviewNotes(application.review_notes ?? '');
    setReviewDialogOpen(true);
  };

  const handleReviewConfirm = () => {
    if (!pendingReview?.application.uuid) return;

    reviewMutation.mutate({
      path: {
        jobUuid,
        applicationUuid: pendingReview.application.uuid,
      },
      query: {
        action: pendingReview.action,
      },
      body: reviewNotes.trim() ? { review_notes: reviewNotes.trim() } : undefined,
    } satisfies ReviewApplicationData);
  };

  const handleAssign = (application: ClassMarketplaceJobApplication) => {
    assignMutation.mutate({
      path: { jobUuid },
      body: {
        application_uuid: application.uuid ?? '',
      },
    } satisfies AssignInstructorData);
  };

  if (isJobsLoading && !job) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Loader2 className='text-muted-foreground size-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full'>
      <Button variant='ghost' className='px-0 text-muted-foreground' onClick={() => router.back()}>
        <ArrowLeft className='mr-2 size-4' />
        Back to opportunities
      </Button>

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              {job?.title ?? 'Job applications'}
            </h1>
            <p className='text-muted-foreground'>
              Review applicants, approve or reject submissions, then assign an approved instructor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/80 text-primary-foreground">  Total {stats.total}</Badge>
          <Badge className="bg-accent/70 text-accent-foreground">  Pending {stats.pending}</Badge>
          <Badge className="bg-success/80 text-success-foreground">  Approved {stats.approved}</Badge>
          <Badge className="bg-destructive/80 text-destructive-foreground">   Rejected {stats.rejected} </Badge>
          <Badge className="bg-secondary text-secondary-foreground">  Assigned {stats.assigned}</Badge>
        </div>
      </div>

      <div className='space-y-4 bg-card/95 p-4'>
        <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]'>
          <label className='relative block'>
            <span className='sr-only'>Search applicants</span>
            <Input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder='Search by applicant name, email, phone, or note'
              className='h-11 rounded-xl pl-10'
            />
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          </label>
          <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className='h-11 rounded-xl'>
              <SelectValue placeholder='All statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All statuses</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='assigned'>Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]'>
          <div className='space-y-3'>
            {filteredApplications.length ? (
              filteredApplications.map((application, index) => {
                const user = applicantQueries[0]?.data?.data ?? null;
                const initials =
                  `${user?.full_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.trim() || '?';
                const disableButton = application.status !== "pending"

                return (
                  <Card key={application.uuid} className='rounded-2xl border bg-background/70 p-4'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div className='flex items-start gap-3'>
                        <div className='bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full font-semibold'>
                          {initials}
                        </div>
                        <div className='space-y-1'>
                          <h3 className='text-lg font-semibold'>
                            {user?.full_name || 'Applicant'}
                          </h3>
                          <div className='flex flex-col gap-2 text-sm text-muted-foreground'>
                            {user?.professional_headline ? (
                              <span className='inline-flex items-center gap-1'>
                                {user.professional_headline}
                              </span>
                            ) : null}
                            {user?.website ? (
                              <a
                                href={user.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary/60 hover:text-primary/80 underline"
                              >
                                {user.website}
                              </a>
                            ) : null}
                            {user?.display_name ? <span>{user.display_name}</span> : null}
                          </div>
                        </div>
                      </div>
                      <Badge variant='secondary' className='rounded-full px-3 py-1'>
                        {formatLabel(application.status)}
                      </Badge>
                    </div>

                    <div className='mt-1 grid gap-3 sm:grid-cols-2'>
                      <div className='rounded-xl border bg-background/80 p-3'>
                        <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                          Application note
                        </div>
                        <p className='mt-1 text-sm leading-6 text-foreground'>
                          {application.application_note || 'No application note provided.'}
                        </p>
                      </div>
                      <div className='rounded-xl border bg-background/80 p-3'>
                        <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                          Review notes
                        </div>
                        <p className='mt-1 text-sm leading-6 text-foreground'>
                          {application.review_notes || 'No review notes yet.'}
                        </p>
                      </div>
                    </div>

                    <div className='mt-4 flex flex-wrap items-center gap-2'>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant='outline' className='rounded-full'>
                          Applied {formatDate(application.created_date)}
                        </Badge>
                        {application.reviewed_at ? (
                          <Badge variant='outline' className='rounded-full'>
                            Reviewed {formatDate(application.reviewed_at)}
                          </Badge>
                        ) : null}
                      </div>

                      <div className='ml-auto flex flex-wrap gap-2'>
                        <Button
                          variant='outline'
                          className='rounded-xl'
                          onClick={() => openReviewDialog(application, 'APPROVE')}
                          disabled={reviewMutation.isPending || disableButton}
                        >
                          <CheckCircle2 className='mr-2 size-4' />
                          Approve
                        </Button>
                        <Button
                          variant='destructive'
                          className='rounded-xl'
                          onClick={() => openReviewDialog(application, 'REJECT')}
                          disabled={reviewMutation.isPending || disableButton}
                        >
                          <XCircle className='mr-2 size-4' />
                          Reject
                        </Button>
                        <Button
                          className='rounded-xl'
                          onClick={() => handleAssign(application)}
                          disabled={assignMutation.isPending || application.status !== 'approved'}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className='rounded-2xl border-dashed p-10 text-center text-muted-foreground'>
                No applicants found for the selected filters.
              </Card>
            )}
          </div>

          <Card className='h-fit rounded-[18px] border-white/60 bg-card/95 p-4 shadow-sm'>
            <h2 className='text-lg font-semibold'>Job overview</h2>
            <div className='mt-4 space-y-3'>
              <div className='rounded-2xl border bg-background/70 p-3'>
                <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Job title
                </div>
                <div className='mt-1 text-sm font-medium'>{job?.title ?? 'Not found'}</div>
              </div>
              <div className='rounded-2xl border bg-background/70 p-3'>
                <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Organisation
                </div>
                <div className='mt-1 text-sm font-medium'>
                  {job?.organisation_uuid ?? organisation?.uuid ?? 'Not available'}
                </div>
              </div>
              <div className='rounded-2xl border bg-background/70 p-3'>
                <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Location
                </div>
                <div className='mt-1 flex items-center gap-2 text-sm font-medium'>
                  <MapPin className='size-4 text-primary' />
                  {job?.location_name || formatLabel(job?.location_type)}
                </div>
              </div>
              <div className='rounded-2xl border bg-background/70 p-3'>
                <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Schedule
                </div>
                <div className='mt-1 text-sm font-medium'>{formatDate(job?.default_start_time)}</div>
                <div className='text-xs text-muted-foreground'>
                  to {formatDate(job?.default_end_time)}
                </div>
              </div>
            </div>

            <div className='mt-4 flex flex-wrap gap-2'>
              <Button variant='outline' className='rounded-xl' asChild>
                <Link href='/dashboard/opportunities'>Back to opportunities</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={reviewDialogOpen}
        onOpenChange={open => {
          setReviewDialogOpen(open);
          if (!open) {
            setPendingReview(null);
            setReviewNotes('');
          }
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {pendingReview?.action === 'APPROVE' ? 'Approve application' : 'Reject application'}
            </DialogTitle>
            <DialogDescription>
              Add review notes before confirming this decision. The applicant will receive the
              submitted notes with the review outcome.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Label htmlFor='review-notes' className='text-sm font-medium'>
              Review notes
            </Label>
            <Textarea
              id='review-notes'
              value={reviewNotes}
              onChange={event => setReviewNotes(event.target.value)}
              placeholder='Add optional notes for this review...'
              className='min-h-32 rounded-2xl'
            />
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              className='rounded-xl'
              onClick={() => {
                setReviewDialogOpen(false);
                setPendingReview(null);
                setReviewNotes('');
              }}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className='rounded-xl'
              variant={pendingReview?.action === 'REJECT' ? 'destructive' : 'default'}
              onClick={handleReviewConfirm}
              disabled={reviewMutation.isPending || !pendingReview?.application.uuid}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  Submitting...
                </>
              ) : pendingReview?.action === 'APPROVE' ? (
                'Confirm approval'
              ) : (
                'Confirm rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
