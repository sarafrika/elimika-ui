'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowUpRight, FileText, Landmark, LayoutDashboard, ShieldCheck, Smartphone, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { TrainingOrdersDashboard } from '@/app/dashboard/_components/wallet/TrainingOrdersDashboard';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { formatMoney } from '@/components/money/format';
import type { LedgerEntry } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { WalletTransferSheet } from '@/components/money/wallet-transfer-sheet';
import { Button } from '@/components/ui/button';
import { PayoutDetailsPanel } from '@/components/wallet/payout-details-panel';
import {
  AccountCards,
  AuditPanel,
  RefundsPanel,
  StatementsPanel,
  TransactionsPanel,
} from '@/components/wallet/wallet-panels';
import { invalidateWallet, useWalletFigures, type WalletScope } from '@/components/wallet/wallet-scope';
import { WalletShell } from '@/components/wallet/wallet-shell';
import { WithdrawDialog } from '@/components/wallet/withdraw-dialog';
import { WithdrawalsPanel } from '@/components/wallet/withdrawals-panel';
import { useUserProfile } from '@/context/profile-context';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { getMyCourseEarningsOptions } from '@/services/client/@tanstack/react-query.gen';

const TABS = ['dashboard', 'accounts', 'transactions', 'withdrawals', 'payout', 'refunds', 'statements', 'audit'] as const;
const EARNER_TYPES = ['SALE', 'PLATFORM_FEE', 'SALE_REVERSAL', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'PAYOUT_FEE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEPOSIT'];

/** A course creator's share of every class sold on their courses, per course, and every movement of it. */
export default function CourseCreatorWalletPage() {
  const user = useUserProfile();
  const userUuid = user?.uuid ?? '';
  const scope: WalletScope = { kind: 'user', userUuid };
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'dashboard');
  const [transferOpen, setTransferOpen] = useState(false);
  const { figures, isLoading } = useWalletFigures(scope);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const currency = figures?.currency ?? 'KES';

  const earnings = useQuery({ ...getMyCourseEarningsOptions(), enabled: tab === 'accounts' });
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
      <WalletShell
        scope={scope}
        title='Course Creator Wallet'
        description='Class orders for your courses, delivery progress and wallet activity.'
        tabs={[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'accounts', label: 'Accounts', icon: Landmark },
          { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
          { id: 'payout', label: 'Payout details', icon: Smartphone },
          { id: 'refunds', label: 'Refunds', icon: Undo2 },
          { id: 'statements', label: 'Statements', icon: FileText },
          { id: 'audit', label: 'Audit', icon: ShieldCheck },
        ]}
        tab={tab}
        onTabChange={setTab}
        hrefFor={hrefFor}
        onWithdraw={() => setWithdrawOpen(true)}
        actions={
          <Button variant='outline' onClick={() => setTransferOpen(true)} disabled={!figures || figures.available <= 0}>
            Transfer
          </Button>
        }
      >
        <SectionTabPanel value='dashboard'>
          {tab === 'dashboard' ? <TrainingOrdersDashboard role='course_creator' /> : null}
        </SectionTabPanel>
        <SectionTabPanel value='accounts' className='space-y-5'>
          <AccountCards
            loading={isLoading}
            cards={[
              {
                label: 'Earnings',
                value: formatMoney(figures?.available ?? 0, currency),
                hint: `Available now · ${figures?.sales ?? 0} class ${figures?.sales === 1 ? 'sale' : 'sales'} so far`,
                tone: 'success',
              },
              {
                label: 'Held for withdrawals',
                value: formatMoney(figures?.held ?? 0, currency),
                hint: figures?.held ? 'Being sent to M-Pesa' : 'Nothing in progress',
                tone: 'warning',
              },
              {
                label: 'Platform fees',
                value: formatMoney(figures?.fees ?? 0, currency),
                hint: `Charged on ${formatMoney(figures?.shares ?? 0, currency)} of shares`,
              },
            ]}
          />
          <LedgerPanel
            title='By course'
            description='What each of your courses has earned you, net of platform fees.'
            entries={byCourse}
            loading={earnings.isLoading}
            emptyTitle='No course earnings yet'
            emptyDescription='Each course appears here once one of its classes sells.'
          />
        </SectionTabPanel>
        <SectionTabPanel value='transactions'>
          <TransactionsPanel scope={scope} active={tab === 'transactions'} filterTypes={EARNER_TYPES} />
        </SectionTabPanel>
        <SectionTabPanel value='withdrawals'>
          <WithdrawalsPanel
            scope={scope}
            active={tab === 'withdrawals'}
            selfUuid={userUuid}
            onWithdraw={figures?.canWithdraw ? () => setWithdrawOpen(true) : undefined}
            onChanged={() => void invalidateWallet(queryClient)}
          />
        </SectionTabPanel>
        <SectionTabPanel value='payout'>
          <PayoutDetailsPanel
            scope={scope}
            active={tab === 'payout'}
            canManage
            ownerName={[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'you'}
          />
        </SectionTabPanel>
        <SectionTabPanel value='refunds'>
          <RefundsPanel
            scope={scope}
            active={tab === 'refunds'}
            types={['SALE_REVERSAL']}
            description='Shares taken back when a class of your course was refunded or corrected.'
            emptyDescription='When a class sale is reversed, the share taken back from you appears here.'
          />
        </SectionTabPanel>
        <SectionTabPanel value='statements'>
          <StatementsPanel scope={scope} active={tab === 'statements'} />
        </SectionTabPanel>
        <SectionTabPanel value='audit'>
          <AuditPanel scope={scope} active={tab === 'audit'} selfUuid={userUuid} />
        </SectionTabPanel>
      </WalletShell>
      <WalletTransferSheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        userUuid={userUuid}
        balance={figures?.available ?? 0}
        currency={currency}
        onTransferred={() => void invalidateWallet(queryClient)}
      />
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        scope={scope}
        available={figures?.available ?? 0}
        currency={currency}
        onAddNumber={() => setTab('payout')}
        onChanged={() => void invalidateWallet(queryClient)}
      />
    </>
  );
}
