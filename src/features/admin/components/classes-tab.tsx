'use client';

import { useMemo } from 'react';

import { DataTable, SectionCard, StatusBadge } from '@/components/data-display';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { toNumber } from '@/lib/metrics';
import type { ClassDefinition, OrgInstructorSummary } from '@/services/client';
import { SectionBoundary } from './section-boundary';

interface ClassesTabProps {
  classes: ClassDefinition[];
  /** class_definition_uuid to enrolled count, from one org-scoped query. */
  enrolmentCounts: Record<string, number>;
  instructors: OrgInstructorSummary[];
  classesQuery: { isLoading: boolean; error: unknown; refetch: () => void };
  instructorsQuery: { isLoading: boolean; error: unknown; refetch: () => void };
}

/** Classes the organisation runs, with enrolment joined in the browser. */
export function ClassesTab({
  classes,
  enrolmentCounts,
  instructors,
  classesQuery,
  instructorsQuery,
}: ClassesTabProps) {
  // Names come from one batched lookup for the whole page, never one call per row.
  const instructorIds = useMemo(
    () =>
      Array.from(
        new Set(
          classes
            .map(definition => definition.default_instructor_uuid)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [classes]
  );
  const { instructorMap } = useInstructorsByIds(instructorIds);

  return (
    <div className='flex flex-col gap-4'>
      <SectionCard title='Classes' description='What this organisation is running.'>
        <SectionBoundary
          label='the classes'
          loading={classesQuery.isLoading}
          error={classesQuery.error}
          empty={classes.length === 0}
          onRetry={classesQuery.refetch}
          emptyTitle='No classes yet'
          emptyDescription='This organisation has not set up a class.'
        >
          <DataTable
            hideToolbar
            data={classes}
            getRowId={row => row.uuid ?? row.title}
            emptyTitle='No classes yet'
            columns={[
              {
                id: 'title',
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
                id: 'instructor',
                header: 'Instructor',
                cell: ({ row }) => {
                  const uuid = row.original.default_instructor_uuid;
                  return (
                    <span className='text-sm'>
                      {uuid ? (instructorMap[uuid]?.full_name ?? 'Loading…') : 'Unassigned'}
                    </span>
                  );
                },
              },
              {
                id: 'enrolled',
                header: 'Enrolled',
                cell: ({ row }) => (
                  <span className='font-mono text-sm'>
                    {enrolmentCounts[row.original.uuid ?? ''] ?? 0}
                    {row.original.max_participants ? ` / ${row.original.max_participants}` : ''}
                  </span>
                ),
              },
              {
                id: 'sessions',
                header: 'Sessions',
                cell: ({ row }) => (
                  <span className='font-mono text-sm'>
                    {toNumber(row.original.completed_session_count)} /{' '}
                    {toNumber(row.original.scheduled_session_count)}
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
      </SectionCard>

      <SectionCard
        title='Instructors'
        description='Everyone teaching for this organisation, with their qualification and rating.'
      >
        <SectionBoundary
          label='the instructors'
          loading={instructorsQuery.isLoading}
          error={instructorsQuery.error}
          empty={instructors.length === 0}
          onRetry={instructorsQuery.refetch}
          emptyTitle='No instructors yet'
          emptyDescription='Nobody is teaching for this organisation.'
        >
          <DataTable
            hideToolbar
            data={instructors}
            getRowId={row => row.instructor_uuid ?? row.email ?? ''}
            emptyTitle='No instructors yet'
            columns={[
              {
                id: 'instructor',
                header: 'Instructor',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {row.original.full_name}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>{row.original.email}</p>
                  </div>
                ),
              },
              {
                id: 'qualification',
                header: 'Qualification',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-xs'>
                    {[row.original.highest_qualification, row.original.field_of_study]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </span>
                ),
              },
              {
                id: 'skill',
                header: 'Top skill',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-xs'>
                    {row.original.top_skill || '—'}
                  </span>
                ),
              },
              {
                id: 'rating',
                header: 'Rating',
                cell: ({ row }) =>
                  row.original.average_rating ? (
                    <span className='font-mono text-sm'>
                      {Number(row.original.average_rating).toFixed(1)} ·{' '}
                      {toNumber(row.original.review_count)}
                    </span>
                  ) : (
                    <span className='text-muted-foreground text-xs'>No reviews</span>
                  ),
              },
              {
                id: 'classes',
                header: 'Classes',
                cell: ({ row }) => (
                  <span className='font-mono text-sm'>{toNumber(row.original.class_count)}</span>
                ),
              },
            ]}
          />
        </SectionBoundary>
      </SectionCard>
    </div>
  );
}
