'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, BookOpen, FileDiff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { DataTable, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { formatDateOnly } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import type { Course } from '@/services/client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { FilterBar } from '../components/filter-bar';
import { SectionBoundary } from '../components/section-boundary';
import { useAdminStatistics } from '../hooks/use-admin-dashboard';
import {
  COURSE_PAGE_SIZE,
  useCourseQueueCounts,
  useCourses,
  type CourseApprovalFilter,
  type CourseStatusFilter,
} from '../hooks/use-courses';
import { adminRoutes } from '../lib/admin-routes';
import { enumParam, numberParam, stringParam } from '../state/search-state';
import { useSearchState, useSearchStatePatch } from '../state/use-search-state';

const STATUSES: { id: CourseStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_review', label: 'In review' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' },
];

const STATUS_IDS = STATUSES.map(status => status.id) as CourseStatusFilter[];
const APPROVALS = ['any', 'approved', 'awaiting'] as const;

const statusParam = enumParam<CourseStatusFilter>(STATUS_IDS, 'all');
const approvalParam = enumParam<CourseApprovalFilter>(APPROVALS, 'any');
const queryParam = stringParam();
const pageParam = numberParam(0);

const money = (value?: number | null) =>
  value === null || value === undefined ? '—' : `KES ${Number(value).toLocaleString('en-KE')}`;

export function CoursesPage() {
  const [status] = useSearchState<CourseStatusFilter>('status', statusParam);
  const [approval] = useSearchState<CourseApprovalFilter>('approval', approvalParam);
  const [q] = useSearchState('q', queryParam);
  const [page] = useSearchState('page', pageParam);
  const patch = useSearchStatePatch();
  const router = useRouter();

  const result = useCourses({ status, approval, q, page });
  const { statistics } = useAdminStatistics();
  const queues = useCourseQueueCounts();

  const learning = statistics?.learning_metrics;
  const countFor = (id: CourseStatusFilter) => {
    if (!learning) return undefined;
    if (id === 'all') return toNumber(learning.total_courses);
    if (id === 'in_review') return toNumber(learning.in_review_courses);
    if (id === 'published') return toNumber(learning.published_courses);
    if (id === 'draft') return toNumber(learning.draft_courses);
    return toNumber(learning.archived_courses);
  };

  // Course rows carry a creator uuid and no name. One batched lookup covers the page.
  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(
          result.courses
            .map(course => course.course_creator_uuid)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [result.courses]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        id: 'Course',
        header: 'Course',
        cell: ({ row }) => {
          const course = row.original;
          const thumbnail = toAuthenticatedMediaUrl(course.thumbnail_url);
          return (
            <div className='flex items-center gap-3'>
              <span className='bg-muted relative size-10 shrink-0 overflow-hidden rounded-md'>
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt=''
                    fill
                    sizes='40px'
                    className='object-cover'
                    unoptimized
                  />
                ) : (
                  <span className='flex size-full items-center justify-center'>
                    <BookOpen className='text-muted-foreground size-4' />
                  </span>
                )}
              </span>
              <div className='min-w-0'>
                <p className='text-foreground truncate text-sm font-medium'>{course.name}</p>
                <p className='text-muted-foreground truncate text-xs'>
                  {course.total_duration_display || '—'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'Creator',
        header: 'Creator',
        cell: ({ row }) => {
          const creator = courseCreatorMap[row.original.course_creator_uuid ?? ''];
          if (!creator) return <Skeleton className='h-4 w-28' />;
          return <span className='text-foreground text-sm'>{creator.full_name || '—'}</span>;
        },
      },
      {
        id: 'Categories',
        header: 'Categories',
        cell: ({ row }) => {
          const names = row.original.category_names ?? [];
          if (!names.length) return <span className='text-muted-foreground'>—</span>;
          return (
            <div className='flex flex-wrap gap-1'>
              {names.slice(0, 2).map(name => (
                <StatusBadge key={name} tone='neutral' label={name} />
              ))}
              {names.length > 2 ? (
                <span className='text-muted-foreground text-xs'>+{names.length - 2}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'Status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'Approval',
        header: 'Approval',
        cell: ({ row }) =>
          row.original.admin_approved ? (
            <StatusBadge tone='success' label='Approved' />
          ) : (
            <StatusBadge tone='warning' label='Awaiting review' />
          ),
      },
      {
        id: 'Price',
        header: 'Price',
        cell: ({ row }) => (
          <span className='text-foreground font-mono text-xs'>{money(row.original.price)}</span>
        ),
      },
      {
        id: 'Updated',
        header: 'Updated',
        cell: ({ row }) => (
          <span className='text-muted-foreground font-mono text-xs'>
            {formatDateOnly(row.original.updated_date)}
          </span>
        ),
      },
    ],
    [courseCreatorMap]
  );

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Learning'
          title='Courses'
          description='Every course on the platform, with what is waiting for a decision called out.'
        />

        <div className='grid gap-4 sm:grid-cols-2'>
          <QueueCallout
            icon={<BookOpen className='size-4' />}
            title='Courses awaiting approval'
            count={queues.pendingCourses}
            isLoading={queues.isLoading}
            href={adminRoutes.inbox('courses')}
          />
          <QueueCallout
            icon={<FileDiff className='size-4' />}
            title='Edits waiting on a live course'
            count={queues.pendingEdits}
            isLoading={queues.isLoading}
            href={adminRoutes.inbox('edits')}
          />
        </div>

        <nav aria-label='Course status' className='border-border/70 flex flex-wrap gap-4 border-b'>
          {STATUSES.map(entry => {
            const isActive = entry.id === status;
            const count = countFor(entry.id);
            return (
              <Link
                key={entry.id}
                href={adminRoutes.courses({
                  status: entry.id === 'all' ? undefined : entry.id,
                  q: q || undefined,
                })}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  '-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
                )}
              >
                {entry.label}
                {count === undefined ? null : (
                  <span className='text-muted-foreground font-mono text-xs'>{count}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <FilterBar
          values={{ q, approval }}
          searchPlaceholder='Search by course name…'
          filters={[
            {
              key: 'approval',
              label: 'Approval',
              anyValue: 'any',
              options: [
                { value: 'approved', label: 'Approved' },
                { value: 'awaiting', label: 'Awaiting review' },
              ],
            },
          ]}
        />

        <SectionBoundary
          label='the course list'
          loading={result.isLoading}
          error={result.error}
          empty={result.courses.length === 0}
          onRetry={result.refetch}
          emptyTitle={result.isFiltered ? 'Nothing matches these filters' : 'No courses yet'}
          emptyDescription={
            result.isFiltered
              ? 'Clear the search or filters to see every course.'
              : 'Courses appear here once creators submit them.'
          }
          skeleton={
            <div className='space-y-3'>
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          }
        >
          <DataTable
            columns={columns}
            data={result.courses}
            getRowId={course => course.uuid ?? course.name}
            onRowClick={course => {
              if (course.uuid) router.push(adminRoutes.course(course.uuid));
            }}
            enableRowSelection={false}
            hideToolbar
            pageSize={COURSE_PAGE_SIZE}
            emptyTitle='Nothing on this page'
            emptyDescription='Try another page or clear the filters.'
            serverPagination={{
              page,
              pageCount: result.pageCount,
              totalRows: result.total,
              onPageChange: next => patch({ page: next === 0 ? undefined : String(next) }),
            }}
          />
        </SectionBoundary>

        <p className='text-muted-foreground text-xs'>
          Enrolment and sales figures are not on the list payload, so they load one course at a
          time inside the record rather than once per row here.
        </p>
      </div>
    </div>
  );
}

function QueueCallout({
  icon,
  title,
  count,
  isLoading,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  isLoading: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        surfaceTheme.card,
        'hover:border-primary/40 flex items-center gap-3 px-4 py-3 transition-colors'
      )}
    >
      <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md'>
        {icon}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='text-foreground block text-sm font-medium'>{title}</span>
        <span className='text-muted-foreground block text-xs'>Opens the review inbox</span>
      </span>
      {isLoading ? (
        <Skeleton className='h-6 w-8' />
      ) : (
        <span className='text-foreground font-mono text-lg'>{count}</span>
      )}
      <ArrowRight className='text-muted-foreground size-4' />
    </Link>
  );
}
