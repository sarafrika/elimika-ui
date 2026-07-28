'use client';

import { useQuery } from '@tanstack/react-query';
import { Coins, HandCoins, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { KpiCard, KpiCardSkeleton } from '@/components/dashboard';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { OrgPage } from '../_components/org-page';

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

/** A labelled figure inside the totals card. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

export default function OrganisationEarningsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const dashboardQuery = useQuery({
    ...getRevenueDashboardOptions({ query: { domain: 'organisation_user' } }),
  });
  const platformFeesQuery = useQuery({ ...getPlatformFeeSummaryOptions() });
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

  const kpis = [
    { label: 'Gross revenue', value: money(dashboard.gross_totals), icon: Coins, variant: 'green' as const },
    {
      label: 'Estimated earnings',
      value: money(dashboard.estimated_earnings),
      icon: TrendingUp,
      variant: 'primary' as const,
    },
    { label: 'Orders', value: count(dashboard.order_count), icon: ShoppingCart, variant: 'indigo' as const },
    { label: 'Units sold', value: count(dashboard.units_sold), icon: Receipt, variant: 'amber' as const },
  ];

  const scopes = dashboard.scope_breakdown ?? [];

  return (
    <OrgPage className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Sales, earnings and platform fees for your organisation."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? kpis.map(kpi => <KpiCardSkeleton key={kpi.label} />)
          : kpis.map(kpi => (
              <KpiCard
                key={kpi.label}
                title={kpi.label}
                value={kpi.value}
                icon={<kpi.icon className="h-5 w-5" />}
                variant={kpi.variant}
              />
            ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Totals</h2>
              <p className="text-sm text-muted-foreground">Aggregate performance for the period</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Gross revenue" value={money(dashboard.gross_totals)} />
              <Stat label="Estimated earnings" value={money(dashboard.estimated_earnings)} />
              <Stat label="Average order value" value={money(dashboard.average_order_value)} />
              <Stat label="Line items" value={count(dashboard.line_item_count)} />
              <Stat label="Orders" value={count(dashboard.order_count)} />
              <Stat label="Platform fees" value={money(platformFees)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Revenue by scope</h2>
              <p className="text-sm text-muted-foreground">Breakdown across sources</p>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : scopes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revenue recorded for this period.</p>
            ) : (
              <ul className="divide-y">
                {scopes.map((scope, index) => (
                  <li
                    key={`${scope.scope}-${index}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {scope.scope ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {count(scope.units_sold)} units · {count(scope.line_item_count)} line items
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {money(scope.gross_totals)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Payables to instructors</h2>
            <p className="text-sm text-muted-foreground">
              What your organisation owes instructors for delivered class sessions
            </p>
          </div>

          <KpiCard
            title="Total owed to instructors"
            value={amount(totalOwed)}
            icon={<HandCoins className="h-5 w-5" />}
            variant="amber"
          />

          {payablesQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payables.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing owed yet — payables accrue as instructors complete class sessions.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Instructor</TableHead>
                    <TableHead className="whitespace-nowrap">Classes</TableHead>
                    <TableHead className="whitespace-nowrap">Sessions delivered</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Amount owed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.map(payable => (
                    <TableRow key={payable.instructor_uuid}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {instructorName(payable.instructor_uuid)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {count(payable.class_count)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {count(payable.session_count)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {amount(payable.amount_owed)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </OrgPage>
  );
}
