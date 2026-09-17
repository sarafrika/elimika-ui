'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { SectionCard } from '@/app/dashboard/admin/_components/ui';
import { hiredJobData } from '@/components/profile-job-marketplace/hired-jobs';
import type { HiredApplication } from '@/components/profile-job-marketplace/use-hired-applications';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { parseApiDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  getInstructorCalendarOptions,
  getInstructorTimeHoldsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import { instructorCalendarHref } from '../../job-routes';
import { buildWeek, startOfWeek, type WeekBlock, weekLabel, weekQueryRange } from '../hired-week';

const BLOCK_STYLES: Record<WeekBlock['kind'], string> = {
  hold: 'border border-dashed border-primary bg-primary/5 text-primary hover:bg-primary/10',
  class: 'border border-primary bg-primary text-primary-foreground hover:bg-primary/90',
};

const KIND_TEXT: Record<WeekBlock['kind'], string> = {
  hold: 'hired, class not created yet',
  class: 'class session',
};

function Legend() {
  return (
    <ul className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
      <li className='flex items-center gap-2'>
        <span
          aria-hidden
          className='border-primary bg-primary/5 size-3.5 rounded-sm border border-dashed'
        />
        Hired, class not created yet
      </li>
      <li className='flex items-center gap-2'>
        <span aria-hidden className='bg-primary size-3.5 rounded-sm' />
        Class
      </li>
    </ul>
  );
}

function WeekSkeleton() {
  return (
    <div className='border-border/70 grid rounded-md border sm:grid-cols-7' aria-hidden>
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className='space-y-3 p-3'>
          <Skeleton className='h-3 w-8' />
          <Skeleton className='h-4 w-12' />
          {index % 2 === 1 ? <Skeleton className='h-12 w-full' /> : null}
        </div>
      ))}
    </div>
  );
}

function BlockLink({ block }: { block: WeekBlock }) {
  const content = (
    <>
      <span className='block text-xs font-semibold'>{block.time}</span>
      <span className='block text-xs break-words'>{block.title}</span>
      <span className='sr-only'>, {KIND_TEXT[block.kind]}</span>
    </>
  );
  const className = cn('block rounded-md p-2 transition-colors', BLOCK_STYLES[block.kind]);
  return block.href ? (
    <Link href={block.href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** Monday–Sunday view of the time the instructor's hires hold, one week fetched at a time. */
export function BlockedWeek({
  applications,
  applicationsPending,
}: {
  applications: HiredApplication[];
  applicationsPending: boolean;
}) {
  const profile = useUserProfile();
  const instructorUuid = profile?.instructor?.uuid;
  const [weekStart, setWeekStart] = useState(() => startOfWeek());
  const range = useMemo(() => weekQueryRange(weekStart), [weekStart]);
  const enabled = Boolean(instructorUuid);

  const holds = useQuery({
    ...getInstructorTimeHoldsOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: range,
    }),
    enabled,
    staleTime: STALE_TIMES.live,
    placeholderData: keepPreviousData,
    select: hiredJobData,
  });
  const calendar = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: { start_date: range.start, end_date: range.end },
    }),
    enabled,
    staleTime: STALE_TIMES.live,
    placeholderData: keepPreviousData,
    select: hiredJobData,
  });

  const hiredClassUuids = useMemo(
    () =>
      new Set(
        applications.flatMap(application =>
          application.job?.class_definition_uuid ? [application.job.class_definition_uuid] : []
        )
      ),
    [applications]
  );

  const days = useMemo(
    () => buildWeek(weekStart, holds.data ?? [], calendar.data ?? [], hiredClassUuids),
    [weekStart, holds.data, calendar.data, hiredClassUuids]
  );
  const blockCount = days.reduce((sum, day) => sum + day.blocks.length, 0);

  // The soonest first session after this week, so an empty week can point somewhere useful.
  const laterWeek = useMemo(() => {
    const weekEnd = weekStart.add(7, 'day').valueOf();
    const starts = applications
      .map(application => parseApiDate(application.job?.first_session_start)?.local())
      .filter(start => start && start.valueOf() >= weekEnd)
      .sort((a, b) => (a?.valueOf() ?? 0) - (b?.valueOf() ?? 0));
    return starts[0] ? startOfWeek(starts[0]) : null;
  }, [applications, weekStart]);

  const thisWeek = startOfWeek();
  const isThisWeek = weekStart.isSame(thisWeek, 'day');
  const fetching = holds.isFetching || calendar.isFetching;

  return (
    <SectionCard
      title='Blocked on your calendar'
      description={`Week of ${weekLabel(weekStart)}. Hired time is blocked straight away, before the class exists.`}
      actions={
        <Button variant='outline' size='sm' asChild>
          <Link href={instructorCalendarHref()}>
            <CalendarDays aria-hidden className='size-4' />
            Open calendar
          </Link>
        </Button>
      }
      bodyClassName='space-y-4'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Legend />
        <nav aria-label='Choose week' className='flex items-center gap-1'>
          {isThisWeek ? null : (
            <Button variant='ghost' size='sm' onClick={() => setWeekStart(thisWeek)}>
              This week
            </Button>
          )}
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            aria-label='Previous week'
            onClick={() => setWeekStart(week => week.subtract(7, 'day'))}
          >
            <ChevronLeft aria-hidden className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            aria-label='Next week'
            onClick={() => setWeekStart(week => week.add(7, 'day'))}
          >
            <ChevronRight aria-hidden className='size-4' />
          </Button>
        </nav>
      </div>

      <AsyncSection
        loading={applicationsPending || (enabled && (holds.isPending || calendar.isPending))}
        error={holds.error || calendar.error}
        onRetry={() => {
          void holds.refetch();
          void calendar.refetch();
        }}
        errorTitle='Couldn’t load your calendar for this week'
        skeleton={<WeekSkeleton />}
      >
        <div
          aria-busy={fetching}
          className={cn(
            'border-border/70 divide-border/70 grid divide-y rounded-md border sm:grid-cols-7 sm:divide-x sm:divide-y-0',
            fetching && 'opacity-70'
          )}
        >
          {days.map(day => (
            <section
              key={day.key}
              aria-label={`${day.weekday} ${day.date}`}
              className='flex gap-3 p-3 sm:min-h-36 sm:flex-col'
            >
              <div className='w-14 shrink-0 sm:w-auto'>
                <p
                  className={cn('text-xs', day.isToday ? 'text-primary' : 'text-muted-foreground')}
                >
                  {day.weekday}
                  {day.isToday ? <span className='sr-only'>, today</span> : null}
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    day.isToday ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {day.date}
                </p>
              </div>
              {day.blocks.length ? (
                <ul className='flex min-w-0 flex-1 flex-col gap-2'>
                  {day.blocks.map(block => (
                    <li key={block.key}>
                      <BlockLink block={block} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-muted-foreground self-center text-sm sm:hidden'>Free</p>
              )}
            </section>
          ))}
        </div>
        {blockCount === 0 ? (
          <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
            <span>Nothing from your hires is blocked this week.</span>
            {laterWeek ? (
              <Button
                variant='link'
                size='sm'
                className='h-auto p-0'
                onClick={() => setWeekStart(laterWeek)}
              >
                Go to the week of {laterWeek.format('MMM D')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </AsyncSection>
    </SectionCard>
  );
}
