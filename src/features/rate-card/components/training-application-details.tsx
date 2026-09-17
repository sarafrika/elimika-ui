'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GitCompareArrows, Layers, Pencil, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { SectionError } from '@/components/data/async-section';
import { RateCardGrid, RateCardGridSkeleton } from '@/components/rate-card/rate-card-grid';
import { RateUpdateStatus } from '@/components/rate-card/rate-update-status';
import { UpdateRatesDialog } from '@/components/rate-card/update-rates-dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { dayjs } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { DEFAULT_CURRENCY, formatRateAmount, missingCells, offeredMethods } from '@/lib/rate-card';
import {
  getCourseByUuidOptions,
  getTrainingProgramByUuidOptions,
  withdrawProgramTrainingApplicationMutation,
  withdrawTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { creatorRole } from '../application-display';
import { useApplicationHistory, useRateUpdates, useTrainingApplication } from '../hooks';
import type { TrainingApplication, TrainingApplicationKind, TrainingRateUpdate } from '../types';
import {
  ApplicationHistoryList,
  DetailSection,
  DetailSectionSkeleton,
  formatApplicationDate,
  OfferedVenuesList,
  RequirementAnswersTable,
} from './application-sections';
import { ApplicationStatusBadge } from './application-status-badge';
import { ApplicationTracker, type TrackStep } from './application-tracker';

export type TrainingApplicationDetailsProps = {
  kind: TrainingApplicationKind;
  parentUuid: string;
  applicationUuid: string;
  applicantName?: string | null;
  /** The viewer is the applicant (the instructor, or a manager of the organisation). */
  canAct: boolean;
  backHref: string;
  backLabel: string;
  editHref: string;
  reapplyHref: string;
  onWithdrawn?: () => void;
};

const shortDate = (value: Date | string | null | undefined) =>
  value ? dayjs(value).format('D MMM, h:mm A') : undefined;

/** One training application from the applicant's side: progress, rate card, offer and history. */
export function TrainingApplicationDetails({
  kind,
  parentUuid,
  applicationUuid,
  applicantName,
  canAct,
  backHref,
  backLabel,
  editHref,
  reapplyHref,
  onWithdrawn,
}: TrainingApplicationDetailsProps) {
  const queryClient = useQueryClient();
  const { application, query } = useTrainingApplication(kind, parentUuid, applicationUuid);
  const { events, query: historyQuery } = useApplicationHistory(kind, parentUuid, applicationUuid);
  const pendingUpdateUuid =
    application?.status === 'approved' ? (application.pending_rate_update_uuid ?? null) : null;
  const updates = useRateUpdates(kind, parentUuid, pendingUpdateUuid ? applicationUuid : null);
  const pendingUpdate = pendingUpdateUuid ? updates.pending : null;

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: parentUuid } }),
    enabled: kind === 'course' && Boolean(parentUuid),
    staleTime: STALE_TIMES.entity,
  });
  const programQuery = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: parentUuid } }),
    enabled: kind === 'program' && Boolean(parentUuid),
    staleTime: STALE_TIMES.entity,
  });
  const course = courseQuery.data?.data;
  const program = programQuery.data?.data;
  const title = kind === 'course' ? course?.name : program?.title;
  const creatorUuid =
    (kind === 'course' ? course?.course_creator_uuid : program?.course_creator_uuid) ?? '';
  const creatorIds = useMemo(() => (creatorUuid ? [creatorUuid] : []), [creatorUuid]);
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);
  const creatorName = courseCreatorMap[creatorUuid]?.full_name ?? null;
  const minimum = kind === 'course' ? (course?.minimum_training_fee ?? null) : null;

  const [ratesOpen, setRatesOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [compare, setCompare] = useState(false);

  const withdrawCourse = useMutation(withdrawTrainingApplicationMutation());
  const withdrawProgram = useMutation(withdrawProgramTrainingApplicationMutation());
  const withdrawing = withdrawCourse.isPending || withdrawProgram.isPending;

  const withdraw = () => {
    const callbacks = {
      onSuccess: async () => {
        await invalidateTrainingApplicationWorkflowQueries(queryClient);
        toast.success('Application withdrawn.');
        setWithdrawOpen(false);
        onWithdrawn?.();
      },
      onError: (error: unknown) =>
        toast.error(getErrorMessage(error, 'Could not withdraw this application.')),
    };
    if (kind === 'course')
      withdrawCourse.mutate({ path: { courseUuid: parentUuid, applicationUuid } }, callbacks);
    else withdrawProgram.mutate({ path: { programUuid: parentUuid, applicationUuid } }, callbacks);
  };

  const refreshing = query.isFetching || historyQuery.isFetching || updates.query.isFetching;
  const refresh = () => {
    void query.refetch();
    void historyQuery.refetch();
    if (pendingUpdateUuid) void updates.query.refetch();
  };

  const role = creatorRole(kind);
  const creatorLabel = creatorName ?? `The ${role}`;
  const status = application?.status;
  const loading = query.isLoading && !application;

  return (
    <div className='space-y-5'>
      <div className='space-y-3'>
        <Link
          href={backHref}
          className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
        >
          <ArrowLeft aria-hidden className='size-4' />
          {backLabel}
        </Link>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0 space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              {loading ? (
                <Skeleton className='h-5 w-44' />
              ) : (
                <ApplicationStatusBadge
                  status={status}
                  kind={kind}
                  hasPendingUpdate={Boolean(pendingUpdateUuid)}
                />
              )}
              <Badge variant='outline' className='capitalize'>
                {kind}
              </Badge>
              <span className='text-muted-foreground text-xs'>
                Application #{applicationUuid.slice(0, 8).toUpperCase()}
              </span>
            </div>
            {title ? (
              <h1 className='text-foreground text-2xl font-semibold'>{title}</h1>
            ) : (
              <Skeleton className='h-8 w-80 max-w-full' />
            )}
            <p className='text-muted-foreground text-sm'>
              {applicantName ?? 'You'} applying to train · {kind} by {creatorName ?? `its ${role}`}
            </p>
          </div>
          {canAct && application ? (
            <div className='flex flex-wrap gap-2'>
              {status === 'pending' ? (
                <>
                  <Button asChild variant='outline'>
                    <Link href={editHref}>
                      <Pencil aria-hidden />
                      Edit application
                    </Link>
                  </Button>
                  <Button variant='ghost' onClick={() => setWithdrawOpen(true)}>
                    Withdraw
                  </Button>
                </>
              ) : null}
              {status === 'approved' && !pendingUpdateUuid ? (
                <Button onClick={() => setRatesOpen(true)}>
                  <Layers aria-hidden />
                  Update rates
                </Button>
              ) : null}
              {status === 'rejected' || status === 'revoked' ? (
                <Button asChild>
                  <Link href={reapplyHref}>Apply again with changes</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {query.error && !application ? (
        <SectionError
          title='Couldn’t load this application'
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : loading || !application ? (
        <Skeleton className='h-40 w-full rounded-xl' />
      ) : (
        <ApplicationTracker
          steps={trackSteps(application, pendingUpdate, kind)}
          checkedAt={query.dataUpdatedAt}
          refreshing={refreshing}
          onRefresh={refresh}
          note={nextStepNote(application, { creator: creatorLabel, pendingUpdateUuid, kind })}
          noteTone={status === 'rejected' || status === 'revoked' ? 'danger' : 'info'}
        />
      )}

      <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='min-w-0 space-y-5'>
          {application ? (
            <DetailSection
              title='Rate card'
              description={`${application.rate_card?.currency || DEFAULT_CURRENCY} per learner.`}
              aside={
                minimum
                  ? `Course minimum ${formatRateAmount(minimum, application.rate_card?.currency)}`
                  : null
              }
            >
              <div className='space-y-3'>
                {pendingUpdateUuid ? (
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <RateUpdateStatus
                      kind={kind}
                      parentUuid={parentUuid}
                      applicationUuid={applicationUuid}
                      pendingUpdateUuid={pendingUpdateUuid}
                      canWithdraw={canAct}
                    />
                    {pendingUpdate ? (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        aria-pressed={compare}
                        onClick={() => setCompare(value => !value)}
                      >
                        <GitCompareArrows aria-hidden />
                        {compare ? 'Show approved rates' : 'Compare proposed rates'}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {status === 'approved' && !pendingUpdateUuid ? (
                  <MissingRatesNote count={missingCells(application.rate_card).length} />
                ) : null}
                {compare && pendingUpdate ? (
                  <RateCardGrid
                    mode='diff'
                    value={pendingUpdate.proposed_rate_card}
                    compareTo={application.rate_card}
                  />
                ) : (
                  <RateCardGrid mode='view' value={application.rate_card} />
                )}
              </div>
            </DetailSection>
          ) : (
            <RateCardGridSkeleton />
          )}

          {application?.applicant_type === 'organisation' ? (
            <DetailSection
              title='Where you’ll teach'
              description='Venues at your branches, offered with this application.'
            >
              <OfferedVenuesList venues={application.offered_venues} />
            </DetailSection>
          ) : loading ? (
            <DetailSectionSkeleton rows={2} />
          ) : null}

          {application ? (
            <DetailSection
              title={kind === 'program' ? 'Program requirements' : 'Course requirements'}
              description={`What the ${kind} needs, and how you’ll provide it.`}
              flush
            >
              <RequirementAnswersTable
                answers={application.requirement_answers}
                hasItLabel='You have it'
              />
            </DetailSection>
          ) : (
            <DetailSectionSkeleton />
          )}
        </div>

        <aside className='space-y-5'>
          {application ? (
            <DetailSection title='Summary'>
              <dl className='space-y-3 text-sm'>
                <SummaryItem label='Methods offered'>
                  {offeredMethods(application.rate_card)
                    .map(method => method.label)
                    .join(' · ') || 'None'}
                </SummaryItem>
                <SummaryItem label='Submitted'>
                  {formatApplicationDate(application.created_date)}
                  {submitterName(events) ? ` by ${submitterName(events)}` : ''}
                </SummaryItem>
                <SummaryItem
                  label={role === 'course creator' ? 'Course creator' : 'Program creator'}
                >
                  {creatorName ?? '—'}
                </SummaryItem>
              </dl>
            </DetailSection>
          ) : (
            <DetailSectionSkeleton rows={3} />
          )}

          {application ? (
            <DetailSection title='Notes'>
              <dl className='space-y-3 text-sm'>
                <SummaryItem label={canAct ? 'Your note' : 'Applicant’s note'}>
                  {application.application_notes || 'No note.'}
                </SummaryItem>
                {application.review_notes ? (
                  <SummaryItem label={`${creatorName ?? `The ${role}`}’s note`}>
                    {application.review_notes}
                  </SummaryItem>
                ) : null}
              </dl>
            </DetailSection>
          ) : null}

          <DetailSection title='History'>
            {historyQuery.error ? (
              <SectionError
                title='Couldn’t load the history'
                error={historyQuery.error}
                onRetry={() => void historyQuery.refetch()}
              />
            ) : historyQuery.isLoading ? (
              <div className='space-y-3'>
                {[0, 1, 2].map(index => (
                  <Skeleton key={index} className='h-9 w-full' />
                ))}
              </div>
            ) : (
              <ApplicationHistoryList events={events} />
            )}
          </DetailSection>
        </aside>
      </div>

      {application && canAct && status === 'approved' ? (
        <UpdateRatesDialog
          open={ratesOpen}
          onOpenChange={setRatesOpen}
          kind={kind}
          parentUuid={parentUuid}
          applicationUuid={applicationUuid}
          title={title ?? `This ${kind}`}
          currentCard={application.rate_card}
          creatorName={creatorName}
          minimum={minimum}
        />
      ) : null}

      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {creatorLabel} will no longer review your application to train{' '}
              <span className='text-foreground font-medium'>{title ?? `this ${kind}`}</span>. You
              can apply again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                withdraw();
              }}
              disabled={withdrawing}
            >
              {withdrawing ? <Spinner className='h-4 w-4' /> : null}
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className='text-muted-foreground text-xs font-medium'>{label}</dt>
      <dd className='text-foreground mt-0.5'>{children}</dd>
    </div>
  );
}

function MissingRatesNote({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p className='border-warning/50 bg-warning/10 text-foreground flex items-start gap-2 rounded-lg border p-3 text-sm'>
      <TriangleAlert aria-hidden className='text-warning mt-0.5 size-4 shrink-0' />
      <span>
        <strong>
          {count} {count === 1 ? 'rate' : 'rates'} missing.
        </strong>{' '}
        Jobs billed on a missing basis can’t hire you for that method until you add them.
      </span>
    </p>
  );
}

function submitterName(events: { event_type?: string; actor_name?: string | null }[]) {
  return events.find(event => event.event_type === 'submitted')?.actor_name ?? null;
}

/** Submitted → Opened → Decision → Rate card active; an update swaps in its own two stages. */
export function trackSteps(
  application: TrainingApplication,
  pendingUpdate: TrainingRateUpdate | null,
  kind: TrainingApplicationKind
): TrackStep[] {
  const status = application.status;
  const submitted: TrackStep = {
    title: 'Submitted',
    when: shortDate(application.created_date),
    state: 'done',
  };
  const decidedWhen = shortDate(application.reviewed_at);

  if (status === 'approved' && application.pending_rate_update_uuid) {
    return [
      submitted,
      { title: 'Approved', when: decidedWhen, state: 'done' },
      {
        title: 'Rates updated',
        when: shortDate(pendingUpdate?.created_date),
        state: 'done',
      },
      { title: 'Update approved', when: 'Waiting', state: 'current' },
    ];
  }

  const opened = Boolean(application.first_opened_at) || status !== 'pending';
  const steps: TrackStep[] = [
    submitted,
    {
      title: `Opened by ${creatorRole(kind)}`,
      when: application.first_opened_at
        ? shortDate(application.first_opened_at)
        : opened
          ? undefined
          : 'Not yet',
      state: opened ? 'done' : 'current',
    },
  ];

  if (status === 'approved')
    return [
      ...steps,
      { title: 'Approved', when: decidedWhen, state: 'done' },
      {
        title: 'Rate card active',
        when: application.reviewed_at
          ? `Since ${dayjs(application.reviewed_at).format('D MMM')}`
          : undefined,
        state: 'done',
      },
    ];
  if (status === 'rejected' || status === 'revoked')
    return [
      ...steps,
      { title: status === 'rejected' ? 'Rejected' : 'Revoked', when: decidedWhen, state: 'failed' },
      { title: 'Rate card active', when: 'Not active', state: 'todo' },
    ];
  return [
    ...steps,
    { title: 'Decision', when: 'Waiting', state: opened ? 'current' : 'todo' },
    { title: 'Rate card active', state: 'todo' },
  ];
}

function nextStepNote(
  application: TrainingApplication,
  {
    creator,
    pendingUpdateUuid,
    kind,
  }: { creator: string; pendingUpdateUuid: string | null; kind: TrainingApplicationKind }
): string {
  switch (application.status) {
    case 'approved':
      return pendingUpdateUuid
        ? `Your rate updates are with ${creator}. Your current rates stay active until they approve.`
        : `Jobs for this ${kind} can hire on any basis in your rate card. Need to add or change a rate? Update your rates; the current card keeps working until ${creator} approves.`;
    case 'rejected':
      return `${creator} rejected this application. Read their note, then apply again with changes.`;
    case 'revoked':
      return `${creator} revoked this approval, so the rate card is no longer active. Apply again with changes to train this ${kind}.`;
    default:
      return application.first_opened_at
        ? `${creator} opened your application and is reviewing it. You can still edit or withdraw it until they decide.`
        : `Sent to ${creator}; they have not opened it yet. You can still edit or withdraw it until they decide.`;
  }
}
