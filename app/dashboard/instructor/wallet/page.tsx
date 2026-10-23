'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowUpRight, FileText, Landmark, LayoutDashboard, ShieldCheck, Smartphone, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { TrainingOrdersDashboard } from '@/app/dashboard/_components/wallet/TrainingOrdersDashboard';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { formatMoney } from '@/components/money/format';
import { type ObligationLike, obligationEntries } from '@/components/money/ledger';
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
import { WithdrawSheet } from '@/components/wallet/withdraw-sheet';
import { WithdrawalsPanel } from '@/components/wallet/withdrawals-panel';
import { useUserProfile } from '@/context/profile-context';
import { useClassDefinitionsByIds, useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import {
  getStatementOptions,
  listInstructorObligationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const TABS = ['dashboard', 'accounts', 'transactions', 'withdrawals', 'payout', 'refunds', 'statements', 'audit'] as const;
const EARNER_TYPES = ['SALE', 'PLATFORM_FEE', 'SALE_REVERSAL', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'PAYOUT_FEE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEPOSIT'];
const PAGE = { pageable: { page: 0, size: 100 } };

type Obligation = ObligationLike & { organisation_uuid?: string; class_definition_uuid?: string };

/** An instructor's share of the classes they teach, what organisations owe them, and every movement of it. */
export default function InstructorWalletPage() {
  const user = useUserProfile();
  const userUuid = user?.uuid ?? '';
  const scope: WalletScope = { kind: 'user', userUuid };
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'dashboard');
  const [transferOpen, setTransferOpen] = useState(false);
  const { figures, isLoading } = useWalletFigures(scope);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const currency = figures?.currency ?? 'KES';

  const owedStatement = useQuery({
    ...getStatementOptions({ path: { instructorUserUuid: userUuid } }),
    enabled: !!userUuid && tab === 'accounts',
  });
  const obligations = useQuery({
    ...listInstructorObligationsOptions({ path: { instructorUserUuid: userUuid }, query: PAGE }),
    enabled: !!userUuid && tab === 'accounts',
  });
  const obligationList = (obligations.data?.data?.content ?? []) as Obligation[];
  const { classDefinitionMap } = useClassDefinitionsByIds(obligationList.map(o => o.class_definition_uuid ?? ''));
  const { organisationMap } = useOrganisationsByIds(obligationList.map(o => o.organisation_uuid ?? ''));
  const owedEntries = obligationEntries(obligationList, {
    canSettle: false,
    title: o =>
      [organisationMap[o.organisation_uuid ?? '']?.name, classDefinitionMap[o.class_definition_uuid ?? '']?.title]
        .filter(Boolean)
        .join(' · ') || 'Delivered session',
  });
  const lines = owedStatement.data?.data?.lines ?? [];
  const owed = lines.reduce((sum, line) => sum + Number(line.amount_outstanding ?? 0), 0);
  const owedSessions = lines.reduce((sum, line) => sum + Number(line.outstanding_session_count ?? 0), 0);

  return (
    <>
      <WalletShell
        scope={scope}
        title='Instructor Wallet'
        description='Course class orders, delivery progress and wallet activity.'
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
        scrollButtons
        onWithdraw={() => setWithdrawOpen(true)}
        actions={
          <Button variant='outline' onClick={() => setTransferOpen(true)} disabled={!figures || figures.available <= 0}>
            Transfer
          </Button>
        }
      >
        <SectionTabPanel value='dashboard'>
          {tab === 'dashboard' ? <TrainingOrdersDashboard role='instructor' /> : null}
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
                label: 'Owed by organisations',
                value: formatMoney(owed, currency),
                hint: `${owedSessions} delivered ${owedSessions === 1 ? 'session' : 'sessions'} · paid to you directly, not withdrawable`,
              },
            ]}
          />
          <LedgerPanel
            title='Owed to me'
            description='Sessions you delivered for organisations; they pay you directly.'
            entries={owedEntries}
            loading={obligations.isLoading}
            emptyTitle='Nothing owed'
            emptyDescription='Sessions you deliver for an organisation that hired you appear here until it pays you.'
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
            description='Shares taken back when a class you taught was refunded or corrected.'
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
