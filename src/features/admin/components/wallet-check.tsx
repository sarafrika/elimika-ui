'use client';

import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { formatMoney } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  type BatchWithdrawal,
  ledgerGap,
  plural,
  toAmount,
  WALLET_FLAG_LABELS,
  type WalletFlag,
  type WalletSummary,
  walletFlagsOf,
  withdrawalPurseLabel,
} from '../lib/payout-batches';

export const LEDGER_MISMATCH_HINT =
  'The wallet’s balance and its ledger disagree — check its statement before paying.';
export const WALLET_SHORT_HINT =
  'The wallet does not hold enough to cover this payout once its other holds are counted.';

/** Red chips for a row's wallet flags, beside its review flags. */
export function WalletFlagChips({ flags, count }: { flags: WalletFlag[]; count?: number[] }) {
  return (
    <>
      {flags.map((flag, index) => (
        <Badge
          key={flag}
          variant='outline'
          className='border-destructive/40 bg-destructive/10 text-destructive text-[10px] whitespace-nowrap'
        >
          {WALLET_FLAG_LABELS[flag]}
          {count?.[index] !== undefined ? ` · ${count[index]}` : null}
        </Badge>
      ))}
    </>
  );
}

/** The queue's Wallet cell: available now, what is left after this payout, and any holds. */
export function WalletCell({ row }: { row: BatchWithdrawal }) {
  const check = row.wallet_check;
  if (!check) return <span className='text-muted-foreground text-xs'>—</span>;
  const held = toAmount(check.held_amount) ?? 0;
  const currency = row.currency_code ?? 'KES';
  const purse = withdrawalPurseLabel(row);
  return (
    <div className='text-xs whitespace-nowrap tabular-nums'>
      {purse ? <div className='text-muted-foreground'>{purse}</div> : null}
      <div className='text-sm font-semibold'>{formatMoney(check.available_balance, currency)}</div>
      <div className={cn('text-muted-foreground', check.covers === false && 'text-destructive')}>
        after {formatMoney(check.balance_after, currency)}
      </div>
      {held > 0 ? (
        <div className='text-muted-foreground'>
          {formatMoney(held, currency)} held · {check.held_count ?? 0}
        </div>
      ) : null}
    </div>
  );
}

/** The side panel's wallet check: every balance the approver should see before paying. */
export function WalletCheckBlock({ row }: { row: BatchWithdrawal }) {
  const check = row.wallet_check;
  const currency = row.currency_code ?? 'KES';
  const flags = walletFlagsOf(row);
  if (!check) {
    return (
      <section aria-label='Wallet check' className='rounded-md border p-3 text-sm'>
        <p className='font-semibold'>Wallet check</p>
        <p className='text-muted-foreground'>This wallet has not been checked.</p>
      </section>
    );
  }
  const gap = ledgerGap(check);
  const heldCount = Number(check.held_count ?? 0);
  const purse = withdrawalPurseLabel(row);
  return (
    <section aria-label='Wallet check' className='space-y-2'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm font-semibold'>
          Wallet check
          {purse ? <span className='text-muted-foreground font-normal'> · {purse}</span> : null}
        </p>
        <div className='flex flex-wrap gap-1'>
          <WalletFlagChips flags={flags} />
        </div>
      </div>
      <dl className='divide-border/60 divide-y rounded-md border text-sm'>
        {(
          [
            [purse ? `${purse} balance` : 'Account balance', formatMoney(check.account_balance, currency)],
            [
              `Held${heldCount > 0 ? ` (${plural(heldCount, 'withdrawal')})` : ''}`,
              formatMoney(check.held_amount ?? 0, currency),
            ],
            ['Available now', formatMoney(check.available_balance, currency)],
            ['Balance after this payout', formatMoney(check.balance_after, currency)],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label} className='flex justify-between gap-4 px-4 py-2.5'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd
              className={cn(
                'text-right font-semibold tabular-nums',
                label === 'Balance after this payout' &&
                  check.covers === false &&
                  'text-destructive'
              )}
            >
              {value}
            </dd>
          </div>
        ))}
        <div className='flex justify-between gap-4 px-4 py-2.5'>
          <dt className='text-muted-foreground'>Ledger balance</dt>
          <dd className='text-right tabular-nums'>
            <span className='font-semibold'>{formatMoney(check.ledger_balance, currency)}</span>
            <span
              className={cn(
                'block text-xs',
                check.ledger_matches === false ? 'text-destructive' : 'text-success'
              )}
            >
              {check.ledger_matches === false
                ? `✗ differs by ${gap === null ? 'an unknown amount' : formatMoney(gap, currency)}`
                : check.ledger_matches
                  ? '✓ matches'
                  : '—'}
            </span>
          </dd>
        </div>
      </dl>
      {flags.includes('LEDGER_MISMATCH') ? (
        <p className='border-destructive/40 bg-destructive/10 rounded-md border p-2 text-sm'>
          {LEDGER_MISMATCH_HINT}
        </p>
      ) : null}
      {flags.includes('WALLET_SHORT') ? (
        <p className='border-destructive/40 bg-destructive/10 rounded-md border p-2 text-sm'>
          {WALLET_SHORT_HINT}
        </p>
      ) : null}
      <p className='text-muted-foreground text-xs'>Checked {formatDateTime(check.checked_at)}</p>
    </section>
  );
}

/** The batch's wallets at a glance, beside the payout float. */
export function WalletsCard({ summary }: { summary: WalletSummary }) {
  return (
    <Card className='min-w-0 flex-[1_1_320px]'>
      <CardHeader>
        <CardTitle className='text-base'>Wallets</CardTitle>
        <CardDescription>Each earner’s wallet against the withdrawal it pays for.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <WalletsVerdict summary={summary} />
        {summary.kind === 'issues' ? (
          <>
            <div className='flex flex-wrap gap-1'>
              <WalletFlagChips
                flags={summary.flags.map(entry => entry.flag)}
                count={summary.flags.map(entry => entry.count)}
              />
            </div>
            <p className='text-muted-foreground'>
              The rows are marked below. The approver must confirm they checked these wallets.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function WalletsVerdict({ summary }: { summary: WalletSummary }) {
  if (summary.kind === 'issues') {
    return (
      <p className='border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border p-2 font-medium'>
        <XCircle aria-hidden className='size-4 shrink-0' />
        {summary.issues} of {plural(summary.total, 'row')} {summary.issues === 1 ? 'has' : 'have'}{' '}
        wallet issues
      </p>
    );
  }
  if (summary.kind === 'clear') {
    return (
      <p className='border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border p-2 font-medium'>
        <CheckCircle2 aria-hidden className='size-4 shrink-0' />
        {summary.checked === 1
          ? 'The wallet covers its withdrawal · ledger matches'
          : `All ${summary.checked} wallets cover their withdrawals · ledgers match`}
        {summary.unchecked > 0 ? ` · ${summary.unchecked} not checked` : ''}
      </p>
    );
  }
  return (
    <p className='border-warning/30 bg-warning/10 text-warning flex items-center gap-2 rounded-md border p-2 font-medium'>
      <HelpCircle aria-hidden className='size-4 shrink-0' />
      Wallets not checked yet
    </p>
  );
}
