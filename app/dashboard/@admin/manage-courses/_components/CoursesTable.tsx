'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useMemo } from 'react';
import type { Course } from '@/services/client';
import { getAllCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
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
                <p className='mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
                  {row.original.description}
                </p>
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
        id: 'price',
        accessorFn: row => Number(row.price ?? 0),
        header: 'Price',
        meta: { label: 'Price' },
        cell: ({ row }) => (
          <span className='whitespace-nowrap text-sm text-muted-foreground'>
            {row.original.price != null ? Number(row.original.price).toLocaleString() : '—'}
          </span>
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
      ]}
      pageSize={12}
      emptyTitle='No courses found'
      emptyDescription='No courses match your search or filters.'
    />
  );
}

export function CoursesTable() {
  const { data, isLoading } = useQuery(
    getAllCoursesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );
  const courses = (data?.data?.content ?? []) as Course[];
  return <CoursesTableView courses={courses} isLoading={isLoading} />;
}
