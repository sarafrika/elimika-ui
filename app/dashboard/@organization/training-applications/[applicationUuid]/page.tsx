'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AdminPageHeader,
  adminTheme,
  SectionCard,
  StatusBadge,
} from '@/app/dashboard/@admin/_components/ui';
import { InstructorReviewProfile } from '@/components/instructor-review/InstructorReviewProfile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCoursesByIds, useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { formatCurrency } from '@/lib/format-currency';
import {
  decideOnTrainingApplicationMutation,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

type ReviewAction = 'APPROVE' | 'REJECT' | 'REVOKE';

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

export default function TrainingApplicantReviewPage() {
  const params = useParams();
  const applicationUuid = params?.applicationUuid as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');

  const applicationQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { uuid_eq: applicationUuid },
        pageable: { page: 0, size: 1 },
      },
    }),
    enabled: Boolean(applicationUuid),
  });
  const application = applicationQuery.data?.data?.content?.[0] ?? null;

  const isInstructor = application?.applicant_type === 'instructor';
  const instructorUuid = isInstructor ? (application?.applicant_uuid ?? null) : null;
  const instructorIds = useMemo(() => (instructorUuid ? [instructorUuid] : []), [instructorUuid]);
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const instructor = instructorUuid ? (instructorMap[instructorUuid] ?? null) : null;

  const courseIds = useMemo(
    () => (application?.course_uuid ? [application.course_uuid] : []),
    [application?.course_uuid]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const courseName = application?.course_uuid
    ? (courseMap[application.course_uuid]?.name ?? 'this course')
    : 'this course';

  const decideMutation = useMutation({
    ...decideOnTrainingApplicationMutation(),
    onSuccess: async () => {
      toast.success('Decision recorded successfully.');
      setReviewNotes('');
      await queryClient.invalidateQueries({
        queryKey: searchTrainingApplicationsQueryKey({
          query: {
            searchParams: { uuid_eq: applicationUuid },
            pageable: { page: 0, size: 1 },
          },
        }),
      });
      await applicationQuery.refetch();
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Unable to record a decision for this application.'
      );
    },
  });

  const handleDecision = (action: ReviewAction) => {
    if (!application?.course_uuid || !application.uuid) {
      toast.error('This application is missing its course or identifier and cannot be reviewed.');
      return;
    }
    decideMutation.mutate({
      path: {
        courseUuid: application.course_uuid,
        applicationUuid: application.uuid,
      },
      query: { action },
      body: { review_notes: reviewNotes },
    });
  };

  const isLoading = applicationQuery.isLoading && !applicationQuery.data;
  const rateCard = application?.rate_card;
  const applicantName = isInstructor
    ? (instructor?.full_name ?? 'Instructor applicant')
    : 'Organisation applicant';

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
          Back to training applications
        </Button>

        <AdminPageHeader
          title={applicantName}
          description={`Scrutinise this applicant's full profile before deciding on their application to train ${courseName}.`}
        />

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]'>
            <Skeleton className='h-96 rounded-md' />
            <Skeleton className='h-96 rounded-md' />
          </div>
        ) : !application ? (
          <div className={adminTheme.cardPadded}>
            <p className='text-sm text-muted-foreground'>
              This training application could not be found. It may have been withdrawn.
            </p>
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]'>
            {isInstructor ? (
              <InstructorReviewProfile instructorUuid={instructorUuid} instructor={instructor} />
            ) : (
              <div className={adminTheme.cardPadded}>
                <div className='flex items-start gap-3'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
                    <Building2 className='size-6' />
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold tracking-tight text-foreground'>
                      Organisation applicant
                    </h2>
                    <p className='mt-0.5 text-sm text-muted-foreground'>
                      This application was submitted by an organisation, so no instructor dossier is
                      available.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className='h-fit space-y-4'>
              <SectionCard title='Application'>
                <div className='space-y-3 text-sm'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <StatusBadge
                      status={application.status}
                      label={formatLabel(application.status)}
                    />
                    <Badge variant='outline' className='rounded-md'>
                      {isInstructor ? 'Instructor' : 'Organisation'}
                    </Badge>
                  </div>

                  <div>
                    <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                      Course
                    </div>
                    <p className='mt-0.5 font-medium'>{courseName}</p>
                  </div>

                  {rateCard ? (
                    <div>
                      <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                        Rate card (per hour)
                      </div>
                      <div className='mt-1 grid grid-cols-2 gap-2 text-xs'>
                        <div className='rounded-md border bg-muted/20 p-2'>
                          <div className='text-muted-foreground'>Private online</div>
                          <div className='font-semibold'>
                            {formatCurrency(rateCard.private_online_rate, rateCard.currency || 'KES')}
                          </div>
                        </div>
                        <div className='rounded-md border bg-muted/20 p-2'>
                          <div className='text-muted-foreground'>Private in-person</div>
                          <div className='font-semibold'>
                            {formatCurrency(rateCard.private_inperson_rate, rateCard.currency || 'KES')}
                          </div>
                        </div>
                        <div className='rounded-md border bg-muted/20 p-2'>
                          <div className='text-muted-foreground'>Group online</div>
                          <div className='font-semibold'>
                            {formatCurrency(rateCard.group_online_rate, rateCard.currency || 'KES')}
                          </div>
                        </div>
                        <div className='rounded-md border bg-muted/20 p-2'>
                          <div className='text-muted-foreground'>Group in-person</div>
                          <div className='font-semibold'>
                            {formatCurrency(rateCard.group_inperson_rate, rateCard.currency || 'KES')}
                          </div>
                        </div>
                      </div>
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
                      {application.application_notes || 'No application note provided.'}
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
                    />
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {application.status === 'pending' || application.status === 'rejected' ? (
                      <Button
                        onClick={() => handleDecision('APPROVE')}
                        disabled={decideMutation.isPending}
                      >
                        {decideMutation.isPending ? (
                          <Spinner className='mr-2 size-4' />
                        ) : (
                          <CheckCircle2 className='mr-2 size-4' />
                        )}
                        {application.status === 'rejected' ? 'Reconsider & approve' : 'Approve'}
                      </Button>
                    ) : null}
                    {application.status === 'pending' ? (
                      <Button
                        variant='destructive'
                        onClick={() => handleDecision('REJECT')}
                        disabled={decideMutation.isPending}
                      >
                        <XCircle className='mr-2 size-4' />
                        Reject
                      </Button>
                    ) : null}
                    {application.status === 'approved' ? (
                      <Button
                        variant='destructive'
                        onClick={() => handleDecision('REVOKE')}
                        disabled={decideMutation.isPending}
                      >
                        <XCircle className='mr-2 size-4' />
                        Revoke approval
                      </Button>
                    ) : null}
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
