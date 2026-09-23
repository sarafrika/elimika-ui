'use client';

import type { RevenueAmountDto } from '@/services/client';
import { cn } from '@/lib/utils';

/** One amount, formatted in its own currency. */
export function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount === undefined || amount === null) return '—';
  return `${currency ?? ''} ${Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`.trim();
}

/**
 * Every revenue figure arrives as one amount per currency. They are never added up:
 * a shilling and a dollar do not make two of anything, so each gets its own line.
 */
export function MoneyList({
  amounts,
  className,
  emptyLabel = '—',
}: {
  amounts?: RevenueAmountDto[] | null;
  className?: string;
  emptyLabel?: string;
}) {
  const entries = (amounts ?? []).filter(entry => entry.amount !== undefined);

  if (entries.length === 0) {
    return <span className={cn('text-muted-foreground font-mono text-sm', className)}>{emptyLabel}</span>;
  }

  return (
    <span className={cn('flex flex-col gap-0.5', className)}>
      {entries.map(entry => (
        <span key={entry.currency_code ?? 'unknown'} className='font-mono text-sm tabular-nums'>
          {formatMoney(entry.amount, entry.currency_code)}
        </span>
      ))}
    </span>
  );
}
