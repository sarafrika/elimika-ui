'use client';

import { Building2, CalendarClock, Presentation, UserRound, Wrench } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { useBranchResources } from '@/components/class-form';
import { PinnedPlaceCard } from '@/components/maps/pinned-place-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobResource,
  Instructor,
  OrganisationResource,
} from '@/services/client';
import {
  CONFIRMED_HOLD,
  type HoldState,
  type JobSessionWindow,
  jobAddress,
  jobHasPin,
  resourceHoldState,
  sessionDayLabel,
  sessionTimeRange,
} from '../lib/job-stage';
import { HoldBadge } from './job-badges';
import { DetailRow, StatusBadge } from '@/components/data-display';

export type JobResourceRow = {
  resource: ClassMarketplaceJobResource;
  kind: 'VENUE' | 'EQUIPMENT_POOL' | null;
  details: OrganisationResource | null;
};

/** Job resources joined to the branch's own records for seats, units and where on site. */
export function useJobResourceRows(job: ClassMarketplaceJob | null | undefined) {
  const hasResources = Boolean(job?.resources?.length);
  const { venues, equipment, venuesQuery, equipmentQuery } = useBranchResources(
    hasResources ? (job?.organisation_uuid ?? '') : '',
    job?.branch_uuid ?? ''
  );
  const rows: JobResourceRow[] = (job?.resources ?? []).map(resource => {
    const venue = venues.find(item => item.uuid === resource.resource_uuid) ?? null;
    const kit = equipment.find(item => item.uuid === resource.resource_uuid) ?? null;
    const typed = resource.resource_type;
    const kind =
      typed === 'VENUE' || typed === 'EQUIPMENT_POOL'
        ? typed
        : venue
          ? 'VENUE'
          : kit
            ? 'EQUIPMENT_POOL'
            : null;
    return { resource, kind, details: venue ?? kit };
  });
  const isLoading =
    (venuesQuery.isLoading && !venuesQuery.data) ||
    (equipmentQuery.isLoading && !equipmentQuery.data);
  return { rows, isLoading };
}

export function resourceName(row: JobResourceRow) {
  return row.resource.resource_name || row.details?.name || 'Held resource';
}

export function resourceMeta(row: JobResourceRow) {
  const quantity = row.resource.quantity ?? 1;
  if (row.kind === 'VENUE') {
    const seats = row.details?.seat_capacity;
    return ['Venue', typeof seats === 'number' ? `${seats} seats` : null]
      .filter(Boolean)
      .join(' · ');
  }
  if (row.kind === 'EQUIPMENT_POOL') {
    const total = row.details?.total_quantity;
    const units =
      typeof total === 'number'
        ? `${quantity} of ${total} units`
        : `${quantity} unit${quantity === 1 ? '' : 's'}`;
    return `Equipment · ${units}`;
  }
  return `Quantity ${quantity}`;
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return <DetailRow label={label} value={children} />;
}

/** Where a job trains: the branch pin and venue, or the meeting link for online delivery. */
export function JobWhereContent({
  job,
  venue,
  venueLoading,
}: {
  job: ClassMarketplaceJob;
  venue?: JobResourceRow | null;
  venueLoading?: boolean;
}) {
  const venueCell = venueLoading ? (
    <Skeleton className='h-16 w-full' />
  ) : venue ? (
    <Cell label='Venue'>
      <span className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
        <Presentation className='text-muted-foreground h-4 w-4 shrink-0' />
        <span>{resourceName(venue)}</span>
        <span className='text-muted-foreground text-xs font-normal'>
          {[
            typeof venue.details?.seat_capacity === 'number'
              ? `${venue.details.seat_capacity} seats`
              : null,
            venue.details?.location_name,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
    </Cell>
  ) : (
    <Cell label='Venue'>No venue held</Cell>
  );

  if (job.location_type === 'ONLINE') {
    return (
      <div className='grid gap-3 sm:grid-cols-2'>
        <Cell label='Branch'>
          {job.branch_name ? (
            <span>
              {job.branch_name}
              <span className='text-muted-foreground font-normal'>
                {' '}
                · owns the class and its students
              </span>
            </span>
          ) : (
            'No branch'
          )}
        </Cell>
        <Cell label='Meeting link'>
          <span className='font-mono text-xs break-all'>{job.meeting_link || 'Not provided'}</span>
        </Cell>
      </div>
    );
  }

  if (!jobHasPin(job)) {
    return (
      <div className='grid gap-3 sm:grid-cols-2'>
        <Cell label='Location'>
          <span className='flex flex-wrap items-center gap-2'>
            {job.branch_name ? (
              <span>{job.branch_name}</span>
            ) : (
              <Badge variant='secondary'>No branch</Badge>
            )}
            <span className='text-muted-foreground font-normal'>
              {jobAddress(job) || 'No location recorded'}
            </span>
          </span>
        </Cell>
        {venueCell}
      </div>
    );
  }

  return (
    <PinnedPlaceCard
      name={job.branch_name || jobAddress(job) || 'Training location'}
      address={job.branch_name ? jobAddress(job) : null}
      latitude={job.location_latitude as number}
      longitude={job.location_longitude as number}
      label={job.branch_name ? 'Branch' : 'Location'}
      sourceChip={job.branch_name ? 'Branch pin' : undefined}
      className='shadow-none'
      aside={venueCell}
    />
  );
}

export function JobSessionList({
  windows,
  hold,
  initialCount = 6,
}: {
  windows: JobSessionWindow[];
  hold: HoldState;
  initialCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? windows : windows.slice(0, initialCount);

  if (windows.length === 0) {
    return <p className='text-muted-foreground text-sm'>This job has no sessions scheduled.</p>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {visible.map(window => (
        <div
          key={window.start.toISOString()}
          className='border-border/70 bg-muted/20 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2.5 text-sm'
        >
          <CalendarClock className='text-primary h-4 w-4 shrink-0' />
          <span className='min-w-36 font-medium'>{sessionDayLabel(window)}</span>
          <span className='text-muted-foreground'>{sessionTimeRange(window)}</span>
          <HoldBadge hold={hold} className='ml-auto' />
        </div>
      ))}
      {windows.length > initialCount ? (
        <Button
          type='button'
          variant='link'
          size='sm'
          className='self-start px-0'
          onClick={() => setShowAll(current => !current)}
        >
          {showAll ? 'Show fewer sessions' : `Show all ${windows.length} sessions`}
        </Button>
      ) : null}
    </div>
  );
}

/** Each row carries its own booking state; `confirmed` covers the moment the class was just created. */
export function JobResourceList({
  rows,
  confirmed,
  isLoading,
  online,
}: {
  rows: JobResourceRow[];
  confirmed?: boolean;
  isLoading?: boolean;
  online?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        {online
          ? 'Online — nothing to book. Only the instructor’s time is held.'
          : 'No venue or equipment is held for this job.'}
      </p>
    );
  }
  return (
    <div className='flex flex-col gap-3'>
      {rows.map(row => {
        const Icon = row.kind === 'VENUE' ? Presentation : Wrench;
        return (
          <div key={row.resource.resource_uuid} className='flex items-center gap-3'>
            <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md'>
              <Icon className='h-4 w-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{resourceName(row)}</p>
              {isLoading && !row.details ? (
                <Skeleton className='mt-1 h-3 w-24' />
              ) : (
                <p className='text-muted-foreground text-xs'>{resourceMeta(row)}</p>
              )}
            </div>
            <HoldBadge hold={confirmed ? CONFIRMED_HOLD : resourceHoldState(row.resource)} />
          </div>
        );
      })}
    </div>
  );
}

export function initialsOf(name?: string | null) {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export function HiredInstructorRow({
  instructor,
  loading,
  subtitle,
}: {
  instructor?: Instructor | null;
  loading?: boolean;
  subtitle: ReactNode;
}) {
  if (loading && !instructor) {
    return (
      <div className='flex items-center gap-3'>
        <Skeleton className='h-10 w-10 rounded-full' />
        <div className='flex-1 space-y-1.5'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3 w-44' />
        </div>
      </div>
    );
  }
  return (
    <div className='flex items-center gap-3'>
      <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
        {instructor?.full_name ? (
          initialsOf(instructor.full_name)
        ) : (
          <UserRound className='h-5 w-5' />
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold'>
          {instructor?.full_name || 'Hired instructor'}
        </p>
        <p className='text-muted-foreground text-xs'>{subtitle}</p>
      </div>
      <StatusBadge tone='success' label='Hired' />
    </div>
  );
}

export function BranchLine({ job }: { job: ClassMarketplaceJob }) {
  return (
    <span className='inline-flex items-center gap-1.5'>
      <Building2 className='h-3.5 w-3.5' />
      {job.branch_name || 'No branch'}
    </span>
  );
}

export const postedLabel = (job: ClassMarketplaceJob) => `Posted ${formatDate(job.created_date)}`;
