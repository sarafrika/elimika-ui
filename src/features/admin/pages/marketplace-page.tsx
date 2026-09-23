'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { DataTable, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCoursesByIds,
  useOrganisationsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import { SectionBoundary } from '../components/section-boundary';
import { JOB_STATUSES, JOBS_PAGE_SIZE, useMarketplaceJobs } from '../hooks/use-marketplace';
import { adminRoutes } from '../lib/admin-routes';
import { numberParam, stringParam } from '../state/search-state';
import { useSearchState, useSearchStatePatch } from '../state/use-search-state';

const statusParam = stringParam('any');
const pageParam = numberParam(0);

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'destructive' | 'info'> = {
  open: 'success',
  awaiting_class: 'warning',
  filled: 'info',
  cancelled: 'destructive',
  expired: 'neutral',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  awaiting_class: 'Awaiting class',
  filled: 'Filled',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const money = (amount?: number | null) =>
  typeof amount === 'number' ? amount.toLocaleString('en-KE') : '—';

export function MarketplacePage() {
  const router = useRouter();
  const [status] = useSearchState('status', statusParam);
  const [page, setPage] = useSearchState('page', pageParam);
  const patch = useSearchStatePatch();

  const { jobs, totalRows, pageCount, query } = useMarketplaceJobs({
    status: status === 'any' ? undefined : status,
    page,
  });

  // Jobs carry only uuids for the organisation, course and program, so each set of names
  // is fetched once for the whole page rather than once per row.
  const organisationIds = useMemo(
    () => jobs.map(job => job.organisation_uuid).filter((id): id is string => Boolean(id)),
    [jobs]
  );
  const courseIds = useMemo(
    () => jobs.map(job => job.course_uuid).filter((id): id is string => Boolean(id)),
    [jobs]
  );
  const programIds = useMemo(
    () => jobs.map(job => job.program_uuid).filter((id): id is string => Boolean(id)),
    [jobs]
  );

  const { organisationMap } = useOrganisationsByIds(organisationIds);
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Marketplace'
          title='Class jobs'
          description='What organisations are hiring instructors to teach, and how far each hire has got.'
        />

        {/* The jobs endpoint filters but does not search, so there is no search box here. */}
        <div className='flex flex-wrap items-center gap-2'>
          <Select
            value={status}
            onValueChange={value => patch({ status: value === 'any' ? undefined : value })}
          >
            <SelectTrigger className='border-border/70 h-9 w-auto min-w-[180px] rounded-md'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Status: any</SelectItem>
              {JOB_STATUSES.map(value => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABEL[value] ?? value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-muted-foreground text-xs'>
            Newest first — the endpoint fixes the order.
          </span>
        </div>

        <SectionBoundary
          label='the job list'
          loading={query.isLoading && jobs.length === 0}
          error={query.error}
          onRetry={query.refetch}
          empty={!query.isLoading && jobs.length === 0}
          emptyTitle={status === 'any' ? 'No jobs posted yet' : 'Nothing at this status'}
          emptyDescription={
            status === 'any'
              ? 'Organisations post here when they need an instructor for a class.'
              : 'Clear the filter to see every job.'
          }
          skeleton={
            <div className='space-y-3'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          }
        >
          <DataTable
            hideToolbar
            data={jobs}
            isLoading={query.isLoading}
            getRowId={job => job.uuid ?? job.title ?? ''}
            onRowClick={job => job.uuid && router.push(adminRoutes.job(job.uuid))}
            pageSize={JOBS_PAGE_SIZE}
            serverPagination={{ page, pageCount, totalRows, onPageChange: setPage }}
            columns={[
              {
                id: 'job',
                header: 'Job',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {row.original.title || 'Untitled job'}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {row.original.branch_name || 'No branch named'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'organisation',
                header: 'Organisation',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-sm'>
                    {organisationMap[row.original.organisation_uuid ?? '']?.name ?? '—'}
                  </span>
                ),
              },
              {
                id: 'offering',
                header: 'Course or program',
                cell: ({ row }) => {
                  const course = courseMap[row.original.course_uuid ?? ''];
                  const program = programMap[row.original.program_uuid ?? ''];
                  return (
                    <span className='text-muted-foreground text-sm'>
                      {course?.name ?? program?.title ?? '—'}
                    </span>
                  );
                },
              },
              {
                id: 'money',
                header: 'Sale / pay',
                cell: ({ row }) => (
                  <div className='font-mono text-xs'>
                    <p className='text-foreground'>{money(row.original.sale_price)}</p>
                    <p className='text-muted-foreground'>
                      {money(row.original.instructor_pay)} {row.original.rate_basis ?? ''}
                    </p>
                  </div>
                ),
              },
              {
                id: 'applications',
                header: 'Applications',
                cell: ({ row }) => (
                  <span className='text-foreground font-mono text-sm'>
                    {toNumber(row.original.application_count)}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <StatusBadge
                    label={STATUS_LABEL[row.original.status ?? ''] ?? row.original.status ?? '—'}
                    tone={STATUS_TONE[row.original.status ?? ''] ?? 'neutral'}
                  />
                ),
              },
              {
                id: 'created',
                header: 'Posted',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {formatDate(row.original.created_date) || '—'}
                  </span>
                ),
              },
            ]}
          />
        </SectionBoundary>

        <p className='text-muted-foreground text-xs'>
          The marketplace is read-only for admins: cancelling a job and deciding on applicants are
          organisation-manager actions, and adding them for admins is a backend change.
        </p>
      </div>
    </div>
  );
}
