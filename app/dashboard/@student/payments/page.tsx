'use client';

import { useQuery } from '@tanstack/react-query';
import { Coins, Receipt, ShoppingCart, Wallet } from 'lucide-react';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
} from '@/app/dashboard/@admin/_components/ui';
import { extractEntity } from '@/lib/api-helpers';
import type { RevenueAmountDto, RevenueDashboardDto } from '@/services/client';
import { getRevenueDashboardOptions } from '@/services/client/@tanstack/react-query.gen';

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

export default function StudentPaymentsPage() {
  const dashboardQuery = useQuery({
    ...getRevenueDashboardOptions({ query: { domain: 'student' } }),
  });

  const dashboard = extractEntity<RevenueDashboardDto>(dashboardQuery.data) ?? {};
  const isLoading = dashboardQuery.isLoading;
  const scopes = dashboard.scope_breakdown ?? [];

  const kpis = [
    {
      label: 'Total spent',
      value: money(dashboard.gross_totals),
      hint: 'Across all your enrolments',
      icon: Coins,
      tone: 'info' as const,
    },
    {
      label: 'Orders',
      value: count(dashboard.order_count),
      hint: 'Completed purchases',
      icon: ShoppingCart,
      tone: 'neutral' as const,
    },
    {
      label: 'Items bought',
      value: count(dashboard.units_sold),
      hint: 'Courses & classes',
      icon: Receipt,
      tone: 'success' as const,
    },
    {
      label: 'Average order',
      value: money(dashboard.average_order_value),
      hint: 'Per transaction',
      icon: Wallet,
      tone: 'warning' as const,
    },
  ];

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Payments'
          description='Everything you have paid for your learning, in one place.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {isLoading
            ? kpis.map(kpi => <StatCardSkeleton key={kpi.label} />)
            : kpis.map(kpi => (
                <StatCard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  hint={kpi.hint}
                  icon={kpi.icon}
                  tone={kpi.tone}
                />
              ))}
        </div>

        <div className='grid gap-4 xl:grid-cols-2'>
          <SectionCard title='Summary' description='Your spending for this period'>
            <DetailGrid
              items={[
                { label: 'Total spent', value: money(dashboard.gross_totals) },
                { label: 'Average order value', value: money(dashboard.average_order_value) },
                { label: 'Orders', value: count(dashboard.order_count) },
                { label: 'Line items', value: count(dashboard.line_item_count) },
              ]}
            />
          </SectionCard>

          <SectionCard title='Spending by category' description='Where your money went'>
            {scopes.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {isLoading ? 'Loading…' : 'No payments recorded yet.'}
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
                        {count(scope.units_sold)} items · {count(scope.line_item_count)} line items
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
