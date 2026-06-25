'use client';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Layers } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { TrainingProgram } from '@/services/client';
import { getAllTrainingProgramsOptions } from '@/services/client/@tanstack/react-query.gen';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

function ProgramsTableView({
  programs,
  isLoading,
}: {
  programs: TrainingProgram[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<TrainingProgram>[]>(
    () => [
      {
        id: 'title',
        accessorFn: row => `${row.title ?? ''} ${row.description ?? ''}`,
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => (
          <div className='flex items-start gap-3'>
            <div className='flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40'>
              <Layers className='size-5 text-muted-foreground' />
            </div>
            <div className='min-w-0 max-w-md'>
              <p className='truncate font-medium text-foreground'>{row.original.title}</p>
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
        id: 'published',
        accessorFn: row => (row.published ? 'Published' : 'Unpublished'),
        header: 'Visibility',
        meta: { label: 'Visibility' },
        cell: ({ getValue }) => (
          <Badge variant='outline' className='whitespace-nowrap text-xs'>
            {getValue() as string}
          </Badge>
        ),
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
      data={programs}
      isLoading={isLoading}
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
      pageSize={12}
      emptyTitle='No programs found'
      emptyDescription='No training programs match your search or filters.'
    />
  );
}

export function ProgramsTable() {
  const { data, isLoading } = useQuery(
    getAllTrainingProgramsOptions({ query: { pageable: { page: 0, size: 100 } } })
  );
  const programs = (data?.data?.content ?? []) as TrainingProgram[];
  return <ProgramsTableView programs={programs} isLoading={isLoading} />;
}
