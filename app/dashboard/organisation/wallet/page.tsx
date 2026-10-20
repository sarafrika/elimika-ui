'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { EARNER_FILTERS, earnerTotals } from '@/components/money/earner';
import { formatMoney, formatSignedMoney } from '@/components/money/format';
import { type LedgerEntry, type ObligationLike, obligationEntries, statementEntries } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { MoneyPage } from '@/components/money/money-page';
import { RecordPaymentSheet } from '@/components/money/money-sheets';
import { useOrganisation } from '@/context/organisation-context';
import { useClassDefinitionsByIds, useInstructorsByIds } from '@/hooks/use-batched-lookups';
import {
  getOrganisationWalletOptions,
  getOrganisationWalletQueryKey,
  listObligationsOptions,
  listObligationsQueryKey,
  listOrganisationWalletTransactionsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const TABS = ['statement', 'payables'] as const;
const PAGE = { pageable: { page: 0, size: 100 } };
const PAYABLE_FILTERS = [
  { id: 'all', label: 'All sessions' },
  { id: 'owed', label: 'Owed' },
  { id: 'settled', label: 'Settled' },
];

type Obligation = ObligationLike & { instructor_uuid?: string; class_definition_uuid?: string };

/** An organisation's share of classes taught by instructors it hired, and what it owes them. */
export default function OrganisationWalletPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'statement');
  const [settling, setSettling] = useState<LedgerEntry<Obligation> | null>(null);

  const wallet = useQuery({ ...getOrganisationWalletOptions({ path: { organisationUuid } }), enabled: !!organisationUuid });
  const transactions = useQuery({
    ...listOrganisationWalletTransactionsOptions({ path: { organisationUuid }, query: PAGE }),
    enabled: !!organisationUuid,
  });
  const obligationQuery = { path: { organisationUuid }, query: PAGE };
  const obligations = useQuery({ ...listObligationsOptions(obligationQuery), enabled: !!organisationUuid });

  const txns = transactions.data?.data?.content ?? [];
  const entries = useMemo(() => statementEntries(txns), [txns]);
  const totals = earnerTotals(txns);
  const balance = Number(wallet.data?.data?.balance_amount ?? 0);
  const currency = wallet.data?.data?.currency_code ?? 'KES';

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

  return (
    <>
      <MoneyPage
        eyebrow='Finance'
        title='Wallet'
        description='Your share of classes taught by instructors you hired through jobs. You pay those instructors from it.'
        loadingStats={wallet.isLoading || transactions.isLoading}
        stats={[
          { label: 'Balance', value: formatMoney(balance, currency), hint: 'What the platform holds for you' },
          { label: 'Delivery shares', value: formatMoney(totals.shares, currency), hint: `${totals.sales} class ${totals.sales === 1 ? 'sale' : 'sales'}` },
          { label: 'Platform fees', value: formatSignedMoney(totals.fees, 'out', currency), hint: 'Charged on your shares' },
          { label: 'Owed to instructors', value: formatMoney(owed, currency), hint: `${owedList.length} delivered ${owedList.length === 1 ? 'session' : 'sessions'}` },
        ]}
        tabs={[
          { id: 'statement', label: 'Statement', count: entries.length },
          { id: 'payables', label: 'Instructor payables', count: owedList.length || null },
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
            emptyDescription='When a class taught by an instructor you hired is paid for, your share appears here.'
          />
        </SectionTabPanel>
        <SectionTabPanel value='payables'>
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
      </MoneyPage>
      <RecordPaymentSheet
        organisationUuid={organisationUuid}
        obligation={settling?.source ?? null}
        title={settling?.title ?? ''}
        onOpenChange={open => !open && setSettling(null)}
        onRecorded={() => {
          void queryClient.invalidateQueries({ queryKey: listObligationsQueryKey(obligationQuery) });
          void queryClient.invalidateQueries({ queryKey: getOrganisationWalletQueryKey({ path: { organisationUuid } }) });
        }}
      />
    </>
  );
}
