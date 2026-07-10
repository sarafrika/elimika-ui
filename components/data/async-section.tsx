'use client';

import { AlertTriangle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Graceful-degradation primitive. Wrap each data-dependent region of a page in an
 * AsyncSection so it resolves its own loading / error / empty state locally — the page
 * shell and every other section keep rendering. Never gate a whole page on one query.
 *
 * Usage:
 *   <AsyncSection loading={q.isLoading && !q.data} error={q.error} empty={rows.length === 0}
 *     skeleton={<RowsSkeleton />} onRetry={q.refetch}>
 *     <Rows data={rows} />
 *   </AsyncSection>
 */
export type AsyncSectionProps = {
  /** True only while first load is in flight (pass `isLoading && !data` to keep stale data visible). */
  loading?: boolean;
  /** Any truthy value renders the error state (pass the query error). */
  error?: unknown;
  /** True when the query succeeded but there is nothing to show. */
  empty?: boolean;
  /** What to show while loading — a shape-matching skeleton, not a spinner. */
  skeleton?: ReactNode;
  /** Optional custom empty state; a sensible default is used otherwise. */
  emptyState?: ReactNode;
  /** Retry handler (e.g. query.refetch) shown on the error state. */
  onRetry?: () => void;
  errorTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  children: ReactNode;
};

export function AsyncSection({
  loading,
  error,
  empty,
  skeleton,
  emptyState,
  onRetry,
  errorTitle = 'Couldn’t load this section',
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  className,
  children,
}: AsyncSectionProps) {
  if (error) {
    return (
      <SectionError title={errorTitle} error={error} onRetry={onRetry} className={className} />
    );
  }
  if (loading) {
    return <>{skeleton ?? <SectionSkeleton className={className} />}</>;
  }
  if (empty) {
    return (
      <>{emptyState ?? <SectionEmpty title={emptyTitle} description={emptyDescription} className={className} />}</>
    );
  }
  return <>{children}</>;
}

export function SectionError({
  title = 'Couldn’t load this section',
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message =
    typeof error === 'object' && error !== null && typeof (error as { message?: string }).message === 'string'
      ? (error as { message?: string }).message
      : undefined;
  return (
    <div
      className={cn(
        'border-border/60 bg-card flex flex-col items-center justify-center gap-2 rounded-lg border p-6 text-center',
        className
      )}
      role='alert'
    >
      <AlertTriangle className='text-warning size-5' />
      <p className='text-foreground text-sm font-medium'>{title}</p>
      {message ? <p className='text-muted-foreground max-w-md text-xs'>{message}</p> : null}
      {onRetry ? (
        <Button size='sm' variant='outline' onClick={onRetry} className='mt-1'>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function SectionEmpty({
  title = 'Nothing here yet',
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border/60 bg-card flex flex-col items-center justify-center gap-2 rounded-lg border p-8 text-center',
        className
      )}
    >
      <Inbox className='text-muted-foreground size-6' />
      <p className='text-foreground text-sm font-medium'>{title}</p>
      {description ? <p className='text-muted-foreground max-w-md text-xs'>{description}</p> : null}
    </div>
  );
}

function SectionSkeleton({ className }: { className?: string }) {
  return <div className={cn('bg-muted/40 h-24 w-full animate-pulse rounded-lg', className)} />;
}
