'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DataTable, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { formatDateTime } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import type { AdminActivityEvent } from '@/services/client';
import { getDashboardActivityOptions } from '@/services/client/@tanstack/react-query.gen';
import { queueQuery } from '../lib/admin-queries';
import { numberParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';
import { SectionBoundary } from '../components/section-boundary';

const PAGE_SIZE = 25;
const pageParam = numberParam(0);

function methodTone(method?: string) {
  if (method === 'POST') return 'info' as const;
  if (method === 'PUT' || method === 'PATCH') return 'warning' as const;
  if (method === 'DELETE') return 'destructive' as const;
  return 'neutral' as const;
}

function statusTone(status?: number) {
  if (!status) return 'neutral' as const;
  if (status >= 500) return 'destructive' as const;
  if (status >= 400) return 'warning' as const;
  return 'success' as const;
}

export function AdminActivityPage() {
  const [page, setPage] = useSearchState<number>('page', pageParam);
  const [hideViews, setHideViews] = useState(true);
  const [openEvent, setOpenEvent] = useState<AdminActivityEvent | null>(null);

  const query = useQuery({
    ...getDashboardActivityOptions({
      query: { pageable: { page, size: PAGE_SIZE, sort: ['createdDate,desc'] } },
    }),
    ...queueQuery,
  });

  const { events, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<AdminActivityEvent>(query.data);
    return {
      events: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  const rows = useMemo(
    () => (hideViews ? events.filter(event => event.http_method !== 'GET') : events),
    [events, hideViews]
  );

  const columns = useMemo<ColumnDef<AdminActivityEvent>[]>(
    () => [
      {
        id: 'time',
        header: 'Time',
        accessorFn: row => row.occurred_at,
        cell: ({ row }) => (
          <span className='font-mono text-xs whitespace-nowrap'>
            {formatDateTime(row.original.occurred_at) || '—'}
          </span>
        ),
      },
      {
        id: 'actor',
        header: 'Actor',
        accessorFn: row => row.actor_name ?? row.actor_email ?? '',
        cell: ({ row }) => (
          <div className='min-w-0'>
            <p className='text-foreground truncate text-sm font-medium'>
              {row.original.actor_name || 'Unknown'}
            </p>
            <p className='text-muted-foreground truncate text-xs'>{row.original.actor_email}</p>
          </div>
        ),
      },
      {
        id: 'summary',
        header: 'Activity',
        accessorFn: row => row.summary ?? '',
        cell: ({ row }) => <span className='text-sm'>{row.original.summary || '—'}</span>,
      },
      {
        id: 'method',
        header: 'Method',
        accessorFn: row => row.http_method ?? '',
        cell: ({ row }) => (
          <StatusBadge
            label={row.original.http_method || '—'}
            tone={methodTone(row.original.http_method)}
          />
        ),
      },
      {
        id: 'endpoint',
        header: 'Endpoint',
        accessorFn: row => row.endpoint ?? '',
        cell: ({ row }) => (
          <span className='text-muted-foreground block max-w-[22rem] truncate font-mono text-xs'>
            {row.original.endpoint}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: row => row.response_status ?? 0,
        cell: ({ row }) => (
          <StatusBadge
            label={String(row.original.response_status ?? '—')}
            tone={statusTone(row.original.response_status)}
          />
        ),
      },
      {
        id: 'duration',
        header: 'Took',
        accessorFn: row => toNumber(row.processing_time_ms),
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{toNumber(row.original.processing_time_ms)} ms</span>
        ),
      },
    ],
    []
  );

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Admin console'
          title='Activity log'
          description='Every admin request the platform recorded, newest first.'
          actions={
            <div className='flex items-center gap-2'>
              <Switch id='hide-views' checked={hideViews} onCheckedChange={setHideViews} />
              <Label htmlFor='hide-views' className='text-sm'>
                Hide views (GET)
              </Label>
            </div>
          }
        />

        <p className='text-muted-foreground text-xs'>
          The feed records every admin request, reads included, and the API has no filters yet — so
          this toggle hides views on the page you are looking at, not across the whole log.
        </p>

        <SectionBoundary
          label='the activity log'
          loading={query.isLoading && !query.data}
          error={query.error}
          empty={!query.isLoading && rows.length === 0}
          onRetry={query.refetch}
          emptyTitle={hideViews ? 'No changes on this page' : 'Nothing recorded yet'}
          emptyDescription={
            hideViews
              ? 'Every entry on this page is a view. Turn the toggle off to see them.'
              : 'Admin activity will appear here as decisions are taken.'
          }
        >
          <DataTable
            columns={columns}
            data={rows}
            getRowId={row => row.event_uuid ?? ''}
            searchPlaceholder='Search this page…'
            onRowClick={setOpenEvent}
            emptyTitle='Nothing on this page'
            emptyDescription='Try another page or turn off the views filter.'
            serverPagination={{
              page,
              pageCount,
              totalRows,
              onPageChange: setPage,
            }}
          />
        </SectionBoundary>
      </div>

      <Sheet open={openEvent !== null} onOpenChange={open => !open && setOpenEvent(null)}>
        <SheetContent className='w-full sm:max-w-lg'>
          <SheetHeader>
            <SheetTitle>{openEvent?.summary || 'Activity'}</SheetTitle>
            <SheetDescription>
              {openEvent?.actor_name} · {formatDateTime(openEvent?.occurred_at) || '—'}
            </SheetDescription>
          </SheetHeader>

          <div className='flex flex-col gap-4 px-4 pb-6'>
            <EventField label='Request'>
              <span className='font-mono text-xs break-all'>
                {openEvent?.http_method} {openEvent?.endpoint}
              </span>
            </EventField>
            <EventField label='Query string'>
              <span className='font-mono text-xs break-all'>
                {openEvent?.query || 'No query string'}
              </span>
            </EventField>
            <EventField label='Response'>
              <span className='font-mono text-xs'>
                {openEvent?.response_status} · {toNumber(openEvent?.processing_time_ms)} ms
              </span>
            </EventField>
            <EventField label='Actor'>
              <span className='text-xs'>
                {openEvent?.actor_email} · {openEvent?.actor_domains || 'no domains recorded'}
              </span>
            </EventField>
            <EventField label='Request id'>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-xs break-all'>{openEvent?.request_id || '—'}</span>
                {openEvent?.request_id ? (
                  <Button
                    variant='outline'
                    size='sm'
                    className='rounded-md'
                    onClick={() => {
                      void navigator.clipboard.writeText(openEvent.request_id ?? '');
                      toast.success('Request id copied');
                    }}
                  >
                    <Copy className='mr-1.5 size-3.5' />
                    Copy
                  </Button>
                ) : null}
              </div>
            </EventField>

            <p className='text-muted-foreground text-xs'>
              Reasons sent with a decision travel in the query string, so they show above until the
              backend stores them on the record.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EventField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border px-3 py-2.5'>
      <p className={surfaceTheme.sectionLabel}>{label}</p>
      <div className='text-foreground mt-1'>{children}</div>
    </div>
  );
}
