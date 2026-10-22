'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowUpRight, Coins, FileText, Landmark, LayoutDashboard, Receipt, ShieldCheck, Smartphone, Undo2, Users } from 'lucide-react';
import { useState } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { StatCard } from '@/components/data-display/stat-tile';
import { formatMoney, formatSignedMoney } from '@/components/money/format';
import { type LedgerEntry, type ObligationLike, obligationEntries } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { RecordPaymentSheet } from '@/components/money/money-sheets';
import { usePayoutApprovers } from '@/components/wallet/payout-api';
import { PayoutApproversCard } from '@/components/wallet/payout-approvers-card';
import { PayoutDetailsPanel } from '@/components/wallet/payout-details-panel';
import {
  AccountCards,
  AuditPanel,
  RecentTransactions,
  RefundsPanel,
  StatementsPanel,
  TransactionsPanel,
} from '@/components/wallet/wallet-panels';
import { invalidateWallet, useWalletFigures, type WalletScope } from '@/components/wallet/wallet-scope';
import { WalletShell } from '@/components/wallet/wallet-shell';
import { WithdrawSheet } from '@/components/wallet/withdraw-sheet';
import { WithdrawalsPanel } from '@/components/wallet/withdrawals-panel';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { useClassDefinitionsByIds, useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { listObligationsOptions, listObligationsQueryKey } from '@/services/client/@tanstack/react-query.gen';

const TABS = ['dashboard', 'accounts', 'transactions', 'withdrawals', 'payout', 'refunds', 'statements', 'audit'] as const;
const EARNER_TYPES = ['SALE', 'PLATFORM_FEE', 'SALE_REVERSAL', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'PAYOUT_FEE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEPOSIT'];
const PAGE = { pageable: { page: 0, size: 100 } };
const PAYABLE_FILTERS = [
  { id: 'all', label: 'All sessions' },
  { id: 'owed', label: 'Owed' },
  { id: 'settled', label: 'Settled' },
];

type Obligation = ObligationLike & { instructor_uuid?: string; class_definition_uuid?: string };

/** An organisation's share of classes taught by instructors it hired, what it owes them, and every movement. */
export default function OrganisationWalletPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const user = useUserProfile();
  const scope: WalletScope = { kind: 'organisation', organisationUuid };
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'dashboard');
  const [settling, setSettling] = useState<LedgerEntry<Obligation> | null>(null);
  const { figures, isLoading } = useWalletFigures(scope);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const currency = figures?.currency ?? 'KES';

  const obligationQuery = { path: { organisationUuid }, query: PAGE };
  const obligations = useQuery({ ...listObligationsOptions(obligationQuery), enabled: !!organisationUuid });
  const obligationList = (obligations.data?.data?.content ?? []) as Obligation[];
  const { instructorMap } = useInstructorsByIds(obligationList.map(o => o.instructor_uuid ?? ''));
  const { classDefinitionMap } = useClassDefinitionsByIds(obligationList.map(o => o.class_definition_uuid ?? ''));
  const titleOf = (o: Obligation) =>
    [instructorMap[o.instructor_uuid ?? '']?.full_name, classDefinitionMap[o.class_definition_uuid ?? '']?.title]
      .filter(Boolean)
      .join(' · ') || 'Delivered session';
  const payables = obligationEntries(obligationList, { canSettle: true, title: titleOf });
  const owedList = obligationList.filter(o => (o.status ?? '').toUpperCase() === 'ACCRUED');
  const owed = owedList.reduce((sum, o) => sum + Number(o.rate_amount ?? 0), 0);
  const { approvers } = usePayoutApprovers(organisationUuid, true);
  const isApprover = approvers.some(approver => approver.user_uuid === user?.uuid);
  const sessions = `${owedList.length} delivered ${owedList.length === 1 ? 'session' : 'sessions'}`;

  return (
    <>
      <WalletShell
        scope={scope}
        eyebrow='Finance'
        title='Organisation Wallet'
        description='Class orders delivered by your organisation, what you owe hired instructors, and wallet activity.'
        tabs={[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'accounts', label: 'Accounts', icon: Landmark, count: owedList.length || null },
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
      >
        <SectionTabPanel value='dashboard' className='space-y-5'>
          <section aria-label='Summary' className={surfaceTheme.statGrid}>
            <StatCard
              label='Delivery shares'
              value={formatMoney(figures?.shares ?? 0, currency)}
              hint={`${figures?.sales ?? 0} class ${figures?.sales === 1 ? 'sale' : 'sales'}`}
              icon={Coins}
              tone='success'
            />
            <StatCard
              label='Platform fees'
              value={formatSignedMoney(figures?.fees ?? 0, 'out', currency)}
              hint='Charged on your shares'
              icon={Receipt}
            />
            <StatCard label='Owed to instructors' value={formatMoney(owed, currency)} hint={sessions} icon={Users} tone='warning' />
          </section>
          <RecentTransactions scope={scope} active={tab === 'dashboard'} onViewAll={() => setTab('transactions')} />
        </SectionTabPanel>
        <SectionTabPanel value='accounts' className='space-y-5'>
          <AccountCards
            loading={isLoading}
            cards={[
              {
                label: 'Earnings',
                value: formatMoney(figures?.available ?? 0, currency),
                hint: 'Available now',
                tone: 'success',
              },
              {
                label: 'Held for withdrawals',
                value: formatMoney(figures?.held ?? 0, currency),
                hint: figures?.held ? 'Being sent to M-Pesa' : 'Nothing in progress',
                tone: 'warning',
              },
              {
                label: 'Owed to instructors',
                value: formatMoney(owed, currency),
                hint: `${sessions} · you pay these off-platform`,
              },
            ]}
          />
          <LedgerPanel
            title='Instructor payables'
            description='Delivered sessions you owe your hired instructors for.'
            entries={payables}
            loading={obligations.isLoading}
            filters={PAYABLE_FILTERS}
            emptyTitle='Nothing owed'
            emptyDescription='Sessions your hired instructors deliver appear here until you record paying them.'
            onAction={entry => setSettling(entry as LedgerEntry<Obligation>)}
          />
        </SectionTabPanel>
        <SectionTabPanel value='transactions'>
          <TransactionsPanel
            scope={scope}
            active={tab === 'transactions'}
            filterTypes={EARNER_TYPES}
            exportName='organisation-wallet-transactions.csv'
          />
        </SectionTabPanel>
        <SectionTabPanel value='withdrawals'>
          <WithdrawalsPanel
            scope={scope}
            active={tab === 'withdrawals'}
            selfUuid={user?.uuid}
            canApprove={isApprover}
            onWithdraw={figures?.canWithdraw ? () => setWithdrawOpen(true) : undefined}
            onChanged={() => void invalidateWallet(queryClient)}
          />
        </SectionTabPanel>
        <SectionTabPanel value='payout'>
          <PayoutDetailsPanel
            scope={scope}
            active={tab === 'payout'}
            canManage={isApprover}
            ownerName={[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'you'}
            readOnlyNote='Only payout approvers can add or change these numbers. Any admin can name approvers.'
            aside={
              <PayoutApproversCard
                organisationUuid={organisationUuid}
                approvers={approvers}
                selfUuid={user?.uuid}
                active={tab === 'payout'}
              />
            }
          />
        </SectionTabPanel>
        <SectionTabPanel value='refunds'>
          <RefundsPanel
            scope={scope}
            active={tab === 'refunds'}
            types={['SALE_REVERSAL']}
            description='Shares taken back when a class your organisation delivered was refunded or corrected.'
            emptyDescription='When a class sale is reversed, the share taken back appears here.'
          />
        </SectionTabPanel>
        <SectionTabPanel value='statements'>
          <StatementsPanel scope={scope} active={tab === 'statements'} />
        </SectionTabPanel>
        <SectionTabPanel value='audit'>
          <AuditPanel scope={scope} active={tab === 'audit'} selfUuid={user?.uuid} />
        </SectionTabPanel>
      </WalletShell>
      <RecordPaymentSheet
        organisationUuid={organisationUuid}
        obligation={settling?.source ?? null}
        title={settling?.title ?? ''}
        onOpenChange={open => !open && setSettling(null)}
        onRecorded={() => {
          void queryClient.invalidateQueries({ queryKey: listObligationsQueryKey(obligationQuery) });
          void invalidateWallet(queryClient);
        }}
      />
      <WithdrawSheet
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
