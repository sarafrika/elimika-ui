'use client';

import { useQuery } from '@tanstack/react-query';
import { Coins, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { extractEntity } from '@/lib/api-helpers';
import type { RevenueAmountDto, RevenueDashboardDto } from '@/services/client';
import {
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

export default function OrganisationRevenuePage() {
  const dashboardQuery = useQuery({
    ...getRevenueDashboardOptions({ query: { domain: 'organisation_user' } }),
  });

  const platformFeesQuery = useQuery({
    ...getPlatformFeeSummaryOptions(),
  });

  const dashboard = extractEntity<RevenueDashboardDto>(dashboardQuery.data) ?? {};
  const platformFees = (platformFeesQuery.data?.data ?? []) as RevenueAmountDto[];
  const isLoading = dashboardQuery.isLoading;

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
      </div>
    </div>
  );
}
