'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { type SystemRule, useSystemRules } from '@/services/admin/system-config';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function RulesTable() {
  const router = useRouter();
  const { data, isLoading } = useSystemRules({ page: 0, size: 200 });
  const rules = useMemo(() => data?.items ?? [], [data?.items]);

  const columns = useMemo<ColumnDef<SystemRule>[]>(
    () => [
      {
        id: 'key',
        accessorFn: row => `${row.key ?? ''} ${row.category ?? ''}`,
        header: 'Rule',
        meta: { label: 'Rule' },
        cell: ({ row }) => (
          <div className='min-w-0'>
            <p className='truncate font-mono text-sm font-medium text-foreground'>
              {row.original.key}
            </p>
            <p className='truncate text-xs text-muted-foreground'>{row.original.category}</p>
          </div>
        ),
      },
      {
        id: 'scope',
        accessorFn: row => row.scope ?? '',
        header: 'Scope',
        meta: { label: 'Scope' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => (
          <div>
            <Badge variant='outline' className='text-[10px] uppercase'>
              {row.original.scope?.replace(/_/g, ' ') || '—'}
            </Badge>
            {row.original.scopeReference ? (
              <p className='mt-1 truncate text-xs text-muted-foreground'>{row.original.scopeReference}</p>
            ) : null}
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
        id: 'priority',
        accessorFn: row => row.priority ?? 0,
        header: 'Priority',
        meta: { label: 'Priority' },
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>{row.original.priority ?? '—'}</span>
        ),
      },
    ],
    []
  );

  return (
    <AdminTable
      columns={columns}
      data={rules}
      isLoading={isLoading}
      searchPlaceholder='Search rules…'
      getRowId={(rule, index) => rule.uuid ?? String(index)}
      onRowClick={rule => rule.uuid && router.push(`/dashboard/system-config/rules/${rule.uuid}`)}
      facetedFilters={[
        {
          columnId: 'status',
          title: 'Status',
          options: [
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
            { label: 'Draft', value: 'DRAFT' },
          ],
        },
        {
          columnId: 'scope',
          title: 'Scope',
          options: [
            { label: 'Global', value: 'GLOBAL' },
            { label: 'Organisation', value: 'ORGANISATION' },
            { label: 'User', value: 'USER' },
          ],
        },
      ]}
      pageSize={15}
      emptyTitle='No system rules'
      emptyDescription='Create a rule to configure platform behaviour.'
    />
  );
}
