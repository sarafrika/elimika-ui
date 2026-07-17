'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Course, CoursePendingEdit } from '@/services/client';
import {
  getAllCoursesOptions,
  getCourseByUuidOptions,
  listPendingCourseEditsOptions,
  listPendingCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import HTMLTextPreview from '../../../../../components/editors/html-text-preview';
import { Button } from '../../../../../components/ui/button';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

function Thumb({ url, alt }: { url?: string | null; alt: string }) {
  const src = url ? toAuthenticatedMediaUrl(url) || url : undefined;
  return (
    <div className='flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/40'>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className='h-full w-full object-cover' loading='lazy' />
      ) : (
        <BookOpen className='size-5 text-muted-foreground' />
      )}
    </div>
  );
}

function CoursesTableView({ courses, isLoading }: { courses: Course[]; isLoading: boolean }) {
  const router = useRouter();
  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => `${row.name ?? ''} ${row.description ?? ''}`,
        header: 'Course',
        meta: { label: 'Course' },
        cell: ({ row }) => (
          <div className='flex items-start gap-3'>
            <Thumb url={row.original.thumbnail_url ?? row.original.banner_url} alt={row.original.name ?? ''} />
            <div className='min-w-0 max-w-md'>
              <p className='truncate font-medium text-foreground'>{row.original.name}</p>
              {row.original.description ? (
                <HTMLTextPreview className='mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground' htmlContent={row.original.description} />
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        accessorFn: row => row.status ?? '',
        header: 'Status',
        meta: { label: 'Status' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'approval',
        accessorFn: row => (row.admin_approved ? 'approved' : 'awaiting'),
        header: 'Approval',
        meta: { label: 'Approval' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => (
          <StatusBadge
            tone={row.original.admin_approved ? 'success' : 'warning'}
            label={row.original.admin_approved ? 'Approved' : 'Awaiting review'}
          />
        ),
      },
      // {
      //   id: 'price',
      //   accessorFn: row => Number(row.price ?? 0),
      //   header: 'Price',
      //   meta: { label: 'Price' },
      //   cell: ({ row }) => (
      //     <span className='whitespace-nowrap text-sm text-muted-foreground'>
      //       {row.original.price != null ? Number(row.original.price).toLocaleString() : '—'}
      //     </span>
      //   ),
      // },
      {
        id: 'details',
        accessorFn: row => Number(row.price ?? 0),
        header: 'Details',
        meta: { label: 'Details' },
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/dashboard/manage-courses/${row.original.uuid}`)
            }
          >
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <AdminTable
      columns={columns}
      data={courses}
      isLoading={isLoading}
      searchPlaceholder='Search courses…'
      getRowId={(course, index) => course.uuid ?? String(index)}
      onRowClick={course => {
        if (course.uuid) router.push(`/dashboard/manage-courses/${course.uuid}`);
      }}
      facetedFilters={[
        {
          columnId: 'status',
          title: 'Status',
          options: [
            { label: 'Draft', value: 'DRAFT' },
            { label: 'In review', value: 'IN_REVIEW' },
            { label: 'Published', value: 'PUBLISHED' },
            { label: 'Archived', value: 'ARCHIVED' },
          ],
        },
        {
          columnId: 'approval',
          title: 'Approval',
          options: [
            { label: 'Approved', value: 'approved' },
            { label: 'Awaiting review', value: 'awaiting' },
          ],
        },
      ]}
      pageSize={12}
      emptyTitle='No courses found'
      emptyDescription='No courses match your search or filters.'
    />
  );
}

/**
 * Edits awaiting review on courses that are already live.
 *
 * Deliberately a separate view from the course queues: the course itself is fine and
 * published, and only the proposed change needs a decision.
 */
function PendingEditsTableView({
  edits,
  isLoading,
}: {
  edits: CoursePendingEdit[];
  isLoading: boolean;
}) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<CoursePendingEdit>[]>(
    () => [
      {
        id: 'course',
        header: 'Course',
        accessorFn: row => row.course_uuid ?? '',
        cell: ({ row }) => <PendingEditCourseCell courseUuid={row.original.course_uuid} />,
      },
      {
        id: 'submitted',
        header: 'Submitted',
        accessorFn: row => row.submitted_at ?? '',
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.submitted_at
              ? new Date(row.original.submitted_at).toLocaleString()
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant='outline'
            size='sm'
            onClick={e => {
              e.stopPropagation();
              if (row.original.course_uuid) {
                router.push(`/dashboard/manage-courses/${row.original.course_uuid}`);
              }
            }}
          >
            Review
          </Button>
        ),
      },
    ],
    [router]
  );

  return (
    <AdminTable
      columns={columns}
      data={edits}
      isLoading={isLoading}
      searchPlaceholder='Search pending edits…'
      getRowId={(edit, index) => edit.uuid ?? String(index)}
      onRowClick={edit => {
        if (edit.course_uuid) router.push(`/dashboard/manage-courses/${edit.course_uuid}`);
      }}
      pageSize={12}
      emptyTitle='No edits awaiting review'
      emptyDescription='Published courses with proposed changes will appear here.'
    />
  );
}

/** Resolves the course name for a pending edit row, which only carries uuids. */
function PendingEditCourseCell({ courseUuid }: { courseUuid?: string }) {
  const { data } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid as string } }),
    enabled: !!courseUuid,
  });
  const course = data?.data as Course | undefined;

  return (
    <div className='flex items-center gap-3'>
      <Thumb url={course?.thumbnail_url} alt={course?.name ?? 'Course'} />
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium'>{course?.name ?? 'Loading…'}</p>
        <p className='truncate text-xs text-muted-foreground'>Still live · showing approved version</p>
      </div>
    </div>
  );
}

export function CoursesTable() {
  const allQuery = useQuery(getAllCoursesOptions({ query: { pageable: { page: 0, size: 100 } } }));
  const pendingQuery = useQuery(
    listPendingCoursesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );
  // Edits to already-published courses. These never appear in the queue above: the live
  // course keeps admin_approved = true while its edit is reviewed.
  const pendingEditsQuery = useQuery(
    listPendingCourseEditsOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  const allCourses = (allQuery.data?.data?.content ?? []) as Course[];
  const pendingCourses = (pendingQuery.data?.data?.content ?? []) as Course[];
  const pendingEdits = (pendingEditsQuery.data?.data?.content ?? []) as CoursePendingEdit[];

  return (
    <Tabs defaultValue='all' className='space-y-3'>
      <TabsList>
        <TabsTrigger value='all'>All courses · {allCourses.length}</TabsTrigger>
        <TabsTrigger value='pending'>Pending review · {pendingCourses.length}</TabsTrigger>
        <TabsTrigger value='pending-edits'>Pending edits · {pendingEdits.length}</TabsTrigger>
      </TabsList>
      <TabsContent value='all' className='mt-0'>
        <CoursesTableView courses={allCourses} isLoading={allQuery.isLoading} />
      </TabsContent>
      <TabsContent value='pending' className='mt-0'>
        <CoursesTableView courses={pendingCourses} isLoading={pendingQuery.isLoading} />
      </TabsContent>
      <TabsContent value='pending-edits' className='mt-0'>
        <PendingEditsTableView edits={pendingEdits} isLoading={pendingEditsQuery.isLoading} />
      </TabsContent>
    </Tabs>
  );
}
