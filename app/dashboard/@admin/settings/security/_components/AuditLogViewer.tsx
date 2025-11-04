'use client';

import * as React from 'react';

import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import { Skeleton } from '@ui/skeleton';

import {
  AuditLogEntry,
  AuditLogFilters,
  useAdminAuditLogs,
  useAdminInvalidateAuditLogs,
} from '@/services/admin/settings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ITEM_HEIGHT = 88;
const OVERSCAN = 6;

type AuditLogViewerProps = {
  defaultFilters?: AuditLogFilters;
};

export function AuditLogViewer({ defaultFilters }: AuditLogViewerProps) {
  const [filters, setFilters] = React.useState<AuditLogFilters>(defaultFilters ?? {});
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const invalidate = useAdminInvalidateAuditLogs();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useAdminAuditLogs(filters);

  const items = React.useMemo(() => data?.pages.flatMap(page => page.items) ?? [], [data]);

  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      setScrollTop(target.scrollTop);
      if (hasNextPage && !isFetchingNextPage) {
        const threshold = target.scrollHeight - target.clientHeight * 1.5;
        if (target.scrollTop + target.clientHeight >= threshold) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const viewportHeight = containerRef.current?.clientHeight ?? 600;
  const totalHeight = items.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + viewportHeight) / ITEM_HEIGHT) + OVERSCAN
  );
  const visibleItems = items.slice(startIndex, endIndex);

  const offsetY = startIndex * ITEM_HEIGHT;

  const updateFilter = React.useCallback(<T extends keyof AuditLogFilters>(key: T, value: AuditLogFilters[T]) => {
    setFilters(previous => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(defaultFilters ?? {});
    invalidate();
  }, [defaultFilters, invalidate]);

  const exportCsv = React.useCallback(() => {
    if (!items.length) {
      toast.info('There are no log entries to export yet.');
      return;
    }

    const header = ['timestamp', 'event', 'actor', 'resource', 'status', 'ip_address'];
    const rows = items.map(item => {
      const actor = item.actor?.email ?? item.actor?.name ?? item.actor?.id ?? '—';
      const resource = item.resource?.name ?? item.resource?.id ?? item.resource?.type ?? '—';
      const timestamp = new Date(item.createdAt).toISOString();
      return [timestamp, item.event, actor, resource, item.status ?? '—', item.ipAddress ?? '—'];
    });

    const csvContent = [header, ...rows]
      .map(cells => cells.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-log-export-${Date.now()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export queued, download should start automatically.');
  }, [items]);

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='space-y-1'>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>Track every privileged action across administrator accounts.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='space-y-2'>
            <Label htmlFor='audit-search'>Search</Label>
            <Input
              id='audit-search'
              value={filters.search ?? ''}
              onChange={event => updateFilter('search', event.target.value || undefined)}
              placeholder='Search by event, actor, or resource'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='audit-event'>Event</Label>
            <Input
              id='audit-event'
              value={filters.event ?? ''}
              onChange={event => updateFilter('event', event.target.value || undefined)}
              placeholder='e.g. invitation.sent'
            />
          </div>
          <div className='space-y-2'>
            <Label>Status</Label>
            <Select
              value={filters.status ?? ''}
              onValueChange={value => updateFilter('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Any status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>Any status</SelectItem>
                <SelectItem value='SUCCESS'>Success</SelectItem>
                <SelectItem value='FAILED'>Failed</SelectItem>
                <SelectItem value='DENIED'>Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='audit-actor'>Actor</Label>
            <Input
              id='audit-actor'
              value={filters.actor ?? ''}
              onChange={event => updateFilter('actor', event.target.value || undefined)}
              placeholder='Email or UUID'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='audit-start-date'>Start date</Label>
            <Input
              id='audit-start-date'
              type='date'
              value={
                filters.startDate
                  ? new Date(filters.startDate).toISOString().slice(0, 10)
                  : ''
              }
              onChange={event => updateFilter('startDate', event.target.value || undefined)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='audit-end-date'>End date</Label>
            <Input
              id='audit-end-date'
              type='date'
              value={filters.endDate ? new Date(filters.endDate).toISOString().slice(0, 10) : ''}
              onChange={event => updateFilter('endDate', event.target.value || undefined)}
            />
          </div>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Button variant='outline' onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button variant='outline' onClick={resetFilters}>
            Reset filters
          </Button>
          <Button variant='secondary' onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
        <div>
          <div className='flex items-center justify-between border-b border-border pb-3 text-xs uppercase tracking-wide text-muted-foreground'>
            <span className='w-[180px]'>Event</span>
            <span className='w-[200px]'>Actor</span>
            <span className='w-[200px]'>Resource</span>
            <span className='w-[140px] text-center'>Status</span>
            <span className='flex-1 text-right'>Timestamp</span>
          </div>
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className='relative mt-2 h-[520px] overflow-y-auto rounded-md border border-border/70 bg-card'
          >
            {isLoading ? (
              <div className='space-y-3 p-4'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className='h-20 w-full rounded-md' />
                ))}
              </div>
            ) : (
              <div style={{ height: totalHeight }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  {visibleItems.map((item, index) => (
                    <AuditLogRow key={`${item.id}-${index}`} entry={item} />
                  ))}
                </div>
              </div>
            )}
            {hasNextPage ? (
              <div className='sticky bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-card via-card/80 to-transparent py-3'>
                <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} size='sm'>
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex justify-between border-t border-border bg-muted/40 px-6 py-4 text-xs text-muted-foreground'>
        <span>{items.length} events loaded</span>
        <span>Streaming newest events automatically when refreshed.</span>
      </CardFooter>
    </Card>
  );
}

type AuditLogRowProps = {
  entry: AuditLogEntry;
};

function AuditLogRow({ entry }: AuditLogRowProps) {
  const actor = entry.actor?.email ?? entry.actor?.name ?? entry.actor?.id ?? '—';
  const resource = entry.resource?.name ?? entry.resource?.id ?? entry.resource?.type ?? '—';
  const timestamp = new Date(entry.createdAt).toLocaleString();

  return (
    <div
      className={cn(
        'grid grid-cols-[180px_200px_200px_140px_1fr] items-center gap-4 border-b border-border/70 px-4 py-4 text-sm last:border-none',
        entry.status === 'FAILED' && 'bg-destructive/10 text-destructive-foreground',
        entry.status === 'DENIED' && 'bg-yellow-100/40 dark:bg-yellow-500/10'
      )}
    >
      <div className='font-semibold text-foreground'>{entry.event}</div>
      <div className='truncate text-muted-foreground'>{actor}</div>
      <div className='truncate text-muted-foreground'>{resource}</div>
      <div className='text-center text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        {entry.status ?? '—'}
      </div>
      <div className='text-right text-xs text-muted-foreground'>{timestamp}</div>
    </div>
  );
}
