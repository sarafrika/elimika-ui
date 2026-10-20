'use client';

import { Banknote, Clock, Landmark, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { formatMoney, formatMoneyDate } from '@/components/money/format';
import type { LedgerEntry, LedgerKind } from '@/components/money/ledger';
import { LedgerPanel } from '@/components/money/ledger-panel';
import { MoneyPage } from '@/components/money/money-page';
import type { SkillsFundSource, SkillsFundTransaction } from '@/services/client';
import { useSkillsFundData } from './use-skills-fund-data';

const TABS = ['movements', 'sources'] as const;

type MovementStatus = { label: string; kind: LedgerKind; group: string };
const PENDING: MovementStatus = { label: 'Pending', kind: 'waiting', group: 'pending' };
const STATUS: Record<string, MovementStatus> = {
  PENDING,
  ALLOCATED: { label: 'Allocated', kind: 'waiting', group: 'pending' },
  APPROVED: { label: 'Approved', kind: 'waiting', group: 'pending' },
  DISBURSED: { label: 'Disbursed', kind: 'payment', group: 'disbursed' },
};

const MOVEMENT_FILTERS = [
  { id: 'all', label: 'All movements' },
  { id: 'mine', label: 'For you' },
  { id: 'disbursed', label: 'Disbursed' },
  { id: 'pending', label: 'Not yet disbursed' },
];

function movementEntries(
  transactions: SkillsFundTransaction[],
  userUuid: string | null
): LedgerEntry<SkillsFundTransaction>[] {
  return transactions.map((txn, index) => {
    const status = STATUS[String(txn.status ?? 'PENDING').toUpperCase()] ?? PENDING;
    const meta = [txn.target_name, txn.transaction_type, formatMoneyDate(txn.transaction_date ?? txn.created_date)];
    const mine = Boolean(userUuid) && txn.beneficiary_user_uuid === userUuid;
    return {
      id: txn.uuid ?? `movement-${index}`,
      kind: status.kind,
      title: txn.description || txn.transaction_type || 'Fund movement',
      meta: meta.filter(Boolean).join(' · '),
      amount: Number(txn.amount ?? 0),
      currency: txn.currency_code ?? 'KES',
      status: status.label,
      groups: [status.group, ...(mine ? ['mine'] : [])],
      source: txn,
    };
  });
}

function sourceEntries(sources: SkillsFundSource[]): LedgerEntry<SkillsFundSource>[] {
  return sources.map((source, index) => ({
    id: source.uuid ?? `source-${index}`,
    kind: 'in',
    direction: 'in',
    title: source.name || 'Funding source',
    meta: [source.source_type, formatMoneyDate(source.created_date)].filter(Boolean).join(' · '),
    amount: Number(source.amount ?? 0),
    currency: source.currency_code ?? 'KES',
    groups: [],
    source,
  }));
}

/** The Skills Fund of the caller's organisation; shared by learners, instructors and course creators. */
export function SkillsFundRoutePage() {
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'movements');
  const fund = useSkillsFundData();
  const { summary, currencyCode } = fund;

  const movements = useMemo(
    () => movementEntries(fund.transactions, fund.userUuid),
    [fund.transactions, fund.userUuid]
  );
  const sources = useMemo(() => sourceEntries(fund.sources), [fund.sources]);
  const mineCount = movements.filter(entry => entry.groups.includes('mine')).length;

  const noOrganisation = !fund.profileLoading && !fund.organisationUuid;
  const emptyHint = noOrganisation ? 'Join an organisation to see the Skills Fund that supports you.' : undefined;

  return (
    <MoneyPage
      eyebrow='Skills Fund'
      title='Skills Fund'
      description={
        noOrganisation
          ? 'You are not affiliated with an organisation yet.'
          : `Funding held for learners at ${fund.organisationName}: where it came from and where it went.`
      }
      loadingStats={fund.profileLoading || fund.summaryLoading}
      stats={[
        {
          label: 'Available',
          value: formatMoney(summary?.remaining ?? 0, currencyCode),
          hint: 'Contributed less disbursed',
          icon: Wallet,
        },
        {
          label: 'Total contributed',
          value: formatMoney(summary?.total_balance ?? 0, currencyCode),
          hint: `${fund.sources.length} ${fund.sources.length === 1 ? 'source' : 'sources'}`,
          icon: Landmark,
        },
        {
          label: 'Disbursed',
          value: formatMoney(summary?.disbursed ?? 0, currencyCode),
          hint: mineCount ? `${mineCount} ${mineCount === 1 ? 'movement' : 'movements'} for you` : undefined,
          icon: Banknote,
          tone: 'success',
        },
        {
          label: 'Pending requests',
          value: formatMoney(summary?.pending ?? 0, currencyCode),
          icon: Clock,
          tone: 'warning',
        },
      ]}
      tabs={[
        { id: 'movements', label: 'Movements', count: movements.length },
        { id: 'sources', label: 'Sources', count: sources.length },
      ]}
      tab={tab}
      onTabChange={setTab}
      hrefFor={hrefFor}
    >
      <SectionTabPanel value='movements'>
        <LedgerPanel
          title='Movements'
          description='Allocations and disbursements from the fund.'
          entries={movements}
          loading={fund.profileLoading || fund.transactionsLoading}
          filters={MOVEMENT_FILTERS}
          emptyTitle='No movements yet'
          emptyDescription={emptyHint ?? 'Allocations and disbursements from the fund appear here.'}
        />
      </SectionTabPanel>
      <SectionTabPanel value='sources'>
        <LedgerPanel
          title='Sources'
          description='Grants, sponsors and donors that have contributed to the fund.'
          entries={sources}
          loading={fund.profileLoading || fund.sourcesLoading}
          emptyTitle='No sources yet'
          emptyDescription={emptyHint ?? 'Contributions to the fund appear here.'}
        />
      </SectionTabPanel>
    </MoneyPage>
  );
}
