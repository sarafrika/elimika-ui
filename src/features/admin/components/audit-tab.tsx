'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable, SectionCardSkeleton, StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { absoluteDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { AdminUserActivityEvent } from '@/services/client';
import { usePersonActivity } from '../hooks/use-person-record';
import { enumParam, numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';
import { SectionBoundary } from './section-boundary';

const SCOPES = ['all', 'actor', 'target'] as const;

const CATEGORIES = [
  'credentials',
  'content',
  'training',
  'learning',
  'organisation',
  'commerce',
  'security',
  'admin',
];

const methodTone = (method?: string) => {
  if (method === 'GET') return 'neutral' as const;
  if (method === 'DELETE') return 'destructive' as const;
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') return 'info' as const;
  return 'neutral' as const;
};

export function AuditTab({ userUuid, targetUuids }: { userUuid: string; targetUuids: string[] }) {
  const [scope, setScope] = useSearchState('scope', enumParam(SCOPES, 'all'));
  const [category, setCategory] = useSearchState('category', stringParam());
  const [page, setPage] = useSearchState('page', numberParam(0));

  const { events, total, pageCount, query } = usePersonActivity(userUuid, {
    scope,
    category: category || undefined,
    targetUuids,
    page,
  });

  const columns = useMemo<ColumnDef<AdminUserActivityEvent, unknown>[]>(
    () => [
      {
        id: 'time',
        header: 'Time',
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.original.occurred_at ? absoluteDateTime(row.original.occurred_at, '—') : '—'}
          </span>
        ),
      },
      {
        id: 'summary',
        header: 'What happened',
        cell: ({ row }) => (
          <span className='text-sm font-medium'>{row.original.summary ?? '—'}</span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className='text-muted-foreground text-xs'>{row.original.category ?? 'system'}</span>
        ),
      },
      {
        id: 'method',
        header: 'Method',
        cell: ({ row }) => (
          <StatusBadge tone={methodTone(row.original.http_method)} label={row.original.http_method ?? '—'} />
        ),
      },
      {
        id: 'endpoint',
        header: 'Endpoint',
        cell: ({ row }) => (
          <span className='text-muted-foreground block max-w-[280px] truncate font-mono text-xs'>
            {row.original.endpoint ?? '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.response_status ?? 0;
          return (
            <span
              className={cn(
                'font-mono text-xs',
                status >= 400 ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {status || '—'}
            </span>
          );
        },
      },
      {
        id: 'actor',
        header: 'Who',
        cell: ({ row }) => (
          <span className='text-sm'>{row.original.actor_name ?? row.original.actor_email ?? '—'}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-1'>
          {SCOPES.map(option => (
            <Button
              key={option}
              size='sm'
              variant={scope === option ? 'default' : 'outline'}
              className='rounded-md capitalize'
              onClick={() => setScope(option)}
            >
              {option === 'all' ? 'Everything' : option === 'actor' ? 'They did' : 'Done to them'}
            </Button>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-1'>
          <Button
            size='sm'
            variant={category ? 'outline' : 'secondary'}
            className='rounded-md'
            onClick={() => setCategory('')}
          >
            All categories
          </Button>
          {CATEGORIES.map(option => (
            <Button
              key={option}
              size='sm'
              variant={category === option ? 'secondary' : 'outline'}
              className='rounded-md capitalize'
              onClick={() => setCategory(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <SectionBoundary
        label='the audit trail'
        loading={query.isLoading && !query.data}
        error={query.error}
        onRetry={() => query.refetch()}
        skeleton={<SectionCardSkeleton rows={6} />}
      >
        <DataTable
          columns={columns}
          data={events}
          isLoading={query.isFetching && !query.data}
          hideToolbar
          getRowId={row => row.event_uuid ?? ''}
          emptyTitle='Nothing recorded'
          emptyDescription='No requests match this scope and category.'
          serverPagination={{ page, pageCount, totalRows: total, onPageChange: setPage }}
        />
      </SectionBoundary>

      <p className='text-muted-foreground text-xs'>
        The feed is built from request logs, so reads appear alongside changes, enrolment events are
        filed under “system”, and the reason behind a decision only shows inside the query string.
      </p>
    </div>
  );
}
