'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ClipboardList } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { type AdminRubric, useAdminRubrics } from '@/services/admin';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function RubricsTable() {
  const { data, isLoading } = useAdminRubrics({ page: 0, size: 100 });
  const rubrics = (data?.items ?? []) as AdminRubric[];
  const columns = useMemo<ColumnDef<AdminRubric>[]>(
    () => [
      {
        id: 'title',
        accessorFn: row => row.title ?? '',
        header: 'Rubric',
        meta: { label: 'Rubric' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <span className='border-border/60 bg-muted/40 flex size-9 items-center justify-center rounded-md border'>
              <ClipboardList className='text-muted-foreground size-4' />
            </span>
            <div className='min-w-0'>
              <p className='text-foreground truncate text-sm font-medium'>{row.original.title}</p>
              <p className='text-muted-foreground truncate text-xs'>
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
        id: 'visibility',
        accessorFn: row => (row.is_public ? 'Public' : 'Private'),
        header: 'Visibility',
        meta: { label: 'Visibility' },
        cell: ({ getValue }) => (
          <Badge variant='outline' className='text-xs'>
            {getValue() as string}
          </Badge>
        ),
      },
      {
        id: 'updated',
        accessorFn: row => (row.updated_date ? new Date(row.updated_date).getTime() : 0),
        header: 'Updated',
        meta: { label: 'Updated' },
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
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
      data={rubrics}
      isLoading={isLoading}
      searchPlaceholder='Search rubrics…'
      getRowId={(rubric, index) => rubric.uuid ?? String(index)}
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
      emptyTitle='No rubrics found'
      emptyDescription='No assessment rubrics match your search or filters.'
    />
  );
}
