'use client';

import { formatMoney, formatMoneyDate, formatSignedMoney } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WalletTransaction } from '@/services/client/types.gen';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { transactionTypeLabel } from './wallet-labels';
import { WalletTransactionDetails } from './wallet-transaction-details';

/** One ledger row as the wallet has always shown it: direction, what, when, balance before and after. */
export function WalletTxnRow({ txn, action }: { txn: WalletTransaction; action?: ReactNode }) {
  const before = Number(txn.balance_before ?? 0);
  const after = Number(txn.balance_after ?? 0);
  const credit = after >= before;
  const currency = txn.currency_code ?? 'KES';
  const type = txn.transaction_type ?? '';

  return (
    <li className='flex items-center gap-2'>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            className='hover:text-foreground h-auto min-w-0 flex-1 justify-between gap-3 px-0 py-3 text-left whitespace-normal hover:bg-transparent'
            aria-label={`View transaction details: ${txn.description || transactionTypeLabel(type)}`}
          >
            <span className='flex min-w-0 items-center gap-3'>
              <span
                aria-hidden
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full',
                  credit ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                )}
              >
                {credit ? (
                  <ArrowDownLeft className='size-4' />
                ) : (
                  <ArrowUpRight className='size-4' />
                )}
              </span>
              <span className='flex min-w-0 flex-col gap-1'>
                <span className='truncate text-sm font-medium'>
                  {txn.description || transactionTypeLabel(type)}
                </span>
                <span className='text-muted-foreground text-xs font-normal tabular-nums'>
                  {formatMoney(before, currency)} → {formatMoney(after, currency)}
                </span>
                <span className='text-muted-foreground truncate text-xs font-normal'>
                  {formatMoneyDate(txn.created_date)} · {transactionTypeLabel(type).toLowerCase()}
                  {/* {txn.reference ? ` · ${txn.reference}` : ''} */}
                </span>
              </span>
            </span>
            <span className='flex shrink-0 flex-col items-end gap-1.5'>
              <span className={cn('text-sm font-semibold tabular-nums', credit && 'text-success')}>
                {formatSignedMoney(txn.amount ?? 0, credit ? 'in' : 'out', currency)}
              </span>
              <Badge variant='outline' className='text-[11px] uppercase'>
                {type.replace(/_/g, ' ') || 'Other'}
              </Badge>
            </span>
          </Button>
        </DialogTrigger>
        <WalletTransactionDetails txn={txn} />
      </Dialog>
      {action}
    </li>
  );
}
