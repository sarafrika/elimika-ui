import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatMoney, formatMoneyDate, formatSignedMoney } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WalletTransaction } from '@/services/client/types.gen';
import { transactionTypeLabel } from './wallet-labels';

/** One ledger row as the wallet has always shown it: direction, what, when, balance before and after. */
export function WalletTxnRow({ txn, action }: { txn: WalletTransaction; action?: ReactNode }) {
  const before = Number(txn.balance_before ?? 0);
  const after = Number(txn.balance_after ?? 0);
  const credit = after >= before;
  const currency = txn.currency_code ?? 'KES';
  const type = txn.transaction_type ?? '';

  return (
    <li className='flex items-center justify-between gap-3 py-3'>
      <div className='flex min-w-0 items-center gap-3'>
        <span
          aria-hidden
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full',
            credit ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
          )}
        >
          {credit ? <ArrowDownLeft className='size-4' /> : <ArrowUpRight className='size-4' />}
        </span>
        <div className='flex min-w-0 flex-col gap-1'>
          <p className='truncate text-sm font-medium'>{txn.description || transactionTypeLabel(type)}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {formatMoneyDate(txn.created_date)} · {transactionTypeLabel(type).toLowerCase()}
            {txn.reference ? ` · ${txn.reference}` : ''}
          </p>
          <p className='text-muted-foreground text-xs tabular-nums'>
            {formatMoney(before, currency)} → {formatMoney(after, currency)}
          </p>
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <div className='flex flex-col items-end gap-1.5'>
          <p className={cn('text-sm font-semibold tabular-nums', credit && 'text-success')}>
            {formatSignedMoney(txn.amount ?? 0, credit ? 'in' : 'out', currency)}
          </p>
          <Badge variant='outline' className='text-[11px] uppercase'>
            {type.replace(/_/g, ' ') || 'Other'}
          </Badge>
        </div>
        {action}
      </div>
    </li>
  );
}
