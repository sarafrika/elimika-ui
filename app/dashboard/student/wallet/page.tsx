'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  CalendarCheck,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  ShieldCheck,
  Undo2,
  Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { StatCard } from '@/components/data-display/stat-tile';
import { formatMoney } from '@/components/money/format';
import { type LedgerEntry, type OrderLike, orderEntries } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { CompletePaymentSheet, ReceiptSheet } from '@/components/money/money-sheets';
import {
  AccountCards,
  AuditPanel,
  RecentTransactions,
  RefundsPanel,
  StatementsPanel,
  TransactionsPanel,
} from '@/components/wallet/wallet-panels';
import { useWalletFigures, type WalletScope } from '@/components/wallet/wallet-scope';
import { WalletShell } from '@/components/wallet/wallet-shell';
import { useUserProfile } from '@/context/profile-context';
import { STALE_TIMES } from '@/lib/query-client';
import { listMyOrdersOptions, listMyOrdersQueryKey } from '@/services/client/@tanstack/react-query.gen';

const TABS = ['dashboard', 'accounts', 'payments', 'transactions', 'refunds', 'statements', 'audit'] as const;
const PAGE = { pageable: { page: 0, size: 100 } };
const PAYMENT_FILTERS = [
  { id: 'all', label: 'All payments' },
  { id: 'paid', label: 'Paid' },
  { id: 'wait', label: 'Awaiting payment' },
];
const STUDENT_TYPES = ['DEPOSIT', 'TRANSFER_IN', 'TRANSFER_OUT'];

/** A learner's class payments and the refunds and credits their wallet holds. */
export default function StudentWalletPage() {
  const user = useUserProfile();
  const userUuid = user?.uuid ?? '';
  const scope: WalletScope = { kind: 'user', userUuid };
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'dashboard');
  const [receipt, setReceipt] = useState<OrderLike | null>(null);
  const [paying, setPaying] = useState<OrderLike | null>(null);
  const { figures, isLoading } = useWalletFigures(scope);
  const currency = figures?.currency ?? 'KES';

  const orders = useQuery({ ...listMyOrdersOptions({ query: PAGE }), staleTime: STALE_TIMES.live });
  const orderList = (orders.data?.data?.content ?? []) as OrderLike[];
  const payments = useMemo(() => orderEntries(orderList), [orderList]);
  const waitingEntries = payments.filter(entry => entry.action === 'pay');

  const paid = orderList.filter(order => order.payment_status?.toUpperCase() === 'CAPTURED');
  const waiting = orderList.filter(order => order.payment_status?.toUpperCase() !== 'CAPTURED');
  const sum = (list: OrderLike[]) => list.reduce((total, order) => total + Number(order.total ?? 0), 0);
  const classesPaidFor = new Set(paid.flatMap(order => (order.items ?? []).map(item => item.title))).size;

  const onAction = (entry: LedgerEntry) => {
    const order = entry.source as OrderLike;
    if (entry.action === 'receipt') setReceipt(order);
    if (entry.action === 'pay') setPaying(order);
  };

  const refreshOrders = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: listMyOrdersQueryKey({ query: PAGE }) });
  }, [queryClient]);

  return (
    <>
      <WalletShell
        scope={scope}
        title='Student Wallet'
        description='Class payments, refunds and credits, and every movement of your wallet.'
        tabs={[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'accounts', label: 'Accounts', icon: Landmark },
          { id: 'payments', label: 'Payments', icon: CreditCard, count: waiting.length || null },
          { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
          { id: 'refunds', label: 'Refunds', icon: Undo2 },
          { id: 'statements', label: 'Statements', icon: FileText },
          { id: 'audit', label: 'Audit', icon: ShieldCheck },
        ]}
        tab={tab}
        onTabChange={setTab}
        hrefFor={hrefFor}
      >
        <SectionTabPanel value='dashboard' className='space-y-5'>
          <section aria-label='Summary' className={surfaceTheme.statGrid}>
            <StatCard
              label='Total paid'
              value={formatMoney(sum(paid))}
              hint={`${paid.length} ${paid.length === 1 ? 'payment' : 'payments'}`}
              icon={CreditCard}
              tone='success'
            />
            <StatCard
              label='Awaiting payment'
              value={formatMoney(sum(waiting))}
              hint={waiting.length ? `${waiting.length} held for you` : 'Nothing due'}
              icon={CalendarCheck}
              tone='warning'
            />
            <StatCard label='Classes paid for' value={String(classesPaidFor)} icon={LayoutDashboard} />
            <StatCard
              label='Wallet balance'
              value={formatMoney(figures?.balance ?? 0, currency)}
              hint='Refunds and credits land here'
              icon={Wallet}
            />
          </section>
          <div className='grid gap-4 lg:grid-cols-2'>
            <RecentTransactions scope={scope} active={tab === 'dashboard'} onViewAll={() => setTab('transactions')} />
            <LedgerPanel
              title='Upcoming payments'
              description='Seats held for you until you pay.'
              entries={waitingEntries}
              loading={orders.isLoading}
              emptyTitle='No upcoming payments'
              emptyDescription='Any class you still need to pay for appears here.'
              onAction={onAction}
            />
          </div>
        </SectionTabPanel>
        <SectionTabPanel value='accounts'>
          <AccountCards
            loading={isLoading}
            cards={[
              {
                label: 'Personal wallet',
                value: formatMoney(figures?.balance ?? 0, currency),
                hint: 'Refunds and credits · usable for any Elimika payment',
                tone: 'success',
              },
            ]}
          />
        </SectionTabPanel>
        <SectionTabPanel value='payments'>
          <LedgerPanel
            title='Payments'
            description='Your orders, paid and waiting.'
            entries={payments}
            loading={orders.isLoading}
            filters={PAYMENT_FILTERS}
            emptyTitle='No payments yet'
            emptyDescription='Classes you pay for appear here with their receipts.'
            onAction={onAction}
          />
        </SectionTabPanel>
        <SectionTabPanel value='transactions'>
          <TransactionsPanel scope={scope} active={tab === 'transactions'} filterTypes={STUDENT_TYPES} />
        </SectionTabPanel>
        <SectionTabPanel value='refunds'>
          <RefundsPanel
            scope={scope}
            active={tab === 'refunds'}
            types={['DEPOSIT', 'TRANSFER_IN']}
            description='Money returned or credited to your wallet.'
            emptyDescription='When a class is refunded or you are credited, it appears here.'
          />
        </SectionTabPanel>
        <SectionTabPanel value='statements'>
          <StatementsPanel scope={scope} active={tab === 'statements'} />
        </SectionTabPanel>
        <SectionTabPanel value='audit'>
          <AuditPanel scope={scope} active={tab === 'audit'} selfUuid={userUuid} />
        </SectionTabPanel>
      </WalletShell>
      <ReceiptSheet order={receipt} onOpenChange={open => !open && setReceipt(null)} />
      <CompletePaymentSheet order={paying} onOpenChange={open => !open && setPaying(null)} onPaid={refreshOrders} />
    </>
  );
}
