'use client';

import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useId } from 'react';

import { SectionError } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRateAmount } from '@/lib/rate-card';
import { useTrainingApplication } from '@/src/features/rate-card/hooks';
import { instructorApplyToTrainHref, trackApplicationHref } from '../links';
import { type ApplyItem, ageRangeLabel, kindNoun } from '../types';

const CourseDetails = dynamic(
  () =>
    import('@/src/features/course-record/CourseRecordPage').then(module => module.CourseRecordPage),
  { loading: RecordSkeleton }
);
const ProgramDetails = dynamic(
  () =>
    import('@/src/features/program-record/ProgramRecordPage').then(
      module => module.ProgramRecordPage
    ),
  { loading: RecordSkeleton }
);

/** Shared full record with the applicant's actions and application information first. */
export function TrainingItemDetails({
  item,
  selected = false,
  onChoose,
  onContinue,
}: {
  item: ApplyItem;
  selected?: boolean;
  onChoose?: (item: ApplyItem) => void;
  onContinue?: () => void;
}) {
  const { application: loadedApplication, query } = useTrainingApplication(
    item.kind,
    item.uuid,
    item.application?.uuid
  );
  const applicationFailed =
    query.isError || Boolean(query.data?.error) || query.data?.success === false;
  const application = applicationFailed ? null : loadedApplication;
  const status = application?.status ?? item.application?.status;
  const applicationUuid = application?.uuid ?? item.application?.uuid;
  const pending = status === 'pending';
  const approved = status === 'approved';
  const canCreateClass = !applicationFailed && application?.status === 'approved';
  const classAuthorizationHintId = useId();
  const locked = pending || approved;
  const noun = kindNoun(item.kind);
  const programClassAction = canCreateClass ? (
    <Button asChild className='w-full'>
      <Link href={`/dashboard/instructor/classes/new?programUuid=${encodeURIComponent(item.uuid)}`}>
        Create class
      </Link>
    </Button>
  ) : (
    <div className='space-y-2'>
      <Button type='button' className='w-full' disabled aria-describedby={classAuthorizationHintId}>
        Create class
      </Button>
      <p id={classAuthorizationHintId} className='text-muted-foreground text-xs'>
        You can’t create a class until you’re authorized to train this {noun}.
      </p>
    </div>
  );
  const StatusIcon = approved ? CheckCircle2 : locked ? TriangleAlert : Info;
  const statusLabel = approved
    ? 'Approved'
    : pending
      ? 'Pending review'
      : status === 'rejected'
        ? 'Rejected'
        : status === 'revoked'
          ? 'Revoked'
          : 'Not applied';
  const information = approved
    ? `Your application to train this ${noun} has been approved. Browse its full details and teaching content below.`
    : pending
      ? `Your application to train this ${noun} is waiting for review. You can still edit your application details.`
      : status === 'rejected' || status === 'revoked'
        ? `Your previous application was ${status}. Review the ${noun} details below before applying again.`
        : `Review this ${noun} before applying to train. Your application will be sent to ${item.creator || 'the creator'} for review.`;

  return (
    <div className='min-w-0 space-y-6'>
      <section
        aria-label='Training application'
        className='bg-card space-y-4 rounded-xl border p-4 sm:p-6'
      >
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0 space-y-2'>
            <h2 className='text-lg font-semibold'>Application to train</h2>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='secondary'>{statusLabel}</Badge>
              {item.code && <Badge variant='outline'>{item.code}</Badge>}
              <Badge variant='outline'>Ages {ageRangeLabel(item.ageMin, item.ageMax)}</Badge>
              {item.minimumFee !== null && (
                <Badge variant='outline'>
                  Minimum training fee {formatRateAmount(item.minimumFee)}
                </Badge>
              )}
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {onChoose ? (
              <Button
                type='button'
                disabled={locked || applicationFailed}
                onClick={() => {
                  if (selected && onContinue) onContinue();
                  else
                    onChoose({
                      ...item,
                      application:
                        applicationUuid && status ? { uuid: applicationUuid, status } : null,
                    });
                }}
              >
                {locked
                  ? 'Apply'
                  : selected
                    ? 'Continue application'
                    : status
                      ? 'Reapply'
                      : 'Apply'}
              </Button>
            ) : null}
            {pending && applicationUuid && !applicationFailed ? (
              <Button asChild variant='outline'>
                <Link href={instructorApplyToTrainHref(item, applicationUuid)}>
                  Edit application
                </Link>
              </Button>
            ) : null}
            {applicationUuid ? (
              <Button asChild variant='outline'>
                <Link href={trackApplicationHref(item.kind, item.uuid)}>Track application</Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div
          className={
            approved
              ? 'bg-success/10 flex items-start gap-3 rounded-lg p-3 text-sm'
              : pending
                ? 'bg-warning/10 flex items-start gap-3 rounded-lg p-3 text-sm'
                : 'bg-muted flex items-start gap-3 rounded-lg p-3 text-sm'
          }
        >
          <StatusIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
          <p>{information}</p>
        </div>
        {application?.application_notes ? (
          <p className='text-sm whitespace-pre-wrap'>
            <span className='font-medium'>Your application notes: </span>
            {application.application_notes}
          </p>
        ) : null}
        {application?.review_notes ? (
          <p className='text-sm whitespace-pre-wrap'>
            <span className='font-medium'>Creator’s feedback: </span>
            {application.review_notes}
          </p>
        ) : null}
        {applicationFailed ? (
          <SectionError
            title='Could not refresh application information'
            error={query.error ?? query.data}
            onRetry={() => void query.refetch()}
          />
        ) : null}
      </section>
      {item.kind === 'program' ? (
        <ProgramDetails
          key={`${item.uuid}:${status ?? 'not-applied'}`}
          programUuid={item.uuid}
          embedded
          primaryAction={programClassAction}
        />
      ) : (
        <CourseDetails
          key={`${item.uuid}:${status ?? 'not-applied'}`}
          courseUuid={item.uuid}
          embedded
          classCreationAllowed={canCreateClass}
          primaryAction={false}
        />
      )}
    </div>
  );
}

function RecordSkeleton() {
  return (
    <div className='space-y-4' role='status' aria-label='Loading details'>
      <Skeleton className='h-64 w-full rounded-xl' />
      <Skeleton className='h-12 w-full rounded-xl' />
      <Skeleton className='h-96 w-full rounded-xl' />
    </div>
  );
}
