'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { Button } from '@/components/ui/button';
import { EARNER_FILTERS, earnerTotals } from '@/components/money/earner';
import { formatMoney, formatSignedMoney } from '@/components/money/format';
import { type LedgerEntry, statementEntries } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { MoneyPage } from '@/components/money/money-page';
import { WalletTransferSheet } from '@/components/money/wallet-transfer-sheet';
import { useUserProfile } from '@/context/profile-context';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import {
  getMyCourseEarningsOptions,
  getWalletOptions,
  getWalletQueryKey,
  listTransactions1Options,
  listTransactions1QueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const TABS = ['statement', 'courses'] as const;
const PAGE = { pageable: { page: 0, size: 100 } };

/** A course creator's share of every class sold on their courses, and the total per course. */
export default function CourseCreatorWalletPage() {
  const user = useUserProfile();
  const userUuid = user?.uuid ?? '';
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'statement');
  const [transferOpen, setTransferOpen] = useState(false);

  const wallet = useQuery({ ...getWalletOptions({ path: { userUuid } }), enabled: !!userUuid });
  const transactions = useQuery({ ...listTransactions1Options({ path: { userUuid }, query: PAGE }), enabled: !!userUuid });
  const earnings = useQuery({ ...getMyCourseEarningsOptions(), enabled: tab === 'courses' });

  const txns = transactions.data?.data?.content ?? [];
  const entries = useMemo(() => statementEntries(txns), [txns]);
  const totals = earnerTotals(wallet.data?.data);
  const balance = Number(wallet.data?.data?.balance_amount ?? 0);
  const currency = wallet.data?.data?.currency_code ?? 'KES';
  const withdrawn = totals.transferredOut;

  const courseRows = earnings.data?.data ?? [];
  const { courseMap } = useCoursesByIds(courseRows.map(row => row.course_uuid ?? ''));
  const byCourse: LedgerEntry[] = courseRows.map(row => ({
    id: row.course_uuid ?? '',
    kind: 'payment',
    title: courseMap[row.course_uuid ?? '']?.name ?? 'Course',
    meta: `${row.sales_count} class ${Number(row.sales_count) === 1 ? 'sale' : 'sales'}`,
    amount: Number(row.earned_amount ?? 0),
    currency,
    groups: ['all'],
    source: row,
  }));

  return (
    <>
      <MoneyPage
        eyebrow='Wallet'
        title='Wallet'
        description='Your share of every class sold on your courses, with the platform fee charged on it.'
        actions={
          <Button variant='outline' onClick={() => setTransferOpen(true)} disabled={balance <= 0}>
            Transfer
          </Button>
        }
        loadingStats={wallet.isLoading || transactions.isLoading}
        stats={[
          { label: 'Balance', value: formatMoney(balance, currency), hint: 'What the platform holds for you' },
          { label: 'Your shares', value: formatMoney(totals.shares, currency), hint: `${totals.sales} class ${totals.sales === 1 ? 'sale' : 'sales'}` },
          { label: 'Platform fees', value: formatSignedMoney(totals.fees, 'out', currency), hint: 'Charged on your shares' },
          { label: 'Transferred out', value: formatMoney(withdrawn, currency), hint: withdrawn ? 'Sent to other users' : 'Nothing sent yet' },
        ]}
        tabs={[
          { id: 'statement', label: 'Statement', count: entries.length },
          { id: 'courses', label: 'By course' },
        ]}
        tab={tab}
        onTabChange={setTab}
        hrefFor={hrefFor}
      >
        <SectionTabPanel value='statement'>
          <LedgerPanel
            title='Statement'
            description='Money in and out of your wallet.'
            entries={entries}
            loading={transactions.isLoading}
            filters={EARNER_FILTERS}
            emptyTitle='Nothing here yet'
            emptyDescription='When a class on one of your courses is paid for, your share appears here.'
          />
        </SectionTabPanel>
        <SectionTabPanel value='courses'>
          <LedgerPanel
            title='By course'
            description='What each of your courses has earned you, net of platform fees.'
            entries={byCourse}
            loading={earnings.isLoading}
            emptyTitle='No course earnings yet'
            emptyDescription='Each course appears here once one of its classes sells.'
          />
        </SectionTabPanel>
      </MoneyPage>
      <WalletTransferSheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        userUuid={userUuid}
        balance={balance}
        currency={currency}
        onTransferred={() => {
          void queryClient.invalidateQueries({ queryKey: getWalletQueryKey({ path: { userUuid } }) });
          void queryClient.invalidateQueries({ queryKey: listTransactions1QueryKey({ path: { userUuid }, query: PAGE }) });
        }}
      />
    </>
  );
}
