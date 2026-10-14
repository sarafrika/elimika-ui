'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, TriangleAlert, Users } from 'lucide-react';
import { Fragment, type ReactNode, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dayjs } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import type { RateCardInput } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import type {
  AgeGroup,
  TrainingApplicationVenue,
  TrainingRequirementAnswer,
} from '@/services/client';
import { getProgramCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import { describeApplicationEvent, describeMissingRates } from '../application-display';
import type { TrainingApplicationEvent, TrainingApplicationKind } from '../types';

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

/** Warns that offered methods lack some bases, which blocks jobs billed on them. */
export function MissingRatesNote({
  card,
  className,
}: {
  card: RateCardInput | null | undefined;
  className?: string;
}) {
  const missing = describeMissingRates(card);
  if (!missing) return null;
  return (
    <p
      className={cn(
        'border-warning/50 bg-warning/10 text-foreground flex items-start gap-2 rounded-lg border p-3 text-sm',
        className
      )}
    >
      <TriangleAlert aria-hidden className='text-warning mt-0.5 size-4 shrink-0' />
      <span>
        <strong>{missing.title}</strong> {missing.detail}
      </span>
    </p>
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

const hoursLabel = (hours: number | null | undefined) =>
  typeof hours === 'number' && Number.isFinite(hours) ? `${Math.round(hours * 100) / 100} h` : '—';

/**
 * An instructor's age groups, read-only: name, ages, total hours and the hours per lesson,
 * grouped by course when the plan spans a programme's courses.
 */
export function AgeGroupsList({
  groups,
  courseTitles,
}: {
  groups: AgeGroup[] | null | undefined;
  /** Course names by uuid, for a programme's plan; omitted, lessons are not grouped. */
  courseTitles?: Readonly<Record<string, string>>;
}) {
  if (!groups?.length) {
    return <p className='text-muted-foreground text-sm'>No age groups were included.</p>;
  }
  const spansCourses =
    new Set(groups.flatMap(group => (group.lesson_hours ?? []).map(row => row.course_uuid))).size > 1;
  return (
    <ul className='space-y-3'>
      {groups.map((group, index) => (
        <li key={group.uuid ?? `${group.name}-${index}`} className='rounded-lg border'>
          <details>
            <summary className='flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3'>
              <span className='text-foreground font-medium'>
                {group.name}{' '}
                <span className='text-muted-foreground font-normal'>
                  · ages {group.min_age}–{group.max_age}
                </span>
              </span>
              <span className='text-muted-foreground text-sm'>
                {hoursLabel(group.total_hours)} over {group.lesson_hours?.length ?? 0} lessons
              </span>
            </summary>
            <ol className='border-t px-4 py-2 text-sm'>
              {(group.lesson_hours ?? []).map((row, position, rows) => (
                <Fragment key={row.lesson_uuid ?? position}>
                  {spansCourses && rows[position - 1]?.course_uuid !== row.course_uuid ? (
                    <li className='text-primary pt-2 pb-1 text-xs font-semibold tracking-wide uppercase'>
                      {(row.course_uuid && courseTitles?.[row.course_uuid]) || 'Course'}
                    </li>
                  ) : null}
                  <li className='flex items-center justify-between gap-3 py-1.5'>
                    <span className='min-w-0'>
                      <span className='text-muted-foreground mr-2 font-mono text-xs'>
                        {row.lesson_number ?? '•'}
                      </span>
                      {row.lesson_title ?? 'Removed lesson'}
                    </span>
                    <span className='font-mono'>{hoursLabel(row.hours)}</span>
                  </li>
                </Fragment>
              ))}
            </ol>
          </details>
        </li>
      ))}
    </ul>
  );
}

/** {@link AgeGroupsList} with a programme's course names looked up for the lesson headings. */
export function ApplicationAgeGroups({
  kind,
  parentUuid,
  groups,
}: {
  kind: TrainingApplicationKind;
  parentUuid: string;
  groups: AgeGroup[] | null | undefined;
}) {
  const coursesQuery = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: parentUuid } }),
    enabled: kind === 'program' && Boolean(parentUuid) && Boolean(groups?.length),
    staleTime: STALE_TIMES.entity,
  });
  const courseTitles = useMemo(
    () =>
      Object.fromEntries(
        (coursesQuery.data?.data ?? []).flatMap(course =>
          course.uuid ? [[course.uuid, course.name] as const] : []
        )
      ),
    [coursesQuery.data]
  );
  return <AgeGroupsList groups={groups} courseTitles={courseTitles} />;
}
