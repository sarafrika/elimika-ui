'use client';

import { ArrowDownLeft, ArrowUpRight, Clock, CreditCard, RotateCcw, Wallet } from 'lucide-react';
import { type ComponentType, useId, useState } from 'react';
import { StatusBadge } from '@/components/data-display/status-badge';
import { statusToneClass, type StatusTone } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatMoney, formatSignedMoney } from './format';
import { filterEntries, type LedgerAction, type LedgerEntry, type LedgerKind } from './ledger';

const KIND: Record<LedgerKind, { icon: ComponentType<{ className?: string }>; tone: StatusTone }> = {
  in: { icon: ArrowDownLeft, tone: 'success' },
  out: { icon: ArrowUpRight, tone: 'destructive' },
  reversal: { icon: RotateCcw, tone: 'neutral' },
  payment: { icon: CreditCard, tone: 'info' },
  waiting: { icon: Clock, tone: 'warning' },
};

const STATUS_TONE: Record<string, StatusTone> = {
  Paid: 'success',
  Settled: 'success',
  'Awaiting payment': 'warning',
  Owed: 'warning',
  Reversed: 'neutral',
  Cancelled: 'neutral',
  Disputed: 'destructive',
};

const ACTION_LABEL: Record<LedgerAction, string> = {
  receipt: 'Receipt',
  pay: 'Complete payment',
  settle: 'Record payment',
};

export interface LedgerFilter {
  id: string;
  label: string;
}

interface LedgerPanelProps<T> {
  title: string;
  description: string;
  entries: LedgerEntry<T>[];
  loading?: boolean;
  filters?: LedgerFilter[];
  emptyTitle: string;
  emptyDescription: string;
  onAction?: (entry: LedgerEntry<T>) => void;
}

/** A titled list of ledger rows with an optional "Show" filter. */
export function LedgerPanel<T>({
  title,
  description,
  entries,
  loading,
  filters,
  emptyTitle,
  emptyDescription,
  onAction,
}: LedgerPanelProps<T>) {
  const [filter, setFilter] = useState('all');
  const filterId = useId();
  const visible = filterEntries(entries, filter);

  return (
    <section aria-label={title} className='border-border/70 bg-card overflow-hidden rounded-md border'>
      <div className='border-border/60 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4'>
        <div className='space-y-0.5'>
          <h2 className='text-base font-semibold'>{title}</h2>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
        {filters?.length ? (
          <div className='flex items-center gap-2'>
            <label htmlFor={filterId} className='text-muted-foreground text-sm'>
              Show
            </label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger id={filterId} className='h-9 w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filters.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      {loading ? (
        <div className='divide-border/60 divide-y'>
          {[0, 1, 2].map(i => (
            <div key={i} className='flex items-center gap-4 px-5 py-4'>
              <Skeleton className='size-11 rounded-md' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-3 w-1/3' />
              </div>
              <Skeleton className='h-5 w-24' />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState variant='plain' icon={Wallet} title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className='divide-border/60 divide-y'>
          {visible.map(entry => (
            <LedgerRow key={entry.id} entry={entry} onAction={onAction} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LedgerRow<T>({ entry, onAction }: { entry: LedgerEntry<T>; onAction?: (entry: LedgerEntry<T>) => void }) {
  const [open, setOpen] = useState(false);
  const breakdownId = useId();
  const { icon: Icon, tone } = KIND[entry.kind];
  const amount = entry.direction
    ? formatSignedMoney(entry.amount, entry.direction, entry.currency)
    : formatMoney(entry.amount, entry.currency);

  return (
    <li className='space-y-3 px-5 py-4'>
      <div className='flex flex-wrap items-center gap-4'>
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-md border', statusToneClass[tone])}>
          <Icon className='size-5' />
        </span>
        <div className='min-w-0 flex-[1_1_16rem] space-y-1'>
          <p className='text-[15px] font-semibold'>{entry.title}</p>
          <p className='text-muted-foreground text-sm'>{entry.meta}</p>
        </div>
        {entry.status ? <StatusBadge label={entry.status} tone={STATUS_TONE[entry.status] ?? 'neutral'} /> : null}
        <div className='w-40 shrink-0 text-right'>
          <p
            className={cn(
              'text-[15px] font-bold tabular-nums',
              entry.direction === 'in' && entry.kind === 'in' && 'text-success',
              entry.direction === 'out' && entry.kind === 'out' && 'text-destructive',
              entry.kind === 'reversal' && 'text-muted-foreground'
            )}
          >
            {amount}
          </p>
          {entry.balanceAfter !== undefined && entry.balanceAfter !== null ? (
            <p className='text-muted-foreground text-xs tabular-nums'>
              Balance {formatMoney(entry.balanceAfter, entry.currency)}
            </p>
          ) : null}
        </div>
        {entry.breakdown ? (
          <Button variant='outline' size='sm' aria-expanded={open} aria-controls={breakdownId} onClick={() => setOpen(v => !v)}>
            {open ? 'Hide breakdown' : 'Breakdown'}
          </Button>
        ) : null}
        {entry.action && onAction ? (
          <Button variant={entry.action === 'receipt' ? 'outline' : 'default'} size='sm' onClick={() => onAction(entry)}>
            {ACTION_LABEL[entry.action]}
          </Button>
        ) : null}
      </div>
      {entry.breakdown && open ? (
        <dl id={breakdownId} className='bg-muted/30 border-border/60 ml-[3.75rem] divide-y rounded-md border text-sm'>
          {entry.breakdown.map(line => (
            <div key={line.label} className='flex justify-between gap-3 px-3 py-2'>
              <dt className='text-muted-foreground'>{line.label}</dt>
              <dd className={cn('font-semibold tabular-nums', line.direction === 'out' && 'text-destructive')}>
                {formatSignedMoney(line.amount, line.direction, entry.currency)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}
