'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { BookOpen } from 'lucide-react';
import { useMemo } from 'react';
import type { AdminCourse } from '@/services/admin';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function CoursesTable({ courses }: { courses: AdminCourse[] }) {
  const columns = useMemo<ColumnDef<AdminCourse>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => row.name ?? '',
        header: 'Course',
        meta: { label: 'Course' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <span className='flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40'>
              <BookOpen className='size-4 text-muted-foreground' />
            </span>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-foreground'>{row.original.name}</p>
              <p className='truncate text-xs text-muted-foreground'>
                {row.original.description || '—'}
              </p>
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
        accessorFn: row => row.price ?? 0,
        header: 'Price',
        meta: { label: 'Price' },
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.price != null ? Number(row.original.price).toLocaleString() : '—'}
          </span>
        ),
      },
      {
        id: 'updated',
        accessorFn: row => (row.updated_date ? new Date(row.updated_date).getTime() : 0),
        header: 'Updated',
        meta: { label: 'Updated' },
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.updated_date
              ? new Date(row.original.updated_date).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
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
      pageSize={15}
      emptyTitle='No courses found'
      emptyDescription='No courses match your search or filters.'
    />
  );
}
