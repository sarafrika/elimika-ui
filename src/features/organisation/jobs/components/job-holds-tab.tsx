'use client';

import { AsyncSection } from '@/components/data/async-section';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import type { ClassMarketplaceJob, Instructor } from '@/services/client';
import { dominantHoldStatus, useJobHolds } from '../hooks/use-job-holds';
import { type HoldState, sessionCountLabel } from '../lib/job-stage';
import type { JobResourceRow } from './job-sections';
import { resourceName } from './job-sections';
import { SectionCard, StatusBadge } from '@/components/data-display';

const HOLD_LABELS: Record<string, { label: string; tone: 'success' | 'neutral' | 'info' }> = {
  HOLD: { label: 'On hold', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  RELEASED: { label: 'Released', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  TENTATIVE: { label: 'Tentative', tone: 'neutral' },
  FIRM: { label: 'Firm hold', tone: 'info' },
};

function holdBadge(status: string | null) {
  if (!status) return <StatusBadge tone='neutral' label='Nothing held' />;
  const meta = HOLD_LABELS[status] ?? { label: status, tone: 'neutral' as const };
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

function isForbidden(error: unknown) {
  if (!error) return false;
  const record = error as { status?: number; response?: { status?: number } };
  if (record.status === 403 || record.response?.status === 403) return true;
  return /forbidden|access denied|not allowed/i.test(getErrorMessage(error, ''));
}

const ENDED = ['RELEASED', 'CANCELLED'];

/** Live holds speak for the job; released ones only when nothing is still held. */
function spanLabel(all: Array<{ start_time?: Date; status?: string | null }>) {
  const live = all.filter(item => !ENDED.includes(String(item.status ?? '').toUpperCase()));
  const items = live.length > 0 ? live : all;
  if (items.length === 0) return 'No sessions held';
  const starts = items
    .map(item => (item.start_time ? new Date(item.start_time).getTime() : Number.NaN))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const first = starts[0];
  const last = starts[starts.length - 1];
  const range =
    first !== undefined && last !== undefined
      ? first === last
        ? formatDate(new Date(first))
        : `${formatDate(new Date(first))} – ${formatDate(new Date(last))}`
      : '';
  return [sessionCountLabel(items.length), range].filter(Boolean).join(' · ');
}

const GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_minmax(0,1.6fr)_8rem]';

function HeaderRow() {
  return (
    <div
      className={`${GRID} bg-muted/40 text-muted-foreground hidden border-b px-5 py-2.5 text-xs font-semibold sm:grid`}
    >
      <div>What</div>
      <div>Type</div>
      <div>Quantity</div>
      <div>Sessions</div>
      <div>Status</div>
    </div>
  );
}

function HoldRow({
  name,
  type,
  quantity,
  sessions,
  status,
}: {
  name: string;
  type: string;
  quantity: string;
  sessions: string;
  status: string | null;
}) {
  return (
    <div className={`${GRID} items-center border-b px-5 py-3 text-sm last:border-b-0`}>
      <div className='min-w-0'>
        <p className='truncate font-medium'>{name}</p>
        <p className='text-muted-foreground text-xs sm:hidden'>
          {type} · {sessions}
        </p>
      </div>
      <div className='text-muted-foreground hidden sm:block'>{type}</div>
      <div className='hidden font-mono tabular-nums sm:block'>{quantity}</div>
      <div className='text-muted-foreground hidden sm:block'>{sessions}</div>
      <div>{holdBadge(status)}</div>
    </div>
  );
}

const RowSkeleton = () => (
  <div className='space-y-2 px-5 py-3'>
    <Skeleton className='h-5 w-full' />
    <Skeleton className='h-5 w-4/5' />
  </div>
);

export function JobHoldsTab({
  job,
  hold,
  resourceRows,
  instructor,
  instructorUuid,
}: {
  job: ClassMarketplaceJob;
  hold: HoldState;
  resourceRows: JobResourceRow[];
  instructor?: Instructor | null;
  instructorUuid?: string | null;
}) {
  const { resourceHolds, instructorHolds, instructorQuery } = useJobHolds(job, { instructorUuid });
  const explain =
    hold.key === 'confirmed'
      ? 'These were confirmed when the class was created and now belong to the class.'
      : hold.key === 'released'
        ? 'This job has closed, so anything it held has been released for others to book.'
        : 'Held for the job’s exact session windows so nobody else can book them. Creating the class confirms them; cancelling or letting the job expire releases them.';

  return (
    <div className='flex flex-col gap-5'>
      <SectionCard title='Holds & bookings' description={explain} bodyClassName='p-0'>
        <HeaderRow />
        {resourceHolds.length === 0 ? (
          <p className='text-muted-foreground px-5 py-4 text-sm'>
            {job.location_type === 'ONLINE'
              ? 'Online — this job holds no venue or equipment.'
              : 'This job holds no venue or equipment.'}
          </p>
        ) : (
          resourceHolds.map(entry => {
            const row = resourceRows.find(
              item => item.resource.resource_uuid === entry.resource.resource_uuid
            );
            const name = row ? resourceName(row) : entry.resource.resource_name || 'Held resource';
            const type =
              row?.kind === 'VENUE'
                ? 'Venue'
                : row?.kind === 'EQUIPMENT_POOL'
                  ? 'Equipment'
                  : 'Resource';
            return (
              <AsyncSection
                key={entry.resource.resource_uuid}
                loading={entry.isLoading}
                error={entry.error}
                onRetry={isForbidden(entry.error) ? undefined : entry.refetch}
                errorTitle={
                  isForbidden(entry.error)
                    ? `You can’t see ${name}’s bookings`
                    : `Couldn’t load ${name}’s bookings`
                }
                skeleton={<RowSkeleton />}
                className='m-3'
              >
                <HoldRow
                  name={name}
                  type={type}
                  quantity={String(entry.resource.quantity ?? 1)}
                  sessions={spanLabel(entry.bookings)}
                  status={dominantHoldStatus(entry.bookings.map(booking => booking.status))}
                />
              </AsyncSection>
            );
          })
        )}
      </SectionCard>

      <SectionCard
        title='Instructor time'
        description='The hired instructor’s calendar is held for the same windows, so no other job can book them.'
        bodyClassName='p-0'
      >
        {instructorUuid ? (
          <AsyncSection
            loading={instructorQuery.isLoading && !instructorQuery.data}
            error={instructorQuery.error}
            onRetry={
              isForbidden(instructorQuery.error) ? undefined : () => instructorQuery.refetch()
            }
            errorTitle={
              isForbidden(instructorQuery.error)
                ? 'You can’t see this instructor’s time holds'
                : 'Couldn’t load the instructor’s time holds'
            }
            skeleton={<RowSkeleton />}
            className='m-3'
          >
            <HeaderRow />
            <HoldRow
              name={instructor?.full_name || 'Hired instructor'}
              type='Instructor time'
              quantity='—'
              sessions={spanLabel(instructorHolds)}
              status={dominantHoldStatus(instructorHolds.map(item => item.status))}
            />
          </AsyncSection>
        ) : (
          <p className='text-muted-foreground px-5 py-4 text-sm'>
            Nobody is hired yet, so no instructor time is held.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
