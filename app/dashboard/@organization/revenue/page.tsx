'use client';

import { useQuery } from '@tanstack/react-query';
import { Coins, HandCoins, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useOrganisation } from '@/context/organisation-context';
import { useInstructorsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { extractEntity } from '@/lib/api-helpers';
import type {
  OrganisationInstructorPayable,
  RevenueAmountDto,
  RevenueDashboardDto,
} from '@/services/client';
import {
  getInstructorPayablesForOrganisationOptions,
  getPlatformFeeSummaryOptions,
  getRevenueDashboardOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
} from '../_components/ui';

/** Format the first (primary-currency) amount from a revenue amount list. */
const money = (amounts?: RevenueAmountDto[]): string => {
  const primary = amounts?.[0];
  if (!primary || primary.amount === undefined || primary.amount === null) return '—';
  const value = Number(primary.amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${primary.currency_code ?? ''} ${value}`.trim();
};

const count = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

const amount = (value?: number | null): string =>
  value === undefined || value === null
    ? '—'
    : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrganisationRevenuePage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const dashboardQuery = useQuery({
    ...getRevenueDashboardOptions({ query: { domain: 'organisation_user' } }),
  });

  const platformFeesQuery = useQuery({
    ...getPlatformFeeSummaryOptions(),
  });

  const payablesQuery = useQuery({
    ...getInstructorPayablesForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const dashboard = extractEntity<RevenueDashboardDto>(dashboardQuery.data) ?? {};
  const platformFees = (platformFeesQuery.data?.data ?? []) as RevenueAmountDto[];
  const isLoading = dashboardQuery.isLoading;

  const payables = useMemo(
    () => (payablesQuery.data?.data ?? []) as OrganisationInstructorPayable[],
    [payablesQuery.data]
  );
  const totalOwed = useMemo(
    () => payables.reduce((sum, p) => sum + Number(p.amount_owed ?? 0), 0),
    [payables]
  );

  const instructorIds = useMemo(
    () => payables.map(p => p.instructor_uuid ?? '').filter(Boolean),
    [payables]
  );
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const userIds = useMemo(
    () =>
      instructorIds
        .map(id => instructorMap[id]?.user_uuid ?? '')
        .filter(Boolean),
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

  const kpis = [
    { label: 'Gross revenue', value: money(dashboard.gross_totals), icon: Coins, tone: 'success' as const },
    {
      label: 'Estimated earnings',
      value: money(dashboard.estimated_earnings),
      icon: TrendingUp,
      tone: 'info' as const,
    },
    { label: 'Orders', value: count(dashboard.order_count), icon: ShoppingCart, tone: 'neutral' as const },
    { label: 'Units sold', value: count(dashboard.units_sold), icon: Receipt, tone: 'warning' as const },
  ];

  const scopes = dashboard.scope_breakdown ?? [];

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Revenue'
          description='Sales, earnings and platform fees for your organisation.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {isLoading
            ? kpis.map(kpi => <StatCardSkeleton key={kpi.label} />)
            : kpis.map(kpi => (
                <StatCard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  icon={kpi.icon}
                  tone={kpi.tone}
                />
              ))}
        </div>

        <div className='grid gap-4 xl:grid-cols-2'>
          <SectionCard title='Totals' description='Aggregate performance for the period'>
            <DetailGrid
              items={[
                { label: 'Gross revenue', value: money(dashboard.gross_totals) },
                { label: 'Estimated earnings', value: money(dashboard.estimated_earnings) },
                { label: 'Average order value', value: money(dashboard.average_order_value) },
                { label: 'Line items', value: count(dashboard.line_item_count) },
                { label: 'Orders', value: count(dashboard.order_count) },
                { label: 'Platform fees', value: money(platformFees) },
              ]}
            />
          </SectionCard>

          <SectionCard title='Revenue by scope' description='Breakdown across sources'>
            {scopes.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {isLoading ? 'Loading…' : 'No revenue recorded for this period.'}
              </p>
            ) : (
              <ul className='divide-y divide-border/60'>
                {scopes.map((scope, index) => (
                  <li
                    key={`${scope.scope}-${index}`}
                    className='flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium text-foreground'>
                        {scope.scope ?? 'Unknown'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {count(scope.units_sold)} units · {count(scope.line_item_count)} line items
                      </p>
                    </div>
                    <span className='shrink-0 text-sm font-semibold tabular-nums text-foreground'>
                      {money(scope.gross_totals)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title='Payables to instructors'
          description='What your organisation owes instructors for delivered class sessions'
        >
          <div className='mb-4'>
            <StatCard
              label='Total owed to instructors'
              value={amount(totalOwed)}
              icon={HandCoins}
              tone='warning'
            />
          </div>
          {payablesQuery.isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading…</p>
          ) : payables.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Nothing owed yet — payables accrue as instructors complete class sessions.
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                    <th className='py-2 pr-3 font-medium'>Instructor</th>
                    <th className='py-2 pr-3 font-medium'>Classes</th>
                    <th className='py-2 pr-3 font-medium'>Sessions delivered</th>
                    <th className='py-2 pr-3 text-right font-medium'>Amount owed</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map(payable => (
                    <tr key={payable.instructor_uuid} className='border-b border-border/40'>
                      <td className='py-2.5 pr-3 font-medium text-foreground'>
                        {instructorName(payable.instructor_uuid)}
                      </td>
                      <td className='py-2.5 pr-3 tabular-nums text-muted-foreground'>
                        {count(payable.class_count)}
                      </td>
                      <td className='py-2.5 pr-3 tabular-nums text-muted-foreground'>
                        {count(payable.session_count)}
                      </td>
                      <td className='py-2.5 pr-3 text-right font-semibold tabular-nums text-foreground'>
                        {amount(payable.amount_owed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
