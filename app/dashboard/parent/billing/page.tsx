'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { formatMoney } from '@/components/money/format';
import { type LedgerEntry, type OrderLike, orderEntries } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { MoneyPage } from '@/components/money/money-page';
import { CompletePaymentSheet, ReceiptSheet } from '@/components/money/money-sheets';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { listMyOrdersOptions, listMyOrdersQueryKey } from '@/services/client/@tanstack/react-query.gen';

const TABS = ['payments', 'children'] as const;
const PAGE = { pageable: { page: 0, size: 100 } };

const childOf = (order: OrderLike) =>
  (order.items ?? []).map(item => item.metadata?.student_uuid).find(v => typeof v === 'string') as string | undefined;

/** What a parent paid, child by child. Orders the parent placed are theirs; each line names its learner. */
export default function ParentBillingPage() {
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'payments');
  const [receipt, setReceipt] = useState<OrderLike | null>(null);
  const [paying, setPaying] = useState<OrderLike | null>(null);

  const orders = useQuery({ ...listMyOrdersOptions({ query: PAGE }), staleTime: STALE_TIMES.live });
  const orderList = (orders.data?.data?.content ?? []) as OrderLike[];
  const childUuids = useMemo(() => [...new Set(orderList.map(childOf).filter(Boolean) as string[])], [orderList]);
  const { studentMap } = useStudentsByIds(childUuids);
  const childName = useCallback(
    (uuid: string) => (studentMap[uuid] as { full_name?: string } | undefined)?.full_name,
    [studentMap]
  );

  const payments = useMemo(() => orderEntries(orderList, { childName }), [orderList, childName]);
  const paid = orderList.filter(order => order.payment_status?.toUpperCase() === 'CAPTURED');
  const waiting = orderList.filter(order => order.payment_status?.toUpperCase() !== 'CAPTURED');
  const sum = (list: OrderLike[]) => list.reduce((total, order) => total + Number(order.total ?? 0), 0);

  const byChild: LedgerEntry<OrderLike[]>[] = childUuids.map(uuid => {
    const theirs = paid.filter(order => childOf(order) === uuid);
    return {
      id: uuid,
      kind: 'payment',
      title: childName(uuid) ?? 'Learner',
      meta: `${theirs.length} ${theirs.length === 1 ? 'payment' : 'payments'}`,
      amount: sum(theirs),
      currency: theirs[0]?.currency_code ?? 'KES',
      groups: ['all'],
      source: theirs,
    };
  });

  const filters = [
    { id: 'all', label: 'All children' },
    ...childUuids.map(uuid => ({ id: `child:${uuid}`, label: childName(uuid) ?? 'Learner' })),
  ];

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
        eyebrow='Billing'
        title='Billing'
        description='What you have paid for your children’s classes, child by child.'
        loadingStats={orders.isLoading}
        stats={[
          { label: 'Total paid', value: formatMoney(sum(paid)), hint: `${paid.length} ${paid.length === 1 ? 'payment' : 'payments'}` },
          { label: 'Awaiting payment', value: formatMoney(sum(waiting)), hint: waiting.length ? `${waiting.length} held` : 'Nothing due' },
          { label: 'Children', value: String(childUuids.length), hint: 'With paid classes' },
          { label: 'Classes paid for', value: String(paid.reduce((n, order) => n + (order.items?.length ?? 0), 0)) },
        ]}
        tabs={[
          { id: 'payments', label: 'Payments', count: orderList.length },
          { id: 'children', label: 'By child', count: childUuids.length },
        ]}
        tab={tab}
        onTabChange={setTab}
        hrefFor={hrefFor}
      >
        <SectionTabPanel value='payments'>
          <LedgerPanel
            title='Payments'
            description='Each order shows which child it was for.'
            entries={payments}
            loading={orders.isLoading}
            filters={filters}
            emptyTitle='No payments yet'
            emptyDescription='Classes you pay for your children appear here with their receipts.'
            onAction={onAction}
          />
        </SectionTabPanel>
        <SectionTabPanel value='children'>
          <LedgerPanel
            title='By child'
            description='What you have paid for each child.'
            entries={byChild}
            loading={orders.isLoading}
            emptyTitle='No children with payments yet'
            emptyDescription='Once you pay for a child’s class, their total appears here.'
          />
        </SectionTabPanel>
      </MoneyPage>
      <ReceiptSheet order={receipt} onOpenChange={open => !open && setReceipt(null)} />
      <CompletePaymentSheet order={paying} onOpenChange={open => !open && setPaying(null)} onPaid={refreshOrders} />
    </>
  );
}
