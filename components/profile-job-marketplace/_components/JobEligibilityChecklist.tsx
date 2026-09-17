'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleCheck, CircleX, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { SchedulingConflictAlert } from '@/components/scheduling/scheduling-conflict-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { formatRateAmount, formatRateBasis, getRateBasis, rateFor } from '@/lib/rate-card';
import type { SchedulingConflict } from '@/lib/scheduling-conflicts';
import { cn } from '@/lib/utils';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobEligibility,
} from '@/services/client/types.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { serviceLabel } from '@/src/features/organisation/jobs/lib/job-stage';
import { useRateUpdates } from '@/src/features/rate-card/hooks';
import type { TrainingApplicationKind } from '@/src/features/rate-card/types';

type CheckState = 'pass' | 'fail' | 'pending';

/** Where the instructor's rate stands against this job's format, delivery and basis. */
export type RateStanding =
  | { kind: 'ok'; approvedRate: number | null }
  | { kind: 'above_pay'; approvedRate: number }
  | { kind: 'resolving' }
  | { kind: 'awaiting'; creatorName: string | null }
  | { kind: 'missing' };

export type PendingRate = { loading: boolean; awaiting: boolean; creatorName: string | null };

const ICONS = { pass: CircleCheck, fail: CircleX, pending: Clock3 } as const;
const ICON_TONES: Record<CheckState, string> = {
  pass: 'text-success',
  fail: 'text-destructive',
  pending: 'text-warning',
};
const STATE_LABELS: Record<CheckState, string> = {
  pass: 'Passed',
  fail: 'Not met',
  pending: 'Pending',
};
const CHECK_ROWS = ['verified', 'training', 'rate', 'schedule'];

const contentKind = (job: ClassMarketplaceJob): TrainingApplicationKind =>
  job.program_uuid ? 'program' : 'course';

const contentNoun = (job: ClassMarketplaceJob) =>
  contentKind(job) === 'program' ? 'training program' : 'course';

/** "per session", or null when the job carries no basis (never guess hour). */
const basisPhrase = (job: ClassMarketplaceJob) =>
  job.rate_basis ? formatRateBasis(job.rate_basis) : null;

const withPhrase = (text: string, phrase: string | null) => (phrase ? `${text} ${phrase}` : text);

/** "Group session · billed per session · pays KES 6,000". */
export function jobTermsSummary(job: ClassMarketplaceJob) {
  return [
    serviceLabel(job.service_type, job.session_format),
    job.rate_basis ? `billed ${formatRateBasis(job.rate_basis)}` : null,
    typeof job.instructor_pay === 'number'
      ? `pays ${formatRateAmount(job.instructor_pay)}`
      : 'pay not specified',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Deep link into the instructor's rate card, opened on this job's course or program and basis. */
export function rateCardHref(job: ClassMarketplaceJob) {
  const parent = job.program_uuid ?? job.course_uuid;
  if (!parent) return dashboardUrl('instructor', 'rate-card');
  const params = new URLSearchParams({ kind: contentKind(job), parent });
  if (job.rate_basis) params.set('basis', job.rate_basis);
  return dashboardUrl('instructor', `rate-card?${params.toString()}`);
}

/** Finds a pending rate update on the instructor's own application that would cover this job. */
export function usePendingRateUpdate({
  job,
  instructorUuid,
  creatorUuid,
  enabled,
}: {
  job: ClassMarketplaceJob | null;
  instructorUuid?: string | null;
  creatorUuid?: string | null;
  enabled: boolean;
}): PendingRate {
  const kind: TrainingApplicationKind = job ? contentKind(job) : 'course';
  const parentUuid = (kind === 'program' ? job?.program_uuid : job?.course_uuid) ?? null;
  const ready = enabled && Boolean(instructorUuid && parentUuid);
  const query = {
    searchParams: {
      applicant_uuid_eq: instructorUuid ?? '',
      applicant_type_eq: 'instructor',
      [kind === 'program' ? 'program_uuid_eq' : 'course_uuid_eq']: parentUuid ?? '',
    },
    pageable: { page: 0, size: 10 },
  };

  const courseSearch = useQuery({
    ...searchTrainingApplicationsOptions({ query }),
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'course',
  });
  const programSearch = useQuery({
    ...searchProgramTrainingApplicationsOptions({ query }),
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'program',
  });
  const search = kind === 'course' ? courseSearch : programSearch;
  const applications =
    (kind === 'course' ? courseSearch.data?.data?.content : programSearch.data?.data?.content) ??
    [];
  const applicationUuid =
    applications.find(application => application.pending_rate_update_uuid)?.uuid ?? null;

  const { pending, query: updatesQuery } = useRateUpdates(
    kind,
    parentUuid,
    ready ? applicationUuid : null
  );

  const awaiting = Boolean(
    ready &&
      pending &&
      job?.session_format &&
      job.location_type &&
      job.rate_basis &&
      rateFor(pending.proposed_rate_card, {
        format: job.session_format,
        delivery: job.location_type,
        basis: job.rate_basis,
      }) !== null
  );

  const creatorIds = useMemo(
    () => (awaiting && creatorUuid ? [creatorUuid] : []),
    [awaiting, creatorUuid]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);

  return {
    loading: ready && (search.isLoading || (Boolean(applicationUuid) && updatesQuery.isLoading)),
    awaiting,
    creatorName: (creatorUuid && courseCreatorMap[creatorUuid]?.full_name) || null,
  };
}

export function rateStandingFor(
  eligibility: ClassMarketplaceJobEligibility,
  pendingRate: PendingRate
): RateStanding {
  if (eligibility.rate_ok !== false) {
    return { kind: 'ok', approvedRate: eligibility.approved_rate ?? null };
  }
  if (typeof eligibility.approved_rate === 'number') {
    return { kind: 'above_pay', approvedRate: eligibility.approved_rate };
  }
  if (pendingRate.loading) return { kind: 'resolving' };
  if (pendingRate.awaiting) return { kind: 'awaiting', creatorName: pendingRate.creatorName };
  return { kind: 'missing' };
}

/** Whether the apply button is blocked, and the reason shown under it. */
export function applyGate(
  eligibility: ClassMarketplaceJobEligibility | undefined,
  rate: RateStanding | null
): { blocked: boolean; hint: string | null } {
  if (!eligibility || eligibility.eligible !== false) return { blocked: false, hint: null };
  const reason = eligibility.reason ?? 'You are not currently eligible to apply for this job.';
  const earlierCheckFails =
    eligibility.instructor_verified === false || eligibility.training_approved === false;
  if (!earlierCheckFails && rate?.kind === 'awaiting') {
    return { blocked: true, hint: "You can apply once the rate is approved. We'll let you know." };
  }
  if (!earlierCheckFails && rate?.kind === 'missing') {
    return { blocked: true, hint: 'Jobs can only hire you on a basis you have an approved rate for.' };
  }
  if (!earlierCheckFails && rate?.kind === 'resolving') return { blocked: true, hint: null };
  return { blocked: true, hint: reason };
}

function CheckRow({
  state,
  children,
  detail,
}: {
  state: CheckState;
  children: ReactNode;
  detail?: ReactNode;
}) {
  const Icon = ICONS[state];
  return (
    <li className='flex items-start gap-3'>
      <Icon aria-hidden className={cn('mt-0.5 size-4.5 shrink-0', ICON_TONES[state])} />
      <div className='min-w-0 flex-1 space-y-2 text-sm'>
        <p className='text-foreground'>
          <span className='sr-only'>{STATE_LABELS[state]}: </span>
          {children}
        </p>
        {detail}
      </div>
    </li>
  );
}

function CheckRowSkeleton() {
  return (
    <li className='flex items-center gap-3'>
      <Skeleton className='size-4.5 shrink-0 rounded-full' />
      <Skeleton className='h-4 w-full max-w-72' />
    </li>
  );
}

function ChecklistSkeleton() {
  return (
    <ul aria-hidden className='space-y-3'>
      {CHECK_ROWS.map(row => (
        <CheckRowSkeleton key={row} />
      ))}
    </ul>
  );
}

function RateRow({
  job,
  rate,
  reason,
}: {
  job: ClassMarketplaceJob;
  rate: RateStanding;
  reason?: string | null;
}) {
  const phrase = basisPhrase(job);

  switch (rate.kind) {
    case 'resolving':
      return <CheckRowSkeleton />;
    case 'ok':
      return (
        <CheckRow state='pass'>
          {rate.approvedRate === null
            ? "Your approved rate fits under this job's pay."
            : `${withPhrase(`Your approved rate ${formatRateAmount(rate.approvedRate)}`, phrase)} fits under this job's pay.`}
        </CheckRow>
      );
    case 'above_pay':
      return (
        <CheckRow state='fail'>
          {typeof job.instructor_pay === 'number'
            ? `${withPhrase(`Your approved rate of ${formatRateAmount(rate.approvedRate)}`, phrase)} is above this job's pay of ${formatRateAmount(job.instructor_pay)}.`
            : (reason ?? "Your approved rate is above this job's pay.")}
        </CheckRow>
      );
    case 'awaiting':
      return (
        <CheckRow state='pending'>
          {`${job.rate_basis ? `${getRateBasis(job.rate_basis).label} rate` : 'Rate'} added to your rate card, awaiting approval. It goes live once ${rate.creatorName ?? 'the course creator'} approves it.`}
        </CheckRow>
      );
    case 'missing': {
      const scope = job.session_format === 'INDIVIDUAL' ? 'private' : 'group';
      const where = job.location_type === 'ONLINE' ? 'online' : 'in person';
      return (
        <CheckRow
          state='fail'
          detail={
            <Button asChild variant='outline' size='sm'>
              <Link href={rateCardHref(job)}>
                {phrase ? `Add a ${phrase} rate to my rate card` : 'Add this rate to my rate card'}
              </Link>
            </Button>
          }
        >
          {`Your rate card has no ${phrase ? `${phrase} ` : ''}rate for ${scope} classes ${where}.`}
        </CheckRow>
      );
    }
  }
}

/** The "Can you apply?" rows: verification, training approval, rate and schedule. */
export function JobEligibilityChecklist({
  job,
  eligibility,
  rate,
  loading,
  error,
  onRetry,
  conflicts,
  timeZone,
  refusal,
}: {
  job: ClassMarketplaceJob;
  eligibility: ClassMarketplaceJobEligibility | undefined;
  rate: RateStanding | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  conflicts: SchedulingConflict[];
  timeZone?: string | null;
  refusal?: string | null;
}) {
  const noun = contentNoun(job);
  const scheduleClear = eligibility?.schedule_clear !== false && conflicts.length === 0;

  return (
    <AsyncSection
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeleton={<ChecklistSkeleton />}
      errorTitle='Couldn’t check whether you can apply'
    >
      {eligibility && rate ? (
        <div className='space-y-3'>
          <ul className='space-y-3'>
            <CheckRow
              state={eligibility.instructor_verified === false ? 'fail' : 'pass'}
              detail={
                eligibility.instructor_verified === false ? (
                  <p className='text-muted-foreground'>
                    An administrator has to verify your instructor profile first.
                  </p>
                ) : null
              }
            >
              Verified instructor
            </CheckRow>
            <CheckRow
              state={eligibility.training_approved === false ? 'fail' : 'pass'}
              detail={
                eligibility.training_approved === false ? (
                  <p className='text-muted-foreground'>
                    Your application to train this {noun} isn’t approved yet.
                  </p>
                ) : null
              }
            >
              Approved to train this {noun}
            </CheckRow>
            <RateRow job={job} rate={rate} reason={eligibility.reason} />
            <CheckRow
              state={scheduleClear ? 'pass' : 'fail'}
              detail={
                <SchedulingConflictAlert
                  title='Sessions that clash with your existing schedule'
                  timeZone={timeZone}
                  conflicts={conflicts}
                />
              }
            >
              {scheduleClear
                ? 'No clashes with your calendar'
                : 'Some sessions clash with your calendar'}
            </CheckRow>
          </ul>
          {refusal ? (
            <p
              role='alert'
              className='border-destructive/30 bg-destructive/5 text-destructive rounded-md border p-3 text-sm'
            >
              {refusal}
            </p>
          ) : null}
        </div>
      ) : null}
    </AsyncSection>
  );
}
