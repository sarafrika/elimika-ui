'use client';

import { useState } from 'react';
import { SectionCard, SectionCardSkeleton, StatCard, StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SaleSplitBreakdown } from '@/components/wallet/sale-split-breakdown';
import { formatDate } from '@/lib/date';
import type { Student } from '@/services/client';
import { purseLabel } from '@/src/features/wallet/purses';
import { useStudentPurchases, useWalletHistory } from '../hooks/use-person-record';
import { useAdminSaleSplit } from '../hooks/use-sale-splits';
import { SectionBoundary } from './section-boundary';

/** `purse` and `sale_split_uuid` postdate the generated WalletTransaction. */
type PurseFields = { purse?: string | null; sale_split_uuid?: string | null };

const money = (amount?: number | null, currency?: string | null) =>
  amount == null ? '—' : `${currency ?? ''} ${amount.toLocaleString()}`.trim();

export function MoneyTab({
  userUuid,
  student,
  loading,
}: {
  userUuid: string;
  student: Student | null;
  loading: boolean;
}) {
  if (loading) return <SectionCardSkeleton rows={5} />;

  return (
    <div className='flex flex-col gap-4'>
      <WalletBlock userUuid={userUuid} />
      <PurchasesBlock studentUuid={student?.uuid} />
    </div>
  );
}

/**
 * The balance is read from the newest transaction. GET /wallets/{userUuid} is never
 * called here: it creates a wallet as a side effect, and looking at a record should
 * not change it.
 */
function WalletBlock({ userUuid }: { userUuid: string }) {
  const { transactions, hasWallet, balance, currency, query } = useWalletHistory(userUuid);
  const [splitUuid, setSplitUuid] = useState<string | null>(null);

  return (
    <SectionBoundary
      label='the wallet'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      skeleton={<SectionCardSkeleton rows={4} />}
    >
      <div className='flex flex-col gap-4'>
        <div className='grid gap-4 sm:grid-cols-3'>
          <StatCard
            label='Wallet balance'
            value={hasWallet ? money(balance, currency) : 'No wallet yet'}
            hint={hasWallet ? 'From the newest transaction' : 'Nothing has moved through a wallet'}
          />
          <StatCard label='Transactions' value={transactions.length} hint='Most recent page' />
          <StatCard label='Currency' value={currency ?? '—'} />
        </div>

        <SectionCard
          title='Wallet transactions'
          description='Read-only: the console never moves money'
        >
          {transactions.length ? (
            <ul className='divide-border/60 divide-y'>
              {transactions.map(transaction => {
                const extra = transaction as PurseFields;
                return (
                <li
                  key={transaction.uuid}
                  className='flex flex-wrap items-center gap-2 py-2.5 first:pt-0'
                >
                  <span className='min-w-0 flex-1'>
                    <span className='text-foreground block text-sm font-semibold'>
                      {transaction.description ?? transaction.transaction_type ?? 'Transaction'}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {transaction.created_date ? formatDate(transaction.created_date) : '—'}
                      {transaction.reference ? (
                        <span className='font-mono'> · {transaction.reference}</span>
                      ) : null}
                    </span>
                  </span>
                  {purseLabel(extra.purse) ? <StatusBadge tone='neutral' label={purseLabel(extra.purse) ?? ''} /> : null}
                  <StatusBadge tone='neutral' label={transaction.transaction_type ?? 'entry'} />
                  <span className='font-mono text-sm'>
                    {money(transaction.amount, transaction.currency_code)}
                  </span>
                  <span className='text-muted-foreground w-28 text-right font-mono text-xs'>
                    bal {money(transaction.balance_after, transaction.currency_code)}
                  </span>
                  {extra.sale_split_uuid ? (
                    <Button variant='outline' size='sm' onClick={() => setSplitUuid(extra.sale_split_uuid ?? null)}>
                      View split
                    </Button>
                  ) : null}
                </li>
                );
              })}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>
              No wallet yet. One is created the first time money moves, so the console does not open
              one just to look.
            </p>
          )}
        </SectionCard>
      </div>
      <AdminSplitSheet splitUuid={splitUuid} onClose={() => setSplitUuid(null)} />
    </SectionBoundary>
  );
}

function AdminSplitSheet({ splitUuid, onClose }: { splitUuid: string | null; onClose: () => void }) {
  const query = useAdminSaleSplit(splitUuid);
  return (
    <Sheet open={Boolean(splitUuid)} onOpenChange={open => !open && onClose()}>
      <SheetContent className='w-full sm:max-w-[560px]'>
        <SheetHeader>
          <SheetTitle>{query.data?.title ?? 'Sale split'}</SheetTitle>
          <SheetDescription>How this line was shared out, platform fees included.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-4 pb-6'>
          <SectionBoundary
            label='the split'
            loading={query.isLoading && !query.data}
            error={query.error}
            empty={!query.isLoading && !query.data}
            onRetry={query.refetch}
            emptyTitle='No split recorded'
            emptyDescription='This transaction has no split on record.'
          >
            {query.data ? <SaleSplitBreakdown split={query.data} /> : null}
          </SectionBoundary>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PurchasesBlock({ studentUuid }: { studentUuid?: string }) {
  const { sales, query } = useStudentPurchases(studentUuid);

  if (!studentUuid) {
    return (
      <SectionCard title='Purchases'>
        <p className='text-muted-foreground text-sm'>
          Purchases are listed against a learner profile, and this person does not have one.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionBoundary
      label='the purchases'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      empty={!query.isLoading && sales.length === 0}
      skeleton={<SectionCardSkeleton rows={4} />}
      emptyTitle='No purchases'
      emptyDescription='Nothing has been bought on this account.'
    >
      <SectionCard
        title='Purchases'
        description='Asked for from 2020 onwards — the sales endpoint otherwise answers for the last 30 days only'
      >
        <ul className='divide-border/60 divide-y'>
          {sales.map(sale => (
            <li key={sale.line_item_id ?? sale.order_id} className='flex flex-wrap items-center gap-2 py-2.5 first:pt-0'>
              <span className='min-w-0 flex-1'>
                <span className='text-foreground block truncate text-sm font-semibold'>
                  {sale.title ?? 'Purchase'}
                </span>
                <span className='text-muted-foreground text-xs'>
                  <span className='font-mono'>{sale.order_number ?? sale.order_id?.slice(0, 8)}</span>
                  {sale.order_created_at ? ` · ${formatDate(sale.order_created_at)}` : ''}
                  {sale.scope ? ` · ${sale.scope}` : ''}
                </span>
              </span>
              <StatusBadge status={sale.payment_status} />
              <span className='font-mono text-sm'>
                {money(sale.order_total_amount, sale.order_currency_code)}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </SectionBoundary>
  );
}
