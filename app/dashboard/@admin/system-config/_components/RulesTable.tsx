'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type SystemRule, useSystemRules } from '@/services/admin/system-config';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';
import { RuleDrawer } from './RuleDrawer';

interface DrawerState {
  open: boolean;
  mode: 'create' | 'edit';
  rule: SystemRule | null;
}

const CLOSED: DrawerState = { open: false, mode: 'edit', rule: null };

export function RulesTable() {
  const searchParams = useSearchParams();
  const { data, isLoading, refetch } = useSystemRules({ page: 0, size: 200 });
  const rules = useMemo(() => data?.items ?? [], [data?.items]);
  const [drawer, setDrawer] = useState<DrawerState>(CLOSED);

  // Open the drawer when arriving via ?rule=<uuid> (or ?rule=new) — this is where
  // /system-config/rules/[uuid] and /rules/new redirect to.
  const ruleParam = searchParams.get('rule');
  useEffect(() => {
    if (!ruleParam) return;
    if (ruleParam === 'new') {
      setDrawer({ open: true, mode: 'create', rule: null });
      return;
    }
    const match = rules.find(rule => rule.uuid === ruleParam) ?? null;
    setDrawer({ open: true, mode: 'edit', rule: match });
  }, [ruleParam, rules]);

  const closeDrawer = () => {
    setDrawer(CLOSED);
    // Drop the ?rule= param without a full navigation.
    if (typeof window !== 'undefined' && window.location.search.includes('rule=')) {
      window.history.replaceState(null, '', '/dashboard/system-config');
    }
  };

  const columns = useMemo<ColumnDef<SystemRule>[]>(
    () => [
      {
        id: 'key',
        accessorFn: row => `${row.key ?? ''} ${row.category ?? ''}`,
        header: 'Rule',
        meta: { label: 'Rule' },
        cell: ({ row }) => (
          <div className='min-w-0'>
            <p className='truncate font-mono text-sm font-medium text-foreground'>{row.original.key}</p>
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
    <>
      <AdminTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        searchPlaceholder='Search rules…'
        getRowId={(rule, index) => rule.uuid ?? String(index)}
        onRowClick={rule => setDrawer({ open: true, mode: 'edit', rule })}
        toolbar={
          <Button size='sm' className='h-9 rounded-xl' onClick={() => setDrawer({ open: true, mode: 'create', rule: null })}>
            <Plus className='size-4' />
            New rule
          </Button>
        }
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

      <RuleDrawer
        open={drawer.open}
        mode={drawer.mode}
        ruleId={drawer.rule?.uuid ?? null}
        initialRule={drawer.rule}
        onClose={closeDrawer}
        onSaved={() => {
          closeDrawer();
          refetch();
        }}
      />
    </>
  );
}
