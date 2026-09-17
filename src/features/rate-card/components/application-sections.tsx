'use client';

import { Building2, MapPin, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dayjs } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { TrainingApplicationVenue, TrainingRequirementAnswer } from '@/services/client';
import { describeApplicationEvent } from '../application-display';
import type { TrainingApplicationEvent } from '../types';

/** "16 Sep 2026, 10:12 AM"; an em dash when unknown. */
export function formatApplicationDate(value: Date | string | null | undefined) {
  return value ? dayjs(value).format('D MMM YYYY, h:mm A') : '—';
}

/** A titled card section in the application details layout. */
export function DetailSection({
  title,
  description,
  aside,
  children,
  className,
  flush,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn('bg-card rounded-xl border', className)}>
      <header className='flex flex-wrap items-start justify-between gap-2 border-b px-5 py-4'>
        <div className='min-w-0'>
          <h2 className='text-foreground text-base font-semibold'>{title}</h2>
          {description ? (
            <p className='text-muted-foreground mt-0.5 text-sm'>{description}</p>
          ) : null}
        </div>
        {aside ? <div className='text-muted-foreground text-xs'>{aside}</div> : null}
      </header>
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

export function DetailSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className='bg-card space-y-3 rounded-xl border p-5'>
      <Skeleton className='h-5 w-40' />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className='h-10 w-full' />
      ))}
    </div>
  );
}

/** The venues an organisation offered with its application, as a grid of cells. */
export function OfferedVenuesList({
  venues,
}: {
  venues: TrainingApplicationVenue[] | null | undefined;
}) {
  if (!venues?.length) {
    return <p className='text-muted-foreground text-sm'>No venues offered.</p>;
  }
  return (
    <ul className='grid gap-3 sm:grid-cols-2'>
      {venues.map(venue => (
        <li key={venue.resource_uuid} className='bg-muted/30 space-y-1 rounded-lg border p-3'>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
            <Building2 aria-hidden className='size-3.5' />
            {venue.branch_name ?? 'Branch'}
          </p>
          <p className='text-foreground font-medium'>{venue.name ?? 'Venue no longer exists'}</p>
          <p className='text-muted-foreground flex flex-wrap gap-x-3 text-xs'>
            {venue.seat_capacity ? (
              <span className='inline-flex items-center gap-1'>
                <Users aria-hidden className='size-3' />
                {venue.seat_capacity} seats
              </span>
            ) : null}
            {venue.location_name ? (
              <span className='inline-flex items-center gap-1'>
                <MapPin aria-hidden className='size-3' />
                {venue.location_name}
              </span>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );
}

function answerHow(answer: TrainingRequirementAnswer) {
  if (answer.has_it) return 'Already has it';
  if (answer.acquisition === 'lease') return 'Will lease it';
  if (answer.acquisition === 'hire') return 'Will hire it';
  return '—';
}

/** Requirement answers as a three-column table: requirement, has it, how. */
export function RequirementAnswersTable({
  answers,
  hasItLabel = 'Has it',
}: {
  answers: TrainingRequirementAnswer[] | null | undefined;
  hasItLabel?: string;
}) {
  if (!answers?.length) {
    return <p className='text-muted-foreground px-5 py-4 text-sm'>No requirement answers.</p>;
  }
  return (
    <div role='table' className='text-sm'>
      <div
        role='row'
        className='bg-muted/50 text-muted-foreground grid grid-cols-[minmax(0,1.3fr)_6rem_minmax(0,1fr)] gap-3 px-5 py-2 text-xs font-medium'
      >
        <span role='columnheader'>Requirement</span>
        <span role='columnheader'>{hasItLabel}</span>
        <span role='columnheader'>How</span>
      </div>
      {answers.map(answer => (
        <div
          key={answer.requirement_uuid}
          role='row'
          className='grid grid-cols-[minmax(0,1.3fr)_6rem_minmax(0,1fr)] items-center gap-3 border-t px-5 py-3'
        >
          <span role='cell' className='text-foreground'>
            {answer.requirement_name ?? 'Removed requirement'}
          </span>
          <span role='cell'>
            <Badge
              variant='outline'
              className={
                answer.has_it
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-warning/50 bg-warning/10 text-foreground'
              }
            >
              {answer.has_it ? 'Yes' : 'No'}
            </Badge>
          </span>
          <span role='cell' className='text-muted-foreground'>
            {answerHow(answer)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The application's timeline, newest first. */
export function ApplicationHistoryList({ events }: { events: TrainingApplicationEvent[] }) {
  if (events.length === 0) {
    return <p className='text-muted-foreground text-sm'>No history yet.</p>;
  }
  return (
    <ol className='space-y-3'>
      {events.map(event => (
        <li key={event.uuid} className='flex items-start gap-2.5'>
          <span aria-hidden className='bg-primary mt-1.5 size-2 shrink-0 rounded-full' />
          <div className='min-w-0'>
            <p className='text-foreground text-sm font-medium'>{describeApplicationEvent(event)}</p>
            <p className='text-muted-foreground text-xs'>
              {formatApplicationDate(event.created_date)}
            </p>
            {event.note ? (
              <p className='text-muted-foreground mt-1 text-xs italic'>“{event.note}”</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
