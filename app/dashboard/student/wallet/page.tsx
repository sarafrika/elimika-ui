'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { formatMoney } from '@/components/money/format';
import { type LedgerEntry, type OrderLike, orderEntries, statementEntries } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { MoneyPage } from '@/components/money/money-page';
import { CompletePaymentSheet, ReceiptSheet } from '@/components/money/money-sheets';
import { useUserProfile } from '@/context/profile-context';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getWalletOptions,
  listMyOrdersOptions,
  listMyOrdersQueryKey,
  listTransactions1Options,
} from '@/services/client/@tanstack/react-query.gen';

const TABS = ['payments', 'balance'] as const;
const PAGE = { pageable: { page: 0, size: 100 } };
const PAYMENT_FILTERS = [
  { id: 'all', label: 'All payments' },
  { id: 'paid', label: 'Paid' },
  { id: 'wait', label: 'Awaiting payment' },
];

export default function StudentWalletPage() {
  const user = useUserProfile();
  const userUuid = user?.uuid ?? '';
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'payments');
  const [receipt, setReceipt] = useState<OrderLike | null>(null);
  const [paying, setPaying] = useState<OrderLike | null>(null);

  const orders = useQuery({ ...listMyOrdersOptions({ query: PAGE }), staleTime: STALE_TIMES.live });
  const wallet = useQuery({ ...getWalletOptions({ path: { userUuid } }), enabled: !!userUuid });
  const statement = useQuery({
    ...listTransactions1Options({ path: { userUuid }, query: PAGE }),
    enabled: !!userUuid && tab === 'balance',
  });

  const orderList = (orders.data?.data?.content ?? []) as OrderLike[];
  const payments = useMemo(() => orderEntries(orderList), [orderList]);
  const balanceEntries = useMemo(
    () => statementEntries(statement.data?.data?.content ?? []),
    [statement.data]
  );

  const paid = orderList.filter(order => order.payment_status?.toUpperCase() === 'CAPTURED');
  const waiting = orderList.filter(order => order.payment_status?.toUpperCase() !== 'CAPTURED');
  const sum = (list: OrderLike[]) => list.reduce((total, order) => total + Number(order.total ?? 0), 0);
  const classesPaidFor = new Set(paid.flatMap(order => (order.items ?? []).map(item => item.title))).size;
  const currency = wallet.data?.data?.currency_code ?? 'KES';

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
      <MoneyPage
        eyebrow='Wallet'
        title='My payments'
        description='Every class you have paid for, or still need to pay for, newest first.'
        loadingStats={orders.isLoading}
        stats={[
          { label: 'Total paid', value: formatMoney(sum(paid)), hint: `${paid.length} ${paid.length === 1 ? 'payment' : 'payments'}` },
          { label: 'Awaiting payment', value: formatMoney(sum(waiting)), hint: waiting.length ? `${waiting.length} held for you` : 'Nothing due' },
          { label: 'Classes paid for', value: String(classesPaidFor) },
          { label: 'Wallet balance', value: formatMoney(wallet.data?.data?.balance_amount ?? 0, currency), hint: 'Refunds and credits land here' },
        ]}
        tabs={[
          { id: 'payments', label: 'Payments', count: orderList.length },
          { id: 'balance', label: 'Balance' },
        ]}
        tab={tab}
        onTabChange={setTab}
        hrefFor={hrefFor}
      >
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
        <SectionTabPanel value='balance'>
          <LedgerPanel
            title='Balance'
            description='Refunds and credits held for you.'
            entries={balanceEntries}
            loading={statement.isLoading}
            emptyTitle='No credits yet'
            emptyDescription='When a class is refunded or you are credited, it appears here.'
          />
        </SectionTabPanel>
      </MoneyPage>
      <ReceiptSheet order={receipt} onOpenChange={open => !open && setReceipt(null)} />
      <CompletePaymentSheet order={paying} onOpenChange={open => !open && setPaying(null)} onPaid={refreshOrders} />
    </>
  );
}
