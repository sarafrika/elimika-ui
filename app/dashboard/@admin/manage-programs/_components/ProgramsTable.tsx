'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Layers } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { TrainingProgram } from '@/services/client';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function ProgramsTable({ programs }: { programs: TrainingProgram[] }) {
  const columns = useMemo<ColumnDef<TrainingProgram>[]>(
    () => [
      {
        id: 'title',
        accessorFn: row => row.title ?? '',
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <span className='flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40'>
              <Layers className='size-4 text-muted-foreground' />
            </span>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-foreground'>{row.original.title}</p>
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
        id: 'published',
        accessorFn: row => (row.published ? 'Published' : 'Unpublished'),
        header: 'Visibility',
        meta: { label: 'Visibility' },
        cell: ({ getValue }) => (
          <Badge variant='outline' className='text-xs'>
            {getValue() as string}
          </Badge>
        ),
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
    ],
    []
  );

  return (
    <AdminTable
      columns={columns}
      data={programs}
      searchPlaceholder='Search programs…'
      getRowId={(program, index) => program.uuid ?? String(index)}
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
      emptyTitle='No programs found'
      emptyDescription='No training programs match your search or filters.'
    />
  );
}
