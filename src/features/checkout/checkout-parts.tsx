'use client';

import { Check, Clock, GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { statusToneClass } from '@/components/data-display/tone';
import { cn } from '@/lib/utils';
import { formatAmount } from './checkout-format';

export interface SummaryLine {
  id: string;
  title: string;
  detail?: string;
  total: number | string | undefined;
}

/** The order on the right of every checkout step: what is being bought, for how much, held till when. */
export function OrderSummaryCard({
  lines,
  total,
  currency,
  orderNumber,
  footer,
  className,
}: {
  lines: SummaryLine[];
  total: number | string | undefined;
  currency: string;
  orderNumber?: string | null;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <aside aria-label='Order summary' className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-4', className)}>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-base font-semibold'>Order summary</h2>
        {orderNumber ? (
          <span className='border-border/70 bg-muted/40 rounded-md border px-2 py-1 font-mono text-xs font-semibold'>
            {orderNumber}
          </span>
        ) : null}
      </div>
      <ul className='flex flex-col gap-3'>
        {lines.map(line => (
          <li key={line.id} className='flex items-center gap-3'>
            <span
              aria-hidden
              className='border-primary/30 bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md border'
            >
              <GraduationCap className='size-5' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-semibold'>{line.title}</span>
              {line.detail ? <span className='text-muted-foreground block text-xs'>{line.detail}</span> : null}
            </span>
            <span className='text-sm tabular-nums'>{formatAmount(line.total, currency)}</span>
          </li>
        ))}
      </ul>
      <div className='border-border/60 flex items-baseline justify-between border-t pt-3'>
        <span className='text-sm font-semibold'>Total</span>
        <span className='text-xl font-extrabold tabular-nums'>{formatAmount(total, currency)}</span>
      </div>
      {footer}
    </aside>
  );
}

/** A toned one-line note, e.g. how long the seat is held. */
export function ToneNote({ tone = 'warning', children }: { tone?: 'warning' | 'info' | 'success'; children: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-md border px-3 py-2.5 text-[13px]', statusToneClass[tone])}>
      <Clock aria-hidden className='size-4 shrink-0' />
      <span>{children}</span>
    </div>
  );
}

const STEPS = ['Get ready', 'Pay', 'Confirmed'] as const;

/** Pill progress across the three checkout steps; `current` is 0-based. */
export function CheckoutProgress({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol aria-label='Checkout progress' className='bg-card flex w-full gap-1 overflow-x-auto rounded-2xl border p-1.5'>
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex h-11 flex-none items-center gap-2 rounded-[10px] px-4 text-sm',
              active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground font-medium'
            )}
          >
            <span
              className={cn(
                'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold',
                done && 'bg-success text-success-foreground',
                active && 'bg-primary text-primary-foreground',
                !done && !active && 'bg-muted text-muted-foreground'
              )}
            >
              {done ? <Check aria-hidden className='size-3' /> : index + 1}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
