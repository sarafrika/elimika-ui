'use client';

import { Layers, Pencil, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/page-header';
import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { RateUpdateStatus } from '@/components/rate-card/rate-update-status';
import { UpdateRatesDialog } from '@/components/rate-card/update-rates-dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { dayjs } from '@/lib/date';
import { RATE_BASES, type RateBasis } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { creatorRole } from '@/src/features/rate-card/application-display';
import { MissingRatesNote } from '@/src/features/rate-card/components/application-sections';
import { ApplicationStatusBadge } from '@/src/features/rate-card/components/application-status-badge';
import {
  type TrainingApplicationEntry,
  useTrainingApplicationList,
} from '@/src/features/rate-card/hooks';
import type { TrainingApplicationKind } from '@/src/features/rate-card/types';

type DialogTarget = { entry: TrainingApplicationEntry; focusBasis?: RateBasis };

const STATUS_ORDER: Record<string, number> = { approved: 0, pending: 1, rejected: 2, revoked: 3 };

const cardId = (kind: TrainingApplicationKind, parentUuid: string) =>
  `rate-card-${kind}-${parentUuid}`;

function applyHref(kind: TrainingApplicationKind, parentUuid: string, applicationUuid?: string) {
  const params = new URLSearchParams();
  if (applicationUuid) params.set('application', applicationUuid);
  if (kind === 'program') params.set('kind', 'program');
  const search = params.toString();
  return dashboardUrl('instructor', `courses/apply/${parentUuid}${search ? `?${search}` : ''}`);
}

/** The instructor's rate cards: one per course or program they applied to train. */
export function InstructorRateCards() {
  const instructor = useInstructor();
  const instructorUuid = instructor?.uuid ?? '';
  const searchParams = useSearchParams();
  const { entries, loading, error, refetch } = useTrainingApplicationList(
    { applicant_uuid_eq: instructorUuid, applicant_type_eq: 'instructor' },
    Boolean(instructorUuid)
  );

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          (STATUS_ORDER[a.application.status ?? ''] ?? 9) -
          (STATUS_ORDER[b.application.status ?? ''] ?? 9)
      ),
    [entries]
  );
  const creatorIds = useMemo(
    () => sorted.flatMap(entry => (entry.creatorUuid ? [entry.creatorUuid] : [])),
    [sorted]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);
  const creatorName = (entry: TrainingApplicationEntry) =>
    entry.creatorUuid ? (courseCreatorMap[entry.creatorUuid]?.full_name ?? null) : null;

  const linkKind = searchParams.get('kind') === 'program' ? 'program' : 'course';
  const linkParent = searchParams.get('parent');
  const rawBasis = searchParams.get('basis');
  const linkBasis = RATE_BASES.find(basis => basis.value === rawBasis)?.value;
  const linked = linkParent
    ? (sorted.find(
        entry =>
          entry.kind === linkKind &&
          entry.parentUuid === linkParent &&
          entry.application.status === 'approved'
      ) ?? sorted.find(entry => entry.kind === linkKind && entry.parentUuid === linkParent))
    : undefined;

  const [dialog, setDialog] = useState<DialogTarget | null>(null);
  const handledLink = useRef<string | null>(null);
  const linkKey = linkParent ? `${linkKind}:${linkParent}:${linkBasis ?? ''}` : null;

  useEffect(() => {
    if (!linkKey || !linked || handledLink.current === linkKey) return;
    handledLink.current = linkKey;
    document
      .getElementById(cardId(linked.kind, linked.parentUuid))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const { application } = linked;
    if (application.status === 'approved' && !application.pending_rate_update_uuid)
      setDialog({ entry: linked, focusBasis: linkBasis });
  }, [linkKey, linked, linkBasis]);

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-4 pb-10 sm:px-6'>
      <PageHeader
        title='Rate cards'
        description='The rates each course creator approved for you, per training method and billing basis. Jobs can only hire you on a basis you have an approved rate for.'
      />

      {linkParent && !loading && !error && !linked ? (
        <EmptyState
          variant='compact'
          icon={SearchX}
          title={`You have no rate card for this ${linkKind} yet`}
          description={`Apply to train it; once the ${creatorRole(linkKind)} approves your rates, jobs can hire you.`}
          action={
            <Button asChild size='sm'>
              <Link href={applyHref(linkKind, linkParent)}>Apply to train</Link>
            </Button>
          }
        />
      ) : null}

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={refetch}
        errorTitle='Couldn’t load your rate cards'
        empty={sorted.length === 0}
        skeleton={<RateCardsSkeleton />}
        emptyState={
          <EmptyState
            icon={Layers}
            title='No rate cards yet'
            description='Apply to train a course; your rate card appears here once you send it.'
            action={
              <Button asChild variant='outline'>
                <Link href={dashboardUrl('instructor', 'courses')}>Browse courses</Link>
              </Button>
            }
          />
        }
      >
        <div className='space-y-5'>
          {sorted.map(entry => (
            <RateCardEntry
              key={`${entry.kind}-${entry.uuid}`}
              entry={entry}
              creatorName={creatorName(entry)}
              highlightBasis={entry === linked ? linkBasis : undefined}
              onUpdate={() => setDialog({ entry })}
            />
          ))}
        </div>
      </AsyncSection>

      {dialog ? (
        <UpdateRatesDialog
          open
          onOpenChange={open => {
            if (!open) setDialog(null);
          }}
          kind={dialog.entry.kind}
          parentUuid={dialog.entry.parentUuid}
          applicationUuid={dialog.entry.uuid}
          title={dialog.entry.title ?? `This ${dialog.entry.kind}`}
          currentCard={dialog.entry.application.rate_card}
          creatorName={creatorName(dialog.entry)}
          focusBasis={dialog.focusBasis}
          minimum={dialog.entry.minimum}
        />
      ) : null}
    </div>
  );
}

function RateCardEntry({
  entry,
  creatorName,
  highlightBasis,
  onUpdate,
}: {
  entry: TrainingApplicationEntry;
  creatorName: string | null;
  highlightBasis?: RateBasis;
  onUpdate: () => void;
}) {
  const { application, kind } = entry;
  const status = application.status;
  const pendingUpdate = status === 'approved' ? application.pending_rate_update_uuid : null;
  const creator = creatorName ?? `The ${creatorRole(kind)}`;
  const when =
    status === 'approved' && application.reviewed_at
      ? `approved ${dayjs(application.reviewed_at).format('D MMM YYYY')}`
      : application.created_date
        ? `applied ${dayjs(application.created_date).format('D MMM YYYY')}`
        : null;

  return (
    <article
      id={cardId(kind, entry.parentUuid)}
      className={cn(
        'bg-card scroll-mt-24 rounded-xl border',
        highlightBasis && 'ring-primary/40 ring-2'
      )}
    >
      <header className='flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4'>
        <div className='min-w-0'>
          {entry.title ? (
            <h2 className='text-foreground text-base font-semibold'>{entry.title}</h2>
          ) : (
            <Skeleton className='h-5 w-64 max-w-full' />
          )}
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {[creatorName, when].filter(Boolean).join(' · ') || `${kind} rate card`}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <RateUpdateStatus
            variant='badge'
            kind={kind}
            parentUuid={entry.parentUuid}
            applicationUuid={entry.uuid}
            pendingUpdateUuid={pendingUpdate}
          />
          <ApplicationStatusBadge status={status} kind={kind} />
          {status === 'approved' && !pendingUpdate ? (
            <Button size='sm' variant='outline' onClick={onUpdate}>
              <Pencil aria-hidden />
              Update rates
            </Button>
          ) : null}
        </div>
      </header>

      <div className='space-y-3 p-5'>
        {status === 'approved' ? (
          <>
            {pendingUpdate ? (
              <RateUpdateStatus
                kind={kind}
                parentUuid={entry.parentUuid}
                applicationUuid={entry.uuid}
                pendingUpdateUuid={pendingUpdate}
                canWithdraw
              />
            ) : (
              <MissingRatesNote card={application.rate_card} />
            )}
            <RateCardGrid
              mode='view'
              value={application.rate_card}
              highlightBasis={highlightBasis}
            />
          </>
        ) : status === 'pending' ? (
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-muted-foreground text-sm'>
              Your full rate card is with {creator}. You can edit it until they decide.
            </p>
            <Button asChild size='sm' variant='outline'>
              <Link href={applyHref(kind, entry.parentUuid, entry.uuid)}>Edit application</Link>
            </Button>
          </div>
        ) : (
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='text-muted-foreground space-y-1 text-sm'>
              <p>
                {creator}{' '}
                {status === 'revoked' ? 'revoked this approval' : 'rejected this application'}, so
                jobs can’t hire you for this {kind}.
              </p>
              {application.review_notes ? (
                <p className='text-foreground'>“{application.review_notes}”</p>
              ) : null}
            </div>
            <Button asChild size='sm'>
              <Link href={applyHref(kind, entry.parentUuid)}>Apply again with changes</Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function RateCardsSkeleton() {
  return (
    <div className='space-y-5'>
      {[0, 1].map(index => (
        <div key={index} className='bg-card space-y-4 rounded-xl border p-5'>
          <div className='flex justify-between gap-3'>
            <div className='space-y-2'>
              <Skeleton className='h-5 w-72 max-w-full' />
              <Skeleton className='h-4 w-48' />
            </div>
            <Skeleton className='h-6 w-24' />
          </div>
          <Skeleton className='h-56 w-full' />
        </div>
      ))}
    </div>
  );
}
