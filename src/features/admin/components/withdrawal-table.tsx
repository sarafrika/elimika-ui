'use client';

import { Layers } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatMoney } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { REVIEW_FLAG_LABELS } from '@/components/wallet/withdrawal-api';
import { WithdrawalStatusBadge } from '@/components/wallet/withdrawals-panel';
import { formatDateTime } from '@/lib/date';
import { adminRoutes } from '../lib/admin-routes';
import { type BatchWithdrawal, walletFlagsOf } from '../lib/payout-batches';
import { WalletCell, WalletFlagChips } from './wallet-check';

interface WithdrawalTableProps {
  rows: BatchWithdrawal[];
  caption: string;
  /** Turns on the checkbox column. */
  selected?: ReadonlySet<string>;
  onToggle?: (row: BatchWithdrawal, checked: boolean) => void;
  onTogglePage?: (checked: boolean) => void;
  /** Hide the "In batch" link, e.g. on the batch's own page. */
  hideBatch?: boolean;
  /** Show the M-Pesa receipt or failure reason, for a released batch. */
  showOutcome?: boolean;
  actions?: (row: BatchWithdrawal) => ReactNode;
}

/** Withdrawals as admins read them: who, how much, where to, the wallet behind it, why it waits, and where it went. */
export function WithdrawalTable({
  rows,
  caption,
  selected,
  onToggle,
  onTogglePage,
  hideBatch,
  showOutcome,
  actions,
}: WithdrawalTableProps) {
  const selectable = Boolean(selected && onToggle);
  const pageSelected =
    selectable && rows.length > 0 && rows.every(row => selected?.has(row.uuid ?? ''));
  const someSelected = selectable && rows.some(row => selected?.has(row.uuid ?? ''));
  const headers = [
    'Earner',
    'Reference',
    'Amount',
    'Arrives',
    'To M-Pesa',
    'Requested',
    'Wallet',
    'Flags',
    'Status',
    ...(showOutcome ? ['Outcome'] : []),
    ...(hideBatch ? [] : ['Batch']),
  ];

  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[1160px] text-sm'>
        <caption className='sr-only'>{caption}</caption>
        <thead className='bg-muted/40 text-muted-foreground text-left text-xs'>
          <tr>
            {selectable ? (
              <th className='w-10 px-4 py-3'>
                <Checkbox
                  aria-label='Select every row on this page'
                  checked={pageSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={value => onTogglePage?.(value === true)}
                />
              </th>
            ) : null}
            {headers.map(h => (
              <th key={h} className='px-4 py-3 font-semibold'>
                {h}
              </th>
            ))}
            {actions ? (
              <th className='px-4 py-3'>
                <span className='sr-only'>Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map(w => {
            const uuid = w.uuid ?? '';
            const isSelected = selected?.has(uuid) ?? false;
            return (
              <tr
                key={uuid}
                className='hover:bg-muted/30 border-t'
                data-state={isSelected ? 'selected' : undefined}
              >
                {selectable ? (
                  <td className='px-4 py-3'>
                    <Checkbox
                      aria-label={`Select ${w.reference ?? 'withdrawal'}`}
                      checked={isSelected}
                      onCheckedChange={value => onToggle?.(w, value === true)}
                    />
                  </td>
                ) : null}
                <td className='px-4 py-3'>
                  <div className='flex flex-col gap-1'>
                    <span className='font-semibold'>{w.requester_name ?? 'Earner'}</span>
                    <Badge variant='outline' className='self-start text-[10px]'>
                      {w.owner_type === 'ORGANISATION' ? 'Organisation' : 'Person'}
                    </Badge>
                  </div>
                </td>
                <td className='px-4 py-3 font-mono text-xs whitespace-nowrap'>{w.reference}</td>
                <td className='px-4 py-3 font-semibold whitespace-nowrap tabular-nums'>
                  {formatMoney(w.amount, w.currency_code)}
                </td>
                <td className='px-4 py-3 whitespace-nowrap tabular-nums'>
                  {formatMoney(w.net_amount, w.currency_code)}
                </td>
                <td className='px-4 py-3 font-mono text-xs whitespace-nowrap'>{w.masked_msisdn}</td>
                <td className='px-4 py-3 text-xs whitespace-nowrap'>
                  <div>{formatDateTime(w.created_date)}</div>
                  {w.confirmed_at ? (
                    <div className='text-muted-foreground'>
                      Confirmed {formatDateTime(w.confirmed_at)}
                    </div>
                  ) : null}
                </td>
                <td className='px-4 py-3'>
                  <WalletCell row={w} />
                </td>
                <td className='px-4 py-3'>
                  <div className='flex flex-wrap gap-1'>
                    <WalletFlagChips flags={walletFlagsOf(w)} />
                    {(w.review_flags ?? []).map(flag => (
                      <Badge
                        key={flag}
                        variant='outline'
                        className='border-warning/40 bg-warning/10 text-[10px]'
                      >
                        {REVIEW_FLAG_LABELS[flag] ?? flag}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className='px-4 py-3'>
                  <WithdrawalStatusBadge status={w.status} />
                </td>
                {showOutcome ? (
                  <td className='max-w-56 px-4 py-3 text-xs'>
                    {w.mpesa_receipt ? (
                      <span className='font-mono'>{w.mpesa_receipt}</span>
                    ) : w.failure_reason || w.rejection_reason ? (
                      <span className='text-destructive'>
                        {w.failure_reason ?? w.rejection_reason}
                      </span>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </td>
                ) : null}
                {hideBatch ? null : (
                  <td className='px-4 py-3'>
                    {w.payout_batch_uuid ? (
                      <Link
                        href={adminRoutes.payoutBatch(w.payout_batch_uuid)}
                        className='text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline'
                      >
                        <Layers aria-hidden className='size-3.5' />
                        In a batch
                      </Link>
                    ) : (
                      <span className='text-muted-foreground text-xs'>—</span>
                    )}
                  </td>
                )}
                {actions ? (
                  <td className='px-4 py-3 text-right whitespace-nowrap'>{actions(w)}</td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
