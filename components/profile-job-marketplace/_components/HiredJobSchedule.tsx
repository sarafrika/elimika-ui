'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { SectionCard, StatusBadge } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTimeWithZone, parseApiDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import type { ClassMarketplaceJob, ClassSessionTemplate } from '@/services/client';
import { getClassScheduleOptions } from '@/services/client/@tanstack/react-query.gen';
import { hiredJobData, jobLabel, recurrenceLabel } from '../hired-jobs';
import { JobListSkeleton } from './JobMarketplaceSkeletons';

export function PlannedJobSchedule({ job }: { job: ClassMarketplaceJob }) {
  const sessions = useMemo(() => {
    const templates: ClassSessionTemplate[] = job.session_templates?.length
      ? job.session_templates
      : job.default_start_time && job.default_end_time
        ? [{ start_time: job.default_start_time, end_time: job.default_end_time }]
        : [];
    return [...templates].sort(
      (a, b) =>
        (parseApiDate(a.start_time)?.valueOf() ?? 0) - (parseApiDate(b.start_time)?.valueOf() ?? 0)
    );
  }, [job]);

  return (
    <SectionCard
      title='Planned class schedule'
      description='You have been hired. These are the planned times while the organisation prepares your class.'
    >
      {sessions.length ? (
        <ol className='space-y-3'>
          {sessions.map((session, index) => (
            <li key={session.uuid ?? index} className='border-border rounded-md border p-4'>
              <p className='font-medium'>Session {index + 1}</p>
              <p className='mt-1 text-sm'>
                {formatDateTimeWithZone(session.start_time, { zone: session.timezone })} –{' '}
                {formatDateTimeWithZone(session.end_time, { zone: session.timezone })}
              </p>
              <p className='text-muted-foreground mt-2 text-sm'>
                {recurrenceLabel(session.recurrence)}
              </p>
              {session.timezone && (
                <p className='text-muted-foreground text-xs'>{session.timezone}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          variant='compact'
          title='Schedule not set yet'
          description='The organisation has not provided session dates for this job.'
        />
      )}
    </SectionCard>
  );
}

export function HiredClassSchedule({ classUuid }: { classUuid: string }) {
  const [page, setPage] = useState(0);
  const schedule = useQuery({
    ...getClassScheduleOptions({
      path: { uuid: classUuid },
      query: { pageable: { page, size: 12 } },
    }),
    enabled: Boolean(classUuid),
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });
  const sessions = useMemo(
    () =>
      [...(schedule.data?.content ?? [])].sort(
        (a, b) =>
          (parseApiDate(a.start_time)?.valueOf() ?? 0) -
          (parseApiDate(b.start_time)?.valueOf() ?? 0)
      ),
    [schedule.data]
  );

  return (
    <SectionCard
      title='Class schedule'
      description='Scheduled sessions for your class. Times are shown in each session’s time zone.'
    >
      <AsyncSection
        loading={schedule.isPending}
        error={schedule.error}
        onRetry={() => void schedule.refetch()}
        skeleton={<JobListSkeleton />}
        empty={!sessions.length}
        emptyState={
          <EmptyState
            variant='compact'
            title='No scheduled sessions'
            description='The organisation has not scheduled any sessions for this class yet.'
          />
        }
      >
        <ol className='space-y-3'>
          {sessions.map((session, index) => (
            <li key={session.uuid ?? index} className='border-border rounded-md border p-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='font-medium'>{session.title || `Session ${page * 12 + index + 1}`}</p>
                <StatusBadge status={session.status} label={jobLabel(session.status)} />
              </div>
              <p className='mt-2 text-sm'>
                {formatDateTimeWithZone(session.start_time, { zone: session.timezone })} –{' '}
                {formatDateTimeWithZone(session.end_time, { zone: session.timezone })}
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {session.timezone} · {jobLabel(session.location_type)}
                {session.location_name ? ` · ${session.location_name}` : ''}
              </p>
              {session.cancellation_reason && (
                <p className='text-destructive mt-2 text-sm'>
                  Cancellation reason: {session.cancellation_reason}
                </p>
              )}
            </li>
          ))}
        </ol>
      </AsyncSection>
      {(page > 0 || schedule.data?.metadata?.hasNext) && (
        <nav aria-label='Schedule pages' className='mt-4 flex items-center justify-between gap-3'>
          <Button
            variant='outline'
            disabled={page === 0 || schedule.isFetching}
            onClick={() => setPage(value => value - 1)}
          >
            Previous
          </Button>
          <span className='text-muted-foreground text-sm'>Page {page + 1}</span>
          <Button
            variant='outline'
            disabled={!schedule.data?.metadata?.hasNext || schedule.isFetching}
            onClick={() => setPage(value => value + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </SectionCard>
  );
}
