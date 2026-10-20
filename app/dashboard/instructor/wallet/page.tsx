'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { Button } from '@/components/ui/button';
import { formatMoney, formatSignedMoney } from '@/components/money/format';
import { type ObligationLike, obligationEntries, statementEntries } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { EARNER_FILTERS, earnerTotals } from '@/components/money/earner';
import { MoneyPage } from '@/components/money/money-page';
import { WalletTransferSheet } from '@/components/money/wallet-transfer-sheet';
import { useUserProfile } from '@/context/profile-context';
import { useClassDefinitionsByIds, useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import {
  getStatementOptions,
  getWalletOptions,
  getWalletQueryKey,
  listInstructorObligationsOptions,
  listTransactions1Options,
  listTransactions1QueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const TABS = ['statement', 'owed'] as const;
const PAGE = { pageable: { page: 0, size: 100 } };

type Obligation = ObligationLike & { organisation_uuid?: string; class_definition_uuid?: string };

/** An instructor's share of the classes they teach, and what organisations owe them for sessions. */
export default function InstructorWalletPage() {
  const user = useUserProfile();
  const userUuid = user?.uuid ?? '';
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'statement');
  const [transferOpen, setTransferOpen] = useState(false);

  const wallet = useQuery({ ...getWalletOptions({ path: { userUuid } }), enabled: !!userUuid });
  const transactions = useQuery({ ...listTransactions1Options({ path: { userUuid }, query: PAGE }), enabled: !!userUuid });
  const owedStatement = useQuery({ ...getStatementOptions({ path: { instructorUserUuid: userUuid } }), enabled: !!userUuid });
  const obligations = useQuery({
    ...listInstructorObligationsOptions({ path: { instructorUserUuid: userUuid }, query: PAGE }),
    enabled: !!userUuid && tab === 'owed',
  });

  const txns = transactions.data?.data?.content ?? [];
  const entries = useMemo(() => statementEntries(txns), [txns]);
  const totals = earnerTotals(txns);
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
  const balance = Number(wallet.data?.data?.balance_amount ?? 0);
  const currency = wallet.data?.data?.currency_code ?? 'KES';

  return (
    <>
      <MoneyPage
        eyebrow='Wallet'
        title='Wallet'
        description='Your share of the classes you teach, the platform fee on it, and what organisations owe you.'
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
          { label: 'Owed by organisations', value: formatMoney(owed, currency), hint: `${owedSessions} delivered ${owedSessions === 1 ? 'session' : 'sessions'}` },
        ]}
        tabs={[
          { id: 'statement', label: 'Statement', count: entries.length },
          { id: 'owed', label: 'Owed to me', count: owedSessions || null },
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
            emptyDescription='When a class you teach is paid for, your share appears here.'
          />
        </SectionTabPanel>
        <SectionTabPanel value='owed'>
          <LedgerPanel
            title='Owed to me'
            description='Sessions you delivered for organisations; they pay you directly.'
            entries={owedEntries}
            loading={obligations.isLoading}
            emptyTitle='Nothing owed'
            emptyDescription='Sessions you deliver for an organisation that hired you appear here until it pays you.'
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
