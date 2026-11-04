'use client';

import { AlertTriangle, History, Info } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { useTimeZone } from '@/context/timezone-context';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { purseLabel } from '@/src/features/wallet/purses';
import {
  formatPercent,
  type LegView,
  retainedReasons,
  type SaleSplit,
  splitLegs,
  splitNotes,
  toNumber,
} from '@/src/features/wallet/sale-splits';
import { transactionTypeLabel } from './wallet-labels';

const LEG_STATUS_LABELS: Record<string, string> = {
  PAID: 'Paid',
  NO_EARNER: 'No earner',
  NO_SHARE: 'No share',
  NOT_SPLIT: 'Not split',
};

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'muted' | 'success' }) {
  return (
    <div className='flex justify-between gap-4 py-1.5'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd
        className={cn(
          'text-right tabular-nums',
          strong && 'font-semibold',
          tone === 'success' && 'text-success',
          tone === 'muted' && 'text-muted-foreground'
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function LegBlock({ leg, currency }: { leg: LegView; currency: string }) {
  const pct = formatPercent(leg.percentage);
  return (
    <section
      aria-label={leg.heading}
      className={cn('rounded-md border p-3', leg.mine && 'border-primary/40 bg-primary/5')}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm font-semibold'>
          {leg.heading}
          {pct ? <span className='text-muted-foreground font-normal'> · {pct}</span> : null}
        </p>
        <div className='flex gap-1'>
          {leg.mine ? (
            <Badge variant='outline' className='text-[10px]'>
              You
            </Badge>
          ) : null}
          <Badge
            variant='outline'
            className={cn('text-[10px]', leg.status === 'PAID' ? 'text-success' : 'text-warning')}
          >
            {LEG_STATUS_LABELS[leg.status] ?? leg.status}
          </Badge>
        </div>
      </div>
      {leg.name ? <p className='text-muted-foreground text-xs'>{leg.name}</p> : null}
      <dl className='mt-2 text-sm'>
        <Row label='Share' value={formatMoney(leg.gross ?? 0, currency)} />
        <Row label='Platform fee' value={`− ${formatMoney(leg.fee ?? 0, currency)}`} tone='muted' />
        <Row label='Paid out' value={formatMoney(leg.net ?? 0, currency)} strong />
      </dl>
      {leg.reason ? <p className='text-muted-foreground mt-1 text-xs'>Not paid: {leg.reason}.</p> : null}
    </section>
  );
}

/**
 * One sold line from its total to every share: creator and delivery shares with their
 * platform fees, what Elimika kept and why, the fee rule, and your ledger rows for it.
 */
export function SaleSplitBreakdown({ split, transactionsHref }: { split: SaleSplit; transactionsHref?: string }) {
  const { zone } = useTimeZone();
  const currency = split.currency_code ?? 'KES';
  const legs = splitLegs(split);
  const notes = splitNotes(split);
  const reasons = retainedReasons(split);
  const retained = toNumber(split.retained) ?? 0;
  const yours = purseLabel(split.your_purse);
  const transactions = split.transactions ?? [];

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <p className='text-muted-foreground text-xs'>
          {split.order_number ? `Order ${split.order_number} · ` : ''}
          {formatDateTime(split.captured_at, { zone })}
        </p>
        <dl className='text-sm'>
          <Row label='Line total' value={formatMoney(split.line_gross ?? 0, currency)} strong />
        </dl>
      </div>

      {notes.mismatch ? (
        <p
          role='alert'
          className='border-destructive/40 bg-destructive/10 flex items-start gap-2 rounded-md border p-2 text-sm'
        >
          <AlertTriangle aria-hidden className='text-destructive mt-0.5 size-4 shrink-0' />
          These shares, fees and the amount kept do not add up to the line total.
        </p>
      ) : null}
      {notes.backfilled ? (
        <p className='bg-muted text-muted-foreground flex items-start gap-2 rounded-md p-2 text-sm'>
          <History aria-hidden className='mt-0.5 size-4 shrink-0' />
          Recorded before splits were kept: these figures were rebuilt from the ledger.
        </p>
      ) : null}

      <div className='grid gap-3'>
        {legs.map(leg => (
          <LegBlock key={leg.key} leg={leg} currency={currency} />
        ))}
      </div>

      <dl className='divide-border/60 divide-y rounded-md border px-3 text-sm'>
        <Row label='Platform fee total' value={formatMoney(split.platform_fee_total ?? 0, currency)} />
        <Row label='Kept by Elimika' value={formatMoney(retained, currency)} />
        {split.your_role ? (
          <Row label={`You receive${yours ? ` (${yours})` : ''}`} value={formatMoney(split.your_net ?? 0, currency)} strong tone='success' />
        ) : null}
      </dl>
      {retained > 0 && reasons.length ? (
        <ul aria-label='Why Elimika kept part of this line' className='text-muted-foreground space-y-1 text-xs'>
          {reasons.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <section aria-label='Fee rule' className='space-y-1 text-sm'>
        <p className='font-semibold'>Fee rule</p>
        <p className={cn(!notes.feeRuleRecorded && 'text-muted-foreground')}>
          <Info aria-hidden className='mr-1 inline size-3.5 align-[-2px]' />
          {split.fee_rule?.description || 'No fee rule was recorded for this line.'}
        </p>
      </section>

      {transactions.length ? (
        <section aria-label='Your transactions for this sale' className='space-y-2'>
          <p className='text-sm font-semibold'>Your transactions</p>
          <ul className='divide-border/60 divide-y rounded-md border text-sm'>
            {transactions.map(txn => {
              const label = transactionTypeLabel(txn.transaction_type);
              const out = txn.transaction_type === 'PLATFORM_FEE';
              return (
                <li key={txn.uuid ?? txn.reference} className='flex items-center justify-between gap-3 px-3 py-2'>
                  <span className='min-w-0'>
                    <span className='block font-medium'>{label}</span>
                    <span className='text-muted-foreground block truncate font-mono text-xs'>{txn.reference}</span>
                  </span>
                  <span className='flex shrink-0 items-center gap-3'>
                    <span className={cn('font-semibold tabular-nums', !out && 'text-success')}>
                      {out ? '− ' : '+ '}
                      {formatMoney(Math.abs(toNumber(txn.amount) ?? 0), currency)}
                    </span>
                    {transactionsHref ? (
                      <Link href={transactionsHref} className='text-primary text-xs underline-offset-2 hover:underline'>
                        Open
                      </Link>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
