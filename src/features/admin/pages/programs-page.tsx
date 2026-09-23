'use client';

import { Layers, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { DataTable, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import type { TrainingProgram } from '@/services/client';
import { FilterBar } from '../components/filter-bar';
import { SectionBoundary } from '../components/section-boundary';
import { usePendingPrograms, usePrograms, PROGRAMS_PAGE_SIZE } from '../hooks/use-programs';
import { adminRoutes } from '../lib/admin-routes';
import { numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const searchParam = stringParam();
const statusParam = stringParam('any');
const approvalParam = stringParam('any');
const pageParam = numberParam(0);

const money = (price?: number | null) =>
  price === null || price === undefined ? 'Free' : `KES ${Number(price).toLocaleString('en-KE')}`;

export function ProgramsPage() {
  const router = useRouter();
  const [q] = useSearchState('q', searchParam);
  const [status] = useSearchState('status', statusParam);
  const [approval] = useSearchState('approval', approvalParam);
  const [page, setPage] = useSearchState('page', pageParam);

  const { programs, totalRows, pageCount, query } = usePrograms({ q, status, approval, page });
  const { total: pendingTotal, query: pendingQuery } = usePendingPrograms();

  // One batched lookup turns creator ids into names; never one request per row.
  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(programs.map(program => program.course_creator_uuid).filter(Boolean))
      ) as string[],
    [programs]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);

  const isFiltered = Boolean(q) || status !== 'any' || approval !== 'any';

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Learning'
          title='Programs'
          description='Learning pathways built from courses, and who may deliver them.'
        />

        <SectionBoundary
          label='the pending count'
          loading={pendingQuery.isLoading}
          error={pendingQuery.error}
          onRetry={pendingQuery.refetch}
          skeleton={<Skeleton className='h-16 w-full rounded-md' />}
        >
          <div className='border-border/70 bg-card flex flex-wrap items-center gap-3 rounded-md border px-4 py-3'>
            <Send className='text-primary size-4 shrink-0' />
            <p className='text-foreground flex-1 text-sm'>
              {pendingTotal > 0
                ? `${pendingTotal} program${pendingTotal === 1 ? '' : 's'} submitted for approval.`
                : 'No program is waiting for approval.'}
            </p>
            {pendingTotal > 0 ? (
              <Link
                href={adminRoutes.programs({ approval: 'awaiting' })}
                className='text-primary text-sm font-semibold hover:underline'
              >
                Show them
              </Link>
            ) : null}
          </div>
          <p className='text-muted-foreground mt-2 text-xs'>
            A program left in draft when it is published never reaches this queue — that needs a
            backend fix.
          </p>
        </SectionBoundary>

        <FilterBar
          values={{ q, status, approval }}
          searchPlaceholder='Search program titles…'
          filters={[
            {
              key: 'status',
              label: 'Status',
              anyValue: 'any',
              options: [
                { value: 'draft', label: 'Draft' },
                { value: 'in_review', label: 'In review' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
              ],
            },
            {
              key: 'approval',
              label: 'Approval',
              anyValue: 'any',
              options: [
                { value: 'approved', label: 'Approved' },
                { value: 'awaiting', label: 'Awaiting approval' },
              ],
            },
          ]}
        />

        <SectionBoundary
          label='the programs'
          loading={query.isLoading && programs.length === 0}
          error={query.error}
          onRetry={query.refetch}
          empty={!query.isLoading && programs.length === 0}
          emptyTitle={isFiltered ? 'Nothing matches these filters' : 'No programs yet'}
          emptyDescription={
            isFiltered
              ? 'Clear the search or filters to see every program.'
              : 'Programs appear here once a creator builds one.'
          }
        >
          <DataTable<TrainingProgram, unknown>
            hideToolbar
            data={programs}
            isLoading={query.isLoading}
            pageSize={PROGRAMS_PAGE_SIZE}
            getRowId={row => row.uuid ?? row.title}
            onRowClick={row => {
              if (row.uuid) router.push(adminRoutes.program(row.uuid));
            }}
            serverPagination={{ page, pageCount, totalRows, onPageChange: setPage }}
            columns={[
              {
                id: 'program',
                header: 'Program',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {row.original.title}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {row.original.total_duration_display || '—'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'creator',
                header: 'Creator',
                cell: ({ row }) => {
                  const creator = courseCreatorMap[row.original.course_creator_uuid ?? ''];
                  return (
                    <span className='text-muted-foreground text-sm'>
                      {creator?.full_name ?? '—'}
                    </span>
                  );
                },
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
              {
                id: 'published',
                header: 'Published',
                cell: ({ row }) => (
                  <StatusBadge
                    label={row.original.published ? 'Published' : 'Unpublished'}
                    tone={row.original.published ? 'success' : 'neutral'}
                  />
                ),
              },
              {
                id: 'approval',
                header: 'Approval',
                cell: ({ row }) => (
                  <StatusBadge
                    label={row.original.admin_approved ? 'Approved' : 'Awaiting review'}
                    tone={row.original.admin_approved ? 'success' : 'warning'}
                  />
                ),
              },
              {
                id: 'price',
                header: 'Price',
                cell: ({ row }) => (
                  <span className='text-foreground font-mono text-xs'>
                    {money(row.original.price)}
                  </span>
                ),
              },
              {
                id: 'type',
                header: 'Type',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-sm'>
                    {row.original.program_type || '—'}
                  </span>
                ),
              },
              {
                id: 'updated',
                header: 'Updated',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {formatDate(row.original.updated_date) || '—'}
                  </span>
                ),
              },
            ]}
          />
        </SectionBoundary>

        <p className='text-muted-foreground flex items-center gap-2 text-xs'>
          <Layers className='size-3.5 shrink-0' />
          Enrolment and course counts are not on the program payload, so they are read inside a
          program rather than listed here.
        </p>
      </div>
    </div>
  );
}
