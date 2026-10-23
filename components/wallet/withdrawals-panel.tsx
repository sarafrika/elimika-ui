'use client';

import { ArrowUpRight, Check, Circle, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatMoney, formatMoneyDate } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Withdrawal } from '@/services/client/types.gen';
import type { WalletScope } from './wallet-scope';
import {
  REVIEW_FLAG_LABELS,
  usePayoutRules,
  useWithdrawals,
  WITHDRAWAL_STATUS,
  withdrawalActions,
} from './withdrawal-api';

const FILTERS: { id: string; label: string; statuses?: string[] }[] = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Waiting', statuses: ['AWAITING_SECOND_APPROVAL', 'NEEDS_REVIEW'] },
  { id: 'flight', label: 'In progress', statuses: ['SENDING', 'PROCESSING'] },
  { id: 'paid', label: 'Paid', statuses: ['PAID'] },
  { id: 'returned', label: 'Returned', statuses: ['FAILED', 'REJECTED'] },
];

const TONE: Record<string, string> = {
  success: 'border-success/40 bg-success/10 text-success',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive',
  warning: 'border-warning/40 bg-warning/10',
  info: 'border-primary/30 bg-primary/10 text-primary',
  muted: '',
};

export function WithdrawalStatusBadge({ status }: { status?: string }) {
  const meta = WITHDRAWAL_STATUS[status ?? ''] ?? { label: status ?? '', tone: 'muted' as const };
  return (
    <Badge variant='outline' className={cn('text-[11px] uppercase', TONE[meta.tone])}>
      {meta.label}
    </Badge>
  );
}

/** Each step a withdrawal went through, as the earner reads it. */
function timeline(w: Withdrawal) {
  const s = w.status ?? '';
  const returned = s === 'FAILED' || s === 'REJECTED';
  return [
    { label: 'Requested', sub: formatMoneyDate(w.created_date), state: 'done' },
    {
      label: 'Confirmed by SMS code',
      sub: w.confirmed_at ? `${formatMoneyDate(w.confirmed_at)} · held from the balance` : 'Waiting for the code',
      state: w.confirmed_at ? 'done' : s === 'AWAITING_CONFIRMATION' ? 'current' : 'todo',
    },
    ...(w.review_flags?.length || s === 'NEEDS_REVIEW' || s === 'AWAITING_SECOND_APPROVAL'
      ? [
          {
            label: s === 'AWAITING_SECOND_APPROVAL' ? 'Second approver' : 'Approval by Elimika',
            sub: (w.review_flags ?? []).map(f => REVIEW_FLAG_LABELS[f] ?? f).join(', ') || 'Large organisation withdrawal',
            state: s === 'NEEDS_REVIEW' || s === 'AWAITING_SECOND_APPROVAL' ? 'current' : s === 'REJECTED' ? 'fail' : 'done',
          },
        ]
      : []),
    {
      label: 'Sent to M-Pesa',
      sub: w.sent_at ? formatMoneyDate(w.sent_at) : '',
      state: w.sent_at ? 'done' : s === 'SENDING' ? 'current' : 'todo',
    },
    returned
      ? {
          label: s === 'REJECTED' ? 'Not approved · money returned' : 'Failed · money returned',
          sub: w.rejection_reason ?? w.failure_reason ?? '',
          state: 'fail',
        }
      : {
          label: 'Paid to M-Pesa',
          sub: s === 'PAID' ? `${formatMoneyDate(w.completed_at)} · receipt ${w.mpesa_receipt ?? ''}` : '',
          state: s === 'PAID' ? 'done' : s === 'PROCESSING' ? 'current' : 'todo',
        },
  ];
}

/** The Withdrawals tab: every withdrawal newest first, and its detail in a drawer. */
export function WithdrawalsPanel({
  scope,
  active,
  selfUuid,
  canApprove,
  onWithdraw,
  onChanged,
}: {
  scope: WalletScope;
  active: boolean;
  selfUuid?: string;
  /** Organisation approvers: may give the second approval on someone else's withdrawal. */
  canApprove?: boolean;
  onWithdraw?: () => void;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState('all');
  const statuses = FILTERS.find(f => f.id === filter)?.statuses;
  const query = useWithdrawals(scope, statuses, active);
  const actions = withdrawalActions(scope);
  const [open, setOpen] = useState<Withdrawal | null>(null);
  const [busy, setBusy] = useState(false);
  const { rules } = usePayoutRules(active);
  // Say why there is no Withdraw button instead of leaving it out silently.
  const blocked = onWithdraw
    ? null
    : rules?.withdrawals_enabled === false
      ? 'Withdrawals to M-Pesa are not open yet. Your balance stays safely in the wallet until they are.'
      : rules && scope.kind === 'organisation' && !canApprove
        ? 'Only payout approvers can withdraw from the organisation wallet. Any admin can name approvers under Payout details.'
        : null;

  const act = async (call: () => Promise<{ error?: string; data?: Withdrawal }>, success: string) => {
    setBusy(true);
    const result = await call();
    setBusy(false);
    if (result.error) return toast.error(result.error);
    toast.success(success);
    if (result.data) setOpen(result.data);
    query.refetch();
    onChanged();
  };

  return (
    <Card>
      <CardHeader className='gap-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='space-y-1'>
            <CardTitle className='text-base'>Withdrawals</CardTitle>
            <CardDescription>
              Money sent from the wallet to M-Pesa. A failed or rejected withdrawal comes back to the wallet.
            </CardDescription>
          </div>
          {onWithdraw ? (
            <Button size='sm' onClick={onWithdraw}>
              <ArrowUpRight aria-hidden className='size-4' />
              Withdraw
            </Button>
          ) : null}
        </div>
        {blocked ? <p className='bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm'>{blocked}</p> : null}
        <div className='flex flex-wrap gap-2'>
          {FILTERS.map(f => (
            <Button
              key={f.id}
              size='sm'
              variant={filter === f.id ? 'default' : 'outline'}
              className='rounded-full'
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <Skeleton className='h-24 w-full' />
        ) : query.rows.length === 0 ? (
          <EmptyState
            variant='compact'
            icon={ArrowUpRight}
            title='No withdrawals here yet'
            description='Withdrawals you make to M-Pesa appear here with their receipts.'
          />
        ) : (
          <ul className='divide-y'>
            {query.rows.map(w => (
              <li key={w.uuid} className='flex items-center justify-between gap-3 py-3'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span aria-hidden className='bg-warning/10 text-warning grid size-8 shrink-0 place-items-center rounded-full'>
                    <ArrowUpRight className='size-4' />
                  </span>
                  <div className='flex min-w-0 flex-col gap-1'>
                    <p className='truncate text-sm font-medium'>Withdrawal to M-Pesa {w.masked_msisdn}</p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {formatMoneyDate(w.created_date)} · {w.reference}
                      {w.mpesa_receipt ? ` · receipt ${w.mpesa_receipt}` : ''}
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <div className='flex flex-col items-end gap-1.5'>
                    <p className='text-sm font-semibold tabular-nums'>− {formatMoney(w.amount, w.currency_code)}</p>
                    <WithdrawalStatusBadge status={w.status} />
                  </div>
                  <Button size='sm' variant='ghost' onClick={() => setOpen(w)}>
                    View
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {query.hasNextPage ? (
          <div className='flex justify-center pt-3'>
            <Button variant='outline' size='sm' disabled={query.isFetchingNextPage} onClick={query.fetchNextPage}>
              {query.isFetchingNextPage && <Spinner />}Load more
            </Button>
          </div>
        ) : null}
      </CardContent>

      <Sheet open={!!open} onOpenChange={next => !next && setOpen(null)}>
        <SheetContent side='right' className='w-full gap-0 sm:max-w-md'>
          {open ? (
            <>
              <SheetHeader>
                <p className='text-muted-foreground font-mono text-xs'>{open.reference}</p>
                <SheetTitle>{formatMoney(open.amount, open.currency_code)} to M-Pesa</SheetTitle>
                <SheetDescription asChild>
                  <div>
                    <WithdrawalStatusBadge status={open.status} />
                  </div>
                </SheetDescription>
              </SheetHeader>
              <div className='flex-1 space-y-5 overflow-y-auto px-4'>
                <ol className='space-y-3'>
                  {timeline(open).map(step => (
                    <li key={step.label} className='flex items-start gap-3'>
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2',
                          step.state === 'done' && 'border-primary bg-primary text-primary-foreground',
                          step.state === 'current' && 'border-primary text-primary',
                          step.state === 'fail' && 'border-destructive bg-destructive text-white'
                        )}
                      >
                        {step.state === 'done' ? (
                          <Check className='size-3.5' />
                        ) : step.state === 'fail' ? (
                          <X className='size-3.5' />
                        ) : step.state === 'current' ? (
                          <Circle className='size-2 fill-current' />
                        ) : null}
                      </span>
                      <div>
                        <p className='text-sm font-semibold'>{step.label}</p>
                        {step.sub ? <p className='text-muted-foreground text-xs'>{step.sub}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
                <dl className='divide-border/60 divide-y rounded-md border text-sm'>
                  {(
                    [
                      ['Amount', formatMoney(open.amount, open.currency_code)],
                      ['M-Pesa charge', Number(open.fee_amount) > 0 ? formatMoney(open.fee_amount, open.currency_code) : 'Free'],
                      ['Arrives on M-Pesa', formatMoney(open.net_amount, open.currency_code)],
                      ['Sent to', open.masked_msisdn ?? ''],
                      ['Name on M-Pesa', open.mpesa_recipient_name ?? '—'],
                      ['M-Pesa receipt', open.mpesa_receipt ?? '—'],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label} className='flex justify-between gap-4 px-4 py-2.5'>
                      <dt className='text-muted-foreground'>{label}</dt>
                      <dd className='text-right font-semibold tabular-nums'>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <SheetFooter className='flex-row justify-end gap-2 border-t'>
                {open.status === 'AWAITING_SECOND_APPROVAL' && canApprove && open.requested_by_user_uuid !== selfUuid ? (
                  <Button disabled={busy} onClick={() => void act(() => actions.approve(open.uuid ?? ''), 'Withdrawal approved')}>
                    Approve as second approver
                  </Button>
                ) : null}
                {open.status === 'AWAITING_SECOND_APPROVAL' && open.requested_by_user_uuid === selfUuid ? (
                  <Button
                    variant='outline'
                    disabled={busy}
                    onClick={() => void act(() => actions.cancel(open.uuid ?? ''), 'Withdrawal cancelled')}
                  >
                    Cancel withdrawal
                  </Button>
                ) : null}
                <Button variant='outline' onClick={() => setOpen(null)}>
                  Close
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
