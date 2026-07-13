'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, TriangleAlert, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AdminPageHeader, adminTheme, SectionCard, StatusBadge } from '@/app/dashboard/@admin/_components/ui';
import { InstructorReviewProfile } from '@/components/instructor-review/InstructorReviewProfile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { formatCurrency } from '@/lib/format-currency';
import {
  assignInstructorMutation,
  getJobOptions,
  listJobApplicationsOptions,
  listJobApplicationsQueryKey,
  listJobsQueryKey,
  reviewApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';

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

export function JobApplicantReviewPage({
  jobUuid,
  applicationUuid,
}: {
  jobUuid: string;
  applicationUuid: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');

  const jobQuery = useQuery({
    ...getJobOptions({ path: { jobUuid } }),
    enabled: Boolean(jobUuid),
  });
  const job = jobQuery.data?.data ?? null;

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions({
      path: { jobUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(jobUuid),
  });
  const application =
    (applicationsQuery.data?.data?.content ?? []).find(item => item.uuid === applicationUuid) ??
    null;

  const instructorUuid = application?.instructor_uuid ?? null;
  const instructorIds = useMemo(() => (instructorUuid ? [instructorUuid] : []), [instructorUuid]);
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const instructor = instructorUuid ? (instructorMap[instructorUuid] ?? null) : null;

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: listJobApplicationsQueryKey({
        path: { jobUuid },
        query: { pageable: { page: 0, size: 100 } },
      }),
    });
    await queryClient.invalidateQueries({ queryKey: listJobsQueryKey({ query: { pageable: {} } }) });
  };

  const reviewMutation = useMutation({
    ...reviewApplicationMutation(),
    onSuccess: async () => {
      toast.success('Application reviewed successfully.');
      setReviewNotes('');
      await invalidate();
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to review this application.');
    },
  });

  const assignMutation = useMutation({
    ...assignInstructorMutation(),
    onSuccess: async () => {
      toast.success('Instructor assigned and class created.');
      await invalidate();
      router.push(`/dashboard/opportunities/${jobUuid}`);
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to assign this instructor.');
    },
  });

  const handleReview = (action: 'APPROVE' | 'REJECT') => {
    if (!application?.uuid) return;
    reviewMutation.mutate({
      path: { jobUuid, applicationUuid: application.uuid },
      query: { action },
      body: reviewNotes.trim() ? { review_notes: reviewNotes.trim() } : undefined,
    });
  };

  const handleAssign = () => {
    if (!application?.uuid) return;
    assignMutation.mutate({
      path: { jobUuid },
      body: { application_uuid: application.uuid },
    });
  };

  const isLoading =
    (jobQuery.isLoading && !jobQuery.data) ||
    (applicationsQuery.isLoading && !applicationsQuery.data);
  const notApprovedToTrain = application?.training_approved === false;
  const canReview = application?.status === 'pending';
  const canAssign = application?.status === 'approved';

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button
          variant='ghost'
          size='sm'
          className='w-fit px-0 text-muted-foreground'
          onClick={() => router.back()}
        >
          <ArrowLeft className='mr-2 size-4' />
          Back to applications
        </Button>

        <AdminPageHeader
          title={instructor?.full_name ?? 'Applicant review'}
          description={`Scrutinise this instructor's full profile before deciding on their application${job?.title ? ` for “${job.title}”` : ''}.`}
        />

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]'>
            <Skeleton className='h-96 rounded-md' />
            <Skeleton className='h-96 rounded-md' />
          </div>
        ) : !application ? (
          <div className={adminTheme.cardPadded}>
            <p className='text-sm text-muted-foreground'>
              This application could not be found. It may have been withdrawn or the job may have
              been cancelled.
            </p>
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]'>
            <InstructorReviewProfile
              instructorUuid={instructorUuid}
              instructor={instructor}
              extraBadges={
                <>
                  {typeof application.approved_rate === 'number' ? (
                    <Badge variant='outline' className='rounded-md'>
                      Approved rate: {formatCurrency(application.approved_rate)} / session
                    </Badge>
                  ) : null}
                  {typeof job?.training_fee === 'number' ? (
                    <Badge variant='outline' className='rounded-md'>
                      Job fee: {formatCurrency(job.training_fee)} / session
                    </Badge>
                  ) : null}
                </>
              }
            />

            <div className='h-fit space-y-4'>
              <SectionCard title='Application'>
                <div className='space-y-3 text-sm'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <StatusBadge status={application.status} label={formatLabel(application.status)} />
                    {application.instructor_admin_verified ? (
                      <StatusBadge status='verified' label='Verified' />
                    ) : application.instructor_admin_verified === false ? (
                      <StatusBadge status='pending' label='Unverified' />
                    ) : null}
                  </div>

                  {notApprovedToTrain ? (
                    <div className='flex items-center gap-2 rounded-md border border-warning/60 bg-warning/10 p-3 text-foreground'>
                      <TriangleAlert className='size-4 shrink-0 text-warning' />
                      <span>
                        Not approved to train this course or program yet — approval and assignment
                        are blocked.
                      </span>
                    </div>
                  ) : null}

                  <div>
                    <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                      Applied
                    </div>
                    <p className='mt-0.5'>{formatDate(application.created_date)}</p>
                  </div>

                  {application.reviewed_at ? (
                    <div>
                      <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                        Reviewed
                      </div>
                      <p className='mt-0.5'>
                        {formatDate(application.reviewed_at)}
                        {application.reviewed_by ? ` by ${application.reviewed_by}` : ''}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                      Application note
                    </div>
                    <p className='mt-0.5 whitespace-pre-line leading-6'>
                      {application.application_note || 'No application note provided.'}
                    </p>
                  </div>

                  {application.review_notes ? (
                    <div>
                      <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                        Review notes
                      </div>
                      <p className='mt-0.5 whitespace-pre-line leading-6'>
                        {application.review_notes}
                      </p>
                    </div>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title='Decision'>
                <div className='space-y-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='review-notes' className='text-sm font-medium'>
                      Review notes
                    </Label>
                    <Textarea
                      id='review-notes'
                      value={reviewNotes}
                      onChange={event => setReviewNotes(event.target.value)}
                      placeholder='Add optional notes for this decision...'
                      className='min-h-24'
                      disabled={!canReview}
                    />
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <Button
                      onClick={() => handleReview('APPROVE')}
                      disabled={!canReview || notApprovedToTrain || reviewMutation.isPending}
                    >
                      {reviewMutation.isPending ? (
                        <Spinner className='mr-2 size-4' />
                      ) : (
                        <CheckCircle2 className='mr-2 size-4' />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={() => handleReview('REJECT')}
                      disabled={!canReview || reviewMutation.isPending}
                    >
                      <XCircle className='mr-2 size-4' />
                      Reject
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={handleAssign}
                      disabled={!canAssign || notApprovedToTrain || assignMutation.isPending}
                    >
                      {assignMutation.isPending ? <Spinner className='mr-2 size-4' /> : null}
                      Assign & create class
                    </Button>
                  </div>

                  {!canReview && !canAssign ? (
                    <p className='text-xs text-muted-foreground'>
                      This application has already been finalised and can no longer be actioned.
                    </p>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
