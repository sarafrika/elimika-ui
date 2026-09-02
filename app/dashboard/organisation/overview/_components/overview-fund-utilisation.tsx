'use client';

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { FundUtilizationChart, type FundUtilizationPoint } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { localDate } from '@/lib/date';
import {
  getMonthlySettlementsOptions,
  getRevenueDashboardOptions,
  listSourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';

const MONTHS = 6;

const CURRENCY_PREFIXES: Record<string, string> = {
  KES: 'KSh ',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const sumAmounts = (list?: Array<{ amount?: number }> | null) =>
  (list ?? []).reduce((acc, entry) => acc + Number(entry?.amount ?? 0), 0);

/**
 * Fund utilisation for the organisation: money in (gross enrolment revenue + skills-fund
 * source contributions) versus money out (settled instructor payouts), bucketed by month
 * over the trailing window. Reuses the revenue-dashboard and skills-fund source hooks and
 * the org monthly-settlements payout endpoint; renders the chart's empty state when there
 * has been no fund movement.
 */
export function OverviewFundUtilisation() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  const { windowStart, startParam, endParam } = useMemo(() => {
    const now = new Date();
    const ws = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1);
    return { windowStart: ws, startParam: localDate(ws), endParam: localDate(now) };
  }, []);

  const revenueQuery = useQuery({
    ...getRevenueDashboardOptions({
      query: { domain: 'organisation_user', start_date: startParam, end_date: endParam },
    }),
    enabled,
  });

  const sourcesQuery = useQuery({
    ...listSourcesOptions({ path: { organisationUuid } }),
    enabled,
  });

  const payoutsQuery = useQuery({
    ...getMonthlySettlementsOptions({ path: { organisationUuid }, query: { months: MONTHS } }),
    enabled,
  });

  const { data, currencyPrefix } = useMemo(() => {
    const inByMonth = new Map<string, number>();
    const outByMonth = new Map<string, number>();
    let currencyCode = '';

    // Money in — gross enrolment revenue per day, bucketed by month.
    for (const point of revenueQuery.data?.data?.daily_series ?? []) {
      if (!point.date) continue;
      const key = monthKeyOf(new Date(point.date));
      inByMonth.set(key, (inByMonth.get(key) ?? 0) + sumAmounts(point.gross_totals));
      if (!currencyCode) currencyCode = point.gross_totals?.[0]?.currency_code ?? '';
    }

    // Money in — skills-fund source contributions, bucketed by the month recorded.
    for (const source of sourcesQuery.data?.data ?? []) {
      if (!source.created_date) continue;
      const key = monthKeyOf(new Date(source.created_date));
      inByMonth.set(key, (inByMonth.get(key) ?? 0) + Number(source.amount ?? 0));
      if (!currencyCode) currencyCode = source.currency_code ?? '';
    }

    // Money out — settled instructor payouts per month.
    for (const point of payoutsQuery.data?.data ?? []) {
      if (!point.month) continue;
      outByMonth.set(point.month, (outByMonth.get(point.month) ?? 0) + Number(point.amount ?? 0));
      if (!currencyCode) currencyCode = point.currency_code ?? '';
    }

    const points: FundUtilizationPoint[] = [];
    for (let i = 0; i < MONTHS; i++) {
      const d = new Date(windowStart.getFullYear(), windowStart.getMonth() + i, 1);
      const key = monthKeyOf(d);
      points.push({
        month: SHORT_MONTHS[d.getMonth()] ?? key,
        allocated: Math.round(inByMonth.get(key) ?? 0),
        spent: Math.round(outByMonth.get(key) ?? 0),
      });
    }

    const hasActivity = points.some(p => p.allocated > 0 || p.spent > 0);
    const prefix =
      CURRENCY_PREFIXES[currencyCode] ?? (currencyCode ? `${currencyCode} ` : 'KSh ');
    return { data: hasActivity ? points : [], currencyPrefix: prefix };
  }, [revenueQuery.data, sourcesQuery.data, payoutsQuery.data, windowStart]);

  return <FundUtilizationChart data={data} currencyPrefix={currencyPrefix} />;
}
