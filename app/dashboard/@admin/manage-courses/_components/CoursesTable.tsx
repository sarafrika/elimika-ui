'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Course } from '@/services/client';
import {
  getAllCoursesOptions,
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

export function CoursesTable() {
  const allQuery = useQuery(getAllCoursesOptions({ query: { pageable: { page: 0, size: 100 } } }));
  const pendingQuery = useQuery(
    listPendingCoursesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  const allCourses = (allQuery.data?.data?.content ?? []) as Course[];
  const pendingCourses = (pendingQuery.data?.data?.content ?? []) as Course[];

  return (
    <Tabs defaultValue='all' className='space-y-3'>
      <TabsList>
        <TabsTrigger value='all'>All courses · {allCourses.length}</TabsTrigger>
        <TabsTrigger value='pending'>Pending review · {pendingCourses.length}</TabsTrigger>
      </TabsList>
      <TabsContent value='all' className='mt-0'>
        <CoursesTableView courses={allCourses} isLoading={allQuery.isLoading} />
      </TabsContent>
      <TabsContent value='pending' className='mt-0'>
        <CoursesTableView courses={pendingCourses} isLoading={pendingQuery.isLoading} />
      </TabsContent>
    </Tabs>
  );
}
