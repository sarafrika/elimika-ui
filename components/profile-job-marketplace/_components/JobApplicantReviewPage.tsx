'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  TriangleAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AdminPageHeader,
  adminTheme,
  SectionCard,
  StatusBadge,
} from '@/app/dashboard/admin/_components/ui';
import { type RateBasis, rateBasisShort, rateBasisUnit } from '@/components/class-form';
import { InstructorReviewProfile } from '@/components/instructor-review/InstructorReviewProfile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJobDecisionRequest } from '@/services/client';
import {
  getJobOptions,
  listJobApplicationsOptions,
  reviewApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import {
  canRejectApplication,
  HIRING_STAGES,
  isClassCreatedStatus,
  isExitStatus,
  nextStepFor,
  stageIndexOf,
  statusLabel,
} from '../application-status';

const HIRED_INDEX = HIRING_STAGES.length - 1;

/** The endpoint is multiplexed on `action`, so each confirmation names the step actually taken. */
const DECISION_MESSAGES: Record<string, string> = {
  shortlist: 'Shortlisted. The applicant has been notified.',
  interview: 'Moved to interview. The applicant has the date.',
  offer: 'Offer made. The applicant has been notified.',
  hire: 'Hired. They have joined your organisation and this job is ready for its class.',
  reject: 'Application rejected. The applicant has been notified.',
};

/** Every decision endpoint refuses a job that has left OPEN, so each closed state says so plainly. */
const JOB_CLOSED_REASONS: Record<string, string> = {
  awaiting_class:
    'Another applicant was hired for this job, so no decision can be taken here. This application closes as Not selected once the class is created.',
  filled:
    'This job’s class has been created with another applicant, so this application can no longer be actioned.',
  cancelled: 'This job was cancelled, so no decision can be taken on this application.',
  expired: 'This job expired, so no decision can be taken on this application.',
};

const JOB_CLOSED_FALLBACK =
  'This job is no longer open, so no decision can be taken on this application.';

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not provided';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function toDateTimeInputValue(value?: string | Date | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** The backend stores interviews as a zone-free LocalDateTime, so the offset is stripped here. */
function toUtcLocalDateTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19);
}

/**
 * The whole funnel, always on screen: stages behind this applicant, the one they are in, the ones
 * still to come. Hiring is last — creating the class is not a stage and never appears here.
 */
function ApplicationStageRail({ status }: { status?: string | null }) {
  const closed = isExitStatus(status);
  // A created class means the funnel was walked to its end, so every stage sits behind it.
  const reached = isClassCreatedStatus(status) ? HIRED_INDEX : stageIndexOf(status);
  const tone = closed ? 'destructive' : reached === HIRED_INDEX ? 'success' : 'info';

  return (
    <SectionCard
      title='Where this applicant stands'
      description={
        closed
          ? `This application closed as ${statusLabel(status)}, so no stage remains.`
          : 'Hiring is the last decision. The class is created after it, and that is what puts the instructor on the job.'
      }
      actions={<StatusBadge status={status ?? undefined} tone={tone} label={statusLabel(status)} />}
    >
      <ol className='flex flex-wrap items-center gap-y-3'>
        {HIRING_STAGES.map((stage, index) => {
          const behind = !closed && index < reached;
          const here = !closed && index === reached;
          return (
            <li key={stage} className='flex items-center'>
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                  behind
                    ? 'border-success/40 bg-success/10 text-success'
                    : here
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/70 text-muted-foreground'
                )}
                aria-current={here ? 'step' : undefined}
              >
                {behind ? <Check className='size-3.5' /> : index + 1}
              </span>
              <span
                className={cn(
                  'ml-2 text-sm',
                  here ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {statusLabel(stage)}
              </span>
              {index < HIRED_INDEX ? (
                <span
                  aria-hidden
                  className={cn('mx-3 h-px w-8', behind ? 'bg-success/50' : 'bg-border')}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

export function JobApplicantReviewPage({
  jobUuid,
  applicationUuid,
}: {
  jobUuid: string;
  applicationUuid: string;
}) {
  const router = useRouter();
  const { activeDomain } = useUserDomain();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');
  const [interviewAt, setInterviewAt] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const jobQuery = useQuery({
    ...getJobOptions({ path: { jobUuid } }),
    enabled: Boolean(jobUuid),
  });
  const job = jobQuery.data?.data ?? null;
  const basisShort = rateBasisShort(job?.rate_basis as RateBasis);
  const basisUnit = rateBasisUnit(job?.rate_basis as RateBasis);

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

  const status = application?.status as string | undefined;
  // The one move this applicant can make. Never two, never one that skips a stage.
  const nextStep = nextStepFor(status);
  const isHired = stageIndexOf(status) === HIRED_INDEX;
  const classCreated = isClassCreatedStatus(status);
  const canReject = canRejectApplication(status);

  // A hire elsewhere — or a cancellation — takes the job out of OPEN and the server then refuses
  // every decision, so this applicant's funnel ends even while their own status names a live stage.
  const jobStatus = job?.status as string | undefined;
  const jobClosedToDecisions = Boolean(jobStatus) && jobStatus !== 'open';
  const decisionsClosed = Boolean(nextStep) && jobClosedToDecisions;
  const jobClosedReason = JOB_CLOSED_REASONS[jobStatus ?? ''] ?? JOB_CLOSED_FALLBACK;
  const forwardStep = decisionsClosed ? null : nextStep;
  const showReject = canReject && !decisionsClosed;
  const needsInterviewAt = forwardStep?.action === 'interview';

  const createClassHref = roleScopedDashboardPath(
    activeDomain,
    `/dashboard/opportunities/${jobUuid}/create-class`
  );
  const classesHref = roleScopedDashboardPath(activeDomain, '/dashboard/classes');

  const reviewMutation = useMutation({
    ...reviewApplicationMutation(),
    onSuccess: async (_response, variables) => {
      const action = String(variables?.query?.action ?? '');
      toast.success(DECISION_MESSAGES[action] ?? 'Applicant updated.');
      setReviewNotes('');
      setInterviewAt('');
      setTransitionError(null);
      await invalidateJobApplicationWorkflowQueries(queryClient);
    },
    onError: error => {
      // A refused skip names both stages, so the server's own words stand in for a generic toast.
      const message = getErrorMessage(error, 'Unable to move this application.');
      setTransitionError(message);
      toast.error(message);
    },
  });

  const buildBody = (scheduledInterviewAt?: string | null) => {
    const notes = reviewNotes.trim();
    if (!notes && !scheduledInterviewAt) return undefined;
    // The generated body types interview_at as a Date; the backend wants the zone-free string.
    return {
      ...(notes ? { review_notes: notes } : {}),
      ...(scheduledInterviewAt ? { interview_at: scheduledInterviewAt as unknown as Date } : {}),
    } satisfies ClassMarketplaceJobDecisionRequest;
  };

  const submitStep = () => {
    if (!application?.uuid || !forwardStep) return;

    const scheduledInterviewAt = needsInterviewAt ? toUtcLocalDateTime(interviewAt) : null;
    if (needsInterviewAt && !scheduledInterviewAt) {
      setTransitionError('Set the interview date and time before moving this applicant on.');
      return;
    }

    setTransitionError(null);
    reviewMutation.mutate({
      path: { jobUuid, applicationUuid: application.uuid },
      query: { action: forwardStep.action },
      body: buildBody(scheduledInterviewAt),
    });
  };

  const submitRejection = () => {
    if (!application?.uuid) return;
    setTransitionError(null);
    reviewMutation.mutate({
      path: { jobUuid, applicationUuid: application.uuid },
      query: { action: 'reject' },
      body: buildBody(),
    });
  };

  const isLoading =
    (jobQuery.isLoading && !jobQuery.data) ||
    (applicationsQuery.isLoading && !applicationsQuery.data);
  const notApprovedToTrain = application?.training_approved === false;
  const forwardBlocked = forwardStep?.action === 'hire' && notApprovedToTrain;
  const payBelowApprovedRate =
    typeof job?.instructor_pay === 'number' &&
    typeof application?.approved_rate === 'number' &&
    job.instructor_pay < application.approved_rate;

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button
          variant='ghost'
          size='sm'
          className='text-muted-foreground w-fit px-0'
          onClick={() => router.back()}
        >
          <ArrowLeft className='mr-2 size-4' />
          Back to applications
        </Button>

        <AdminPageHeader
          title={instructor?.full_name ?? 'Applicant review'}
          description={`Scrutinise this instructor's full profile before deciding on their application${job?.title ? ` for “${job.title}”` : ''}.`}
        />

        {application ? <ApplicationStageRail status={status} /> : null}

        {isHired ? (
          <div className='border-success/50 bg-success/10 flex flex-wrap items-start gap-3 rounded-md border p-4'>
            <UserCheck className='text-success mt-0.5 size-5 shrink-0' />
            <div className='min-w-0 text-sm'>
              <div className='text-foreground font-medium'>
                Hired — {instructor?.full_name ?? 'this instructor'} is now a member of your
                organisation
              </div>
              <p className='text-muted-foreground'>
                Nothing is left to assign. Creating this job’s class is what puts them on it, built
                from the sessions the job already holds.
              </p>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]'>
            <Skeleton className='h-96 rounded-md' />
            <Skeleton className='h-96 rounded-md' />
          </div>
        ) : !application ? (
          <div className={adminTheme.cardPadded}>
            <p className='text-muted-foreground text-sm'>
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
                      Approved rate: {formatCurrency(application.approved_rate)} / {basisShort}
                    </Badge>
                  ) : null}
                  {typeof job?.sale_price === 'number' ? (
                    <Badge variant='outline' className='rounded-md'>
                      Sale price: {formatCurrency(job.sale_price)} / {basisShort}
                    </Badge>
                  ) : null}
                  {typeof job?.instructor_pay === 'number' ? (
                    <Badge variant='outline' className='rounded-md'>
                      Instructor pay: {formatCurrency(job.instructor_pay)} / {basisShort}
                    </Badge>
                  ) : null}
                  {typeof job?.sale_price === 'number' &&
                  typeof job?.instructor_pay === 'number' ? (
                    <Badge variant='outline' className='rounded-md'>
                      Margin: {formatCurrency(job.sale_price - job.instructor_pay)} / {basisShort}
                    </Badge>
                  ) : null}
                </>
              }
            />

            <div className='h-fit space-y-4'>
              <SectionCard title='Application'>
                <div className='space-y-3 text-sm'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <StatusBadge
                      status={status}
                      tone={isHired || classCreated ? 'success' : undefined}
                      label={statusLabel(status)}
                    />
                    {application.instructor_admin_verified ? (
                      <StatusBadge status='verified' label='Verified' />
                    ) : application.instructor_admin_verified === false ? (
                      <StatusBadge status='pending' label='Unverified' />
                    ) : null}
                  </div>

                  {notApprovedToTrain ? (
                    <div className='border-warning/60 bg-warning/10 text-foreground flex items-center gap-2 rounded-md border p-3'>
                      <TriangleAlert className='text-warning size-4 shrink-0' />
                      <span>
                        Not approved to train this course or program yet — hiring is blocked.
                      </span>
                    </div>
                  ) : null}

                  {payBelowApprovedRate ? (
                    <div className='border-warning/60 bg-warning/10 text-foreground flex items-center gap-2 rounded-md border p-3'>
                      <TriangleAlert className='text-warning size-4 shrink-0' />
                      <span>
                        This job pays {formatCurrency(job?.instructor_pay)} per {basisUnit}, below
                        the {formatCurrency(application.approved_rate)} on this instructor’s rate
                        card. The hire will go through, but creating this job’s class will be
                        refused until you raise the instructor pay.
                      </span>
                    </div>
                  ) : null}

                  <div>
                    <div className='text-muted-foreground text-xs tracking-wide uppercase'>
                      Applied
                    </div>
                    <p className='mt-0.5'>{formatDate(application.created_date)}</p>
                  </div>

                  {application.interview_at ? (
                    <div>
                      <div className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Interview
                      </div>
                      <p className='mt-0.5'>{formatDate(application.interview_at)}</p>
                    </div>
                  ) : null}

                  {application.reviewed_at ? (
                    <div>
                      <div className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Reviewed
                      </div>
                      <p className='mt-0.5'>
                        {formatDate(application.reviewed_at)}
                        {application.reviewed_by ? ` by ${application.reviewed_by}` : ''}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <div className='text-muted-foreground text-xs tracking-wide uppercase'>
                      Application note
                    </div>
                    <p className='mt-0.5 leading-6 whitespace-pre-line'>
                      {application.application_note || 'No application note provided.'}
                    </p>
                  </div>

                  {application.review_notes ? (
                    <div>
                      <div className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Review notes
                      </div>
                      <p className='mt-0.5 leading-6 whitespace-pre-line'>
                        {application.review_notes}
                      </p>
                    </div>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard title='Decision'>
                <div className='space-y-3'>
                  {forwardStep || showReject ? (
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
                  ) : null}

                  {needsInterviewAt ? (
                    <div className='space-y-2'>
                      <Label htmlFor='interview-at' className='text-sm font-medium'>
                        Interview date and time
                      </Label>
                      <Input
                        id='interview-at'
                        type='datetime-local'
                        value={interviewAt}
                        min={toDateTimeInputValue(new Date())}
                        onChange={event => setInterviewAt(event.target.value)}
                      />
                    </div>
                  ) : null}

                  {transitionError ? (
                    <div
                      role='alert'
                      className='border-destructive/50 bg-destructive/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'
                    >
                      <TriangleAlert className='text-destructive mt-0.5 size-4 shrink-0' />
                      <span>{transitionError}</span>
                    </div>
                  ) : null}

                  {decisionsClosed ? (
                    <div className='border-border bg-muted/40 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'>
                      <TriangleAlert className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                      <span>{jobClosedReason}</span>
                    </div>
                  ) : null}

                  <div className='flex flex-wrap gap-2'>
                    {forwardStep ? (
                      <Button
                        onClick={submitStep}
                        disabled={forwardBlocked || reviewMutation.isPending}
                      >
                        {reviewMutation.isPending ? (
                          <Spinner className='mr-2 size-4' />
                        ) : (
                          <ArrowRight className='mr-2 size-4' />
                        )}
                        {forwardStep.label}
                      </Button>
                    ) : isHired ? (
                      <Button asChild>
                        <Link href={createClassHref}>
                          <BriefcaseBusiness className='mr-2 size-4' />
                          Create the class
                        </Link>
                      </Button>
                    ) : classCreated ? (
                      <Button asChild variant='outline'>
                        <Link href={classesHref}>
                          <BriefcaseBusiness className='mr-2 size-4' />
                          View the class
                        </Link>
                      </Button>
                    ) : null}

                    {showReject ? (
                      <Button
                        variant='outline'
                        className='text-destructive'
                        onClick={submitRejection}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className='mr-2 size-4' />
                        Reject
                      </Button>
                    ) : null}
                  </div>

                  {forwardStep ? (
                    <p className='text-muted-foreground text-xs'>
                      {forwardStep.label} moves this applicant to {statusLabel(forwardStep.leadsTo)}
                      . No stage can be skipped, so this is the only way forward.
                    </p>
                  ) : isHired ? (
                    <p className='text-muted-foreground text-xs'>
                      The funnel ends here. Creating the class assigns them, converts the times held
                      for this job and closes the other applicants out.
                    </p>
                  ) : classCreated ? (
                    <p className='text-muted-foreground text-xs'>
                      This job’s class has been created and this instructor is on it.
                    </p>
                  ) : decisionsClosed ? null : (
                    <p className='text-muted-foreground text-xs'>
                      This application closed as {statusLabel(status)} and can no longer be
                      actioned.
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
