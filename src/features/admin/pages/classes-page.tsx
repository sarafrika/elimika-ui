'use client';

import { CalendarDays, CalendarRange, List } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  DataTable,
  StatCard,
  StatCardSkeleton,
  SectionCard,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { absoluteDateTime, formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import type { ClassDefinition } from '@/services/client';
import { ClassDrawer } from '../components/class-drawer';
import { SectionBoundary } from '../components/section-boundary';
import { useAdminStatistics } from '../hooks/use-admin-dashboard';
import { CALENDAR_MAX_DAYS, useAllClasses, useInstructorCalendar } from '../hooks/use-classes';
import { enumParam, numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const viewParam = enumParam(['list', 'calendar'] as const, 'list');
const pageParam = numberParam(0);
const instructorParam = stringParam();
const fromParam = stringParam();

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** Classes on the platform, and a calendar that is scoped before it is fetched. */
export function ClassesPage() {
  const [view, setView] = useSearchState('view', viewParam);
  const [page, setPage] = useSearchState('page', pageParam);
  const [instructor, setInstructor] = useSearchState('instructor', instructorParam);
  const [from, setFrom] = useSearchState('from', fromParam);
  const [openClass, setOpenClass] = useState<ClassDefinition | null>(null);

  const { statistics, query: statisticsQuery } = useAdminStatistics();
  const metrics = statistics?.timetabling_metrics;

  const { classes, totalRows, pageCount, query } = useAllClasses(page);

  // Organisation names come from one batched lookup for the page.
  const organisationIds = useMemo(
    () =>
      Array.from(
        new Set(
          classes
            .map(definition => definition.organisation_uuid)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [classes]
  );
  const { organisationMap } = useOrganisationsByIds(organisationIds);

  const start = useMemo(() => (from ? new Date(from) : new Date()), [from]);
  const end = useMemo(() => {
    const value = new Date(start);
    value.setDate(value.getDate() + CALENDAR_MAX_DAYS);
    return value;
  }, [start]);

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Classes'
          title='Classes & calendar'
          description='Every class the platform runs, and the sessions behind one instructor or organisation.'
          actions={
            <div className='flex gap-2'>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size='sm'
                className='rounded-md'
                onClick={() => setView('list')}
              >
                <List className='mr-1.5 size-4' />
                List
              </Button>
              <Button
                variant={view === 'calendar' ? 'default' : 'outline'}
                size='sm'
                className='rounded-md'
                onClick={() => setView('calendar')}
              >
                <CalendarDays className='mr-1.5 size-4' />
                Calendar
              </Button>
            </div>
          }
        />

        <SectionBoundary
          label='the session counts'
          loading={statisticsQuery.isLoading}
          error={statisticsQuery.error}
          onRetry={statisticsQuery.refetch}
          skeleton={
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              {[0, 1, 2, 3].map(item => (
                <StatCardSkeleton key={item} />
              ))}
            </div>
          }
        >
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              label='Sessions next 7 days'
              value={toNumber(metrics?.sessions_next_7d)}
              icon={CalendarRange}
            />
            <StatCard label='Sessions last 30 days' value={toNumber(metrics?.sessions_last_30d)} />
            <StatCard
              label='Completed last 30 days'
              value={toNumber(metrics?.sessions_completed_last_30d)}
              tone='success'
            />
            <StatCard
              label='Cancelled last 30 days'
              value={toNumber(metrics?.sessions_cancelled_last_30d)}
              tone='destructive'
              hint={`${toNumber(metrics?.attended_enrollments_last_30d)} attended · ${toNumber(
                metrics?.absent_enrollments_last_30d
              )} absent`}
            />
          </div>
        </SectionBoundary>

        {view === 'list' ? (
          <SectionBoundary
            label='the classes'
            loading={query.isLoading && classes.length === 0}
            error={query.error}
            onRetry={query.refetch}
            empty={!query.isLoading && classes.length === 0}
            emptyTitle='No classes yet'
            emptyDescription='Nothing has been set up to run.'
          >
            <DataTable
              hideToolbar
              data={classes}
              isLoading={query.isLoading}
              getRowId={row => row.uuid ?? row.title}
              onRowClick={row => setOpenClass(row)}
              serverPagination={{ page, pageCount, totalRows, onPageChange: setPage }}
              columns={[
                {
                  id: 'class',
                  header: 'Class',
                  cell: ({ row }) => (
                    <div className='min-w-0'>
                      <p className='text-foreground truncate text-sm font-medium'>
                        {row.original.title}
                      </p>
                      <p className='text-muted-foreground truncate text-xs'>
                        {row.original.location_name || 'No location set'}
                      </p>
                    </div>
                  ),
                },
                {
                  id: 'organisation',
                  header: 'Organisation',
                  cell: ({ row }) => {
                    const uuid = row.original.organisation_uuid;
                    return (
                      <span className='text-muted-foreground text-sm'>
                        {uuid ? (organisationMap[uuid]?.name ?? 'Loading…') : 'Independent'}
                      </span>
                    );
                  },
                },
                {
                  id: 'format',
                  header: 'Format',
                  cell: ({ row }) => (
                    <span className='text-muted-foreground text-xs'>
                      {[row.original.session_format, row.original.location_type]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </span>
                  ),
                },
                {
                  id: 'capacity',
                  header: 'Capacity',
                  cell: ({ row }) => (
                    <span className='font-mono text-sm'>
                      {row.original.max_participants ?? '—'}
                      {row.original.capacity_info ? (
                        <span className='text-muted-foreground ml-1.5 font-sans text-xs'>
                          {row.original.capacity_info}
                        </span>
                      ) : null}
                    </span>
                  ),
                },
                {
                  id: 'progress',
                  header: 'Progress',
                  cell: ({ row }) => (
                    <span className='font-mono text-sm'>
                      {toNumber(row.original.completed_session_count)} /{' '}
                      {toNumber(row.original.scheduled_session_count)}
                      {row.original.class_progress_percentage !== undefined ? (
                        <span className='text-muted-foreground ml-1.5 font-sans text-xs'>
                          {Math.round(Number(row.original.class_progress_percentage))}%
                        </span>
                      ) : null}
                    </span>
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: ({ row }) => (
                    <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} />
                  ),
                },
              ]}
            />
          </SectionBoundary>
        ) : (
          <CalendarView
            instructor={instructor}
            onInstructorChange={setInstructor}
            from={from || isoDate(new Date())}
            onFromChange={setFrom}
            start={start}
            end={end}
          />
        )}

        <p className='text-muted-foreground text-xs'>
          There is no platform-wide schedule by date range yet, so the calendar is scoped to one
          instructor at a time. A ranged endpoint that returns sessions with their class, course
          and enrolment counts is on the backend list.
        </p>
      </div>

      <ClassDrawer
        classUuid={openClass?.uuid ?? null}
        fallback={openClass}
        onOpenChange={open => {
          if (!open) setOpenClass(null);
        }}
      />
    </div>
  );
}

interface CalendarViewProps {
  instructor: string;
  onInstructorChange: (value: string) => void;
  from: string;
  onFromChange: (value: string) => void;
  start: Date;
  end: Date;
}

/** Sessions for one instructor across a bounded window. */
function CalendarView({
  instructor,
  onInstructorChange,
  from,
  onFromChange,
  start,
  end,
}: CalendarViewProps) {
  const [draftInstructor, setDraftInstructor] = useState(instructor);
  const { instances, query } = useInstructorCalendar(instructor, start, end);

  const byDay = useMemo(() => {
    const groups = new Map<string, typeof instances>();
    for (const instance of instances) {
      const key = formatDate(instance.start_time) || 'Unscheduled';
      groups.set(key, [...(groups.get(key) ?? []), instance]);
    }
    return Array.from(groups.entries());
  }, [instances]);

  return (
    <SectionCard
      title='Calendar'
      description={`Sessions for one instructor, ${CALENDAR_MAX_DAYS} days at a time.`}
    >
      <div className='flex flex-col gap-4'>
        <form
          className='flex flex-wrap items-end gap-3'
          onSubmit={event => {
            event.preventDefault();
            onInstructorChange(draftInstructor.trim());
          }}
        >
          <div className='flex min-w-[280px] flex-1 flex-col gap-1.5'>
            <Label htmlFor='calendar-instructor' className='text-sm font-semibold'>
              Instructor id
            </Label>
            <Input
              id='calendar-instructor'
              value={draftInstructor}
              onChange={event => setDraftInstructor(event.target.value)}
              placeholder='Paste an instructor id from their record'
              className='border-border/70 rounded-md font-mono'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='calendar-from' className='text-sm font-semibold'>
              From
            </Label>
            <Input
              id='calendar-from'
              type='date'
              value={from}
              onChange={event => onFromChange(event.target.value)}
              className='border-border/70 rounded-md'
            />
          </div>
          <Button type='submit' className='rounded-md'>
            Show sessions
          </Button>
        </form>

        {instructor ? (
          <SectionBoundary
            label='the calendar'
            loading={query.isLoading}
            error={query.error}
            empty={instances.length === 0}
            onRetry={query.refetch}
            emptyTitle='Nothing scheduled'
            emptyDescription='This instructor has no sessions in the window you picked.'
          >
            <div className='flex flex-col gap-4'>
              {byDay.map(([day, dayInstances]) => (
                <div key={day} className='flex flex-col gap-2'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    {day}
                  </p>
                  <ul className='divide-border/60 border-border/70 divide-y rounded-md border'>
                    {dayInstances.map(instance => (
                      <li key={instance.uuid} className='flex items-center gap-3 px-3 py-2.5'>
                        <span className='text-muted-foreground w-36 shrink-0 font-mono text-xs'>
                          {absoluteDateTime(instance.start_time, '—')}
                        </span>
                        <span className='min-w-0 flex-1'>
                          <span className='text-foreground block truncate text-sm font-medium'>
                            {instance.title}
                          </span>
                          <span className='text-muted-foreground block truncate text-xs'>
                            {instance.organisation_name || 'Independent'}
                          </span>
                        </span>
                        <StatusBadge status={instance.status ?? undefined} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionBoundary>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Pick an instructor first. Without a scope the calendar would have to sweep every class
            on the platform, which is the request storm the old console made.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
