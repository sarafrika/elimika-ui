'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type ModerationQueueItem,
  type ModerationQueueParams,
  useModerationAction,
  useModerationQueue,
} from '@/services/admin';
import { AdminTable } from '../../_components/ui/AdminTable';
import { StatusBadge } from '../../_components/ui/StatusBadge';

const LIST_PARAMS: ModerationQueueParams = { page: 0, size: 200, status: 'all' };

export function ModerationQueueClient() {
  const { data, isLoading } = useModerationQueue(LIST_PARAMS);
  const action = useModerationAction();
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const runAction = (queueUuid: string, kind: 'approve' | 'dismiss') => {
    action.mutate(
      { queueUuid, action: kind, listParams: LIST_PARAMS },
      {
        onSuccess: () => toast.success(kind === 'approve' ? 'Approved' : 'Dismissed'),
        onError: error => toast.error(error instanceof Error ? error.message : 'Action failed'),
      }
    );
  };

  const columns = useMemo<ColumnDef<ModerationQueueItem>[]>(
    () => [
      {
        id: 'entity',
        accessorFn: row => `${row.entity_type} ${row.entity_uuid}`,
        header: 'Submission',
        meta: { label: 'Submission' },
        cell: ({ row }) => (
          <div className='min-w-0'>
            <Badge variant='outline' className='mb-1 text-[10px] uppercase'>
              {row.original.entity_type?.replace(/_/g, ' ')}
            </Badge>
            <p className='truncate text-xs text-muted-foreground'>{row.original.entity_uuid}</p>
          </div>
        ),
      },
      {
        id: 'submitted_by',
        accessorFn: row => row.submitted_by_name || row.submitted_by || '—',
        header: 'Submitted by',
        meta: { label: 'Submitted by' },
        cell: ({ getValue }) => <span className='text-sm'>{getValue() as string}</span>,
      },
      {
        id: 'submitted_at',
        accessorFn: row => (row.submitted_at ? new Date(row.submitted_at).getTime() : 0),
        header: 'Submitted',
        meta: { label: 'Submitted' },
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.submitted_at
              ? new Date(row.original.submitted_at).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: row => row.status ?? 'PENDING',
        header: 'Status',
        meta: { label: 'Status' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') return null;
          return (
            <div className='flex justify-end gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='h-8'
                disabled={action.isPending}
                onClick={e => {
                  e.stopPropagation();
                  runAction(row.original.uuid, 'approve');
                }}
              >
                <Check className='size-4' />
                Approve
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='h-8 text-destructive'
                disabled={action.isPending}
                onClick={e => {
                  e.stopPropagation();
                  runAction(row.original.uuid, 'dismiss');
                }}
              >
                <X className='size-4' />
                Dismiss
              </Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action.isPending]
  );

  return (
    <AdminTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      searchPlaceholder='Search submissions…'
      getRowId={(item, index) => item.uuid ?? String(index)}
      facetedFilters={[
        {
          columnId: 'status',
          title: 'Status',
          options: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Dismissed', value: 'DISMISSED' },
          ],
        },
      ]}
      pageSize={15}
      emptyTitle='Queue is clear'
      emptyDescription='There are no submissions awaiting moderation.'
    />
  );
}
