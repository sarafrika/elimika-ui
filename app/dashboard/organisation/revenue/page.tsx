'use client';

import { useQuery } from '@tanstack/react-query';
import { HandCoins, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { SectionCard } from '@/components/data-display';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import { formatMoney } from '@/components/money/format';
import { MoneyPage } from '@/components/money/money-page';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { useInstructorsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { extractEntity } from '@/lib/api-helpers';
import type { OrganisationInstructorPayable, RevenueAmountDto, RevenueDashboardDto } from '@/services/client';
import {
  getInstructorPayablesForOrganisationOptions,
  getPlatformFeeSummaryOptions,
  getRevenueDashboardOptions,
} from '@/services/client/@tanstack/react-query.gen';

const TABS = ['overview', 'payables'] as const;

/** Every currency in the list, never summed across them: "KES 12,500 · USD 40". */
const amounts = (list?: RevenueAmountDto[]): string => {
  const shown = (list ?? []).filter(a => a.amount !== undefined && a.amount !== null);
  return shown.length ? shown.map(a => formatMoney(a.amount, a.currency_code)).join(' · ') : formatMoney(0);
};

const count = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

/** One labelled figure in the totals list. */
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex justify-between gap-4 px-5 py-3'>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className='text-right text-sm font-semibold tabular-nums'>{value}</dd>
    </div>
  );
}

/** Sales analytics for the organisation and what it owes its hired instructors. */
export default function OrganisationEarningsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'overview');

  const dashboardQuery = useQuery({ ...getRevenueDashboardOptions({ query: { domain: 'organisation_user' } }) });
  const platformFeesQuery = useQuery({ ...getPlatformFeeSummaryOptions() });
  const payablesQuery = useQuery({
    ...getInstructorPayablesForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const dashboard = extractEntity<RevenueDashboardDto>(dashboardQuery.data) ?? {};
  const platformFees = (platformFeesQuery.data?.data ?? []) as RevenueAmountDto[];
  const scopes = dashboard.scope_breakdown ?? [];

  const payables = useMemo(
    () => (payablesQuery.data?.data ?? []) as OrganisationInstructorPayable[],
    [payablesQuery.data]
  );
  // Payables are grouped by instructor and currency, so the total is kept per currency.
  const owed = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of payables) {
      const code = p.currency_code ?? 'KES';
      totals.set(code, (totals.get(code) ?? 0) + Number(p.amount_owed ?? 0));
    }
    return [...totals].map(([currency_code, amount]) => ({ currency_code, amount }));
  }, [payables]);

  const instructorIds = useMemo(() => payables.map(p => p.instructor_uuid ?? '').filter(Boolean), [payables]);
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const userIds = useMemo(
    () => instructorIds.map(id => instructorMap[id]?.user_uuid ?? '').filter(Boolean),
    [instructorIds, instructorMap]
  );
  const { userMap } = useUsersByIds(userIds);

  const instructorName = (instructorUuid?: string) => {
    if (!instructorUuid) return 'Instructor';
    const userUuid = instructorMap[instructorUuid]?.user_uuid;
    const user = userUuid ? userMap[userUuid] : undefined;
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    return name || `${instructorUuid.slice(0, 8)}…`;
  };

  return (
    <MoneyPage
      eyebrow='Finance'
      title='Earnings'
      description='Sales, earnings and platform fees for your organisation, and what you owe instructors.'
      loadingStats={dashboardQuery.isLoading}
      stats={[
        {
          label: 'Estimated earnings',
          value: amounts(dashboard.estimated_earnings),
          hint: 'For the period',
          icon: TrendingUp,
        },
        { label: 'Gross revenue', value: amounts(dashboard.gross_totals), hint: 'What learners paid' },
        { label: 'Orders', value: count(dashboard.order_count), hint: `${count(dashboard.units_sold)} units sold` },
        {
          label: 'Owed to instructors',
          value: amounts(owed),
          hint: `${payables.length} ${payables.length === 1 ? 'payable' : 'payables'}`,
          icon: HandCoins,
        },
      ]}
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'payables', label: 'Instructor payables', count: payables.length || null },
      ]}
      tab={tab}
      onTabChange={setTab}
      hrefFor={hrefFor}
    >
      <SectionTabPanel value='overview'>
        <div className='grid gap-4 xl:grid-cols-2'>
          <SectionCard title='Totals' description='Aggregate performance for the period.' bodyClassName='p-0'>
            <dl className='divide-border/60 divide-y'>
              <Line label='Gross revenue' value={amounts(dashboard.gross_totals)} />
              <Line label='Estimated earnings' value={amounts(dashboard.estimated_earnings)} />
              <Line label='Average order value' value={amounts(dashboard.average_order_value)} />
              <Line label='Orders' value={count(dashboard.order_count)} />
              <Line label='Line items' value={count(dashboard.line_item_count)} />
              <Line label='Platform fees' value={amounts(platformFees)} />
            </dl>
          </SectionCard>

          <SectionCard title='Revenue by scope' description='Breakdown across sources.' bodyClassName='p-0'>
            {dashboardQuery.isLoading ? (
              <div className='space-y-2 p-5'>
                {[0, 1, 2].map(i => (
                  <Skeleton key={i} className='h-10 w-full' />
                ))}
              </div>
            ) : scopes.length === 0 ? (
              <EmptyState
                variant='plain'
                icon={TrendingUp}
                title='No revenue yet'
                description='No revenue recorded for this period.'
              />
            ) : (
              <ul className='divide-border/60 divide-y'>
                {scopes.map((scope, index) => (
                  <li key={`${scope.scope}-${index}`} className='flex items-center justify-between gap-3 px-5 py-3'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{scope.scope ?? 'Unknown'}</p>
                      <p className='text-muted-foreground text-xs'>
                        {count(scope.units_sold)} units · {count(scope.line_item_count)} line items
                      </p>
                    </div>
                    <span className='shrink-0 text-right text-sm font-semibold tabular-nums'>
                      {amounts(scope.gross_totals)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </SectionTabPanel>

      <SectionTabPanel value='payables'>
        <SectionCard
          title='Instructor payables'
          description='What your organisation owes instructors for delivered class sessions.'
          bodyClassName='p-0'
        >
          {payablesQuery.isLoading ? (
            <div className='space-y-2 p-5'>
              {[0, 1, 2, 3].map(i => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : payables.length === 0 ? (
            <EmptyState
              variant='plain'
              icon={HandCoins}
              title='Nothing owed'
              description='Payables accrue as instructors complete class sessions.'
            />
          ) : (
            <div className='overflow-x-auto'>
              <Table className='min-w-[560px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='pl-5 whitespace-nowrap'>Instructor</TableHead>
                    <TableHead className='text-right whitespace-nowrap'>Classes</TableHead>
                    <TableHead className='text-right whitespace-nowrap'>Sessions delivered</TableHead>
                    <TableHead className='pr-5 text-right whitespace-nowrap'>Amount owed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.map(payable => (
                    // One row per instructor and currency, as the backend groups them.
                    <TableRow key={`${payable.instructor_uuid}-${payable.currency_code ?? ''}`}>
                      <TableCell className='pl-5 font-medium whitespace-nowrap'>
                        {instructorName(payable.instructor_uuid)}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-right tabular-nums'>
                        {count(payable.class_count)}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-right tabular-nums'>
                        {count(payable.session_count)}
                      </TableCell>
                      <TableCell className='pr-5 text-right font-semibold whitespace-nowrap tabular-nums'>
                        {formatMoney(payable.amount_owed, payable.currency_code ?? 'KES')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </SectionTabPanel>
    </MoneyPage>
  );
}
