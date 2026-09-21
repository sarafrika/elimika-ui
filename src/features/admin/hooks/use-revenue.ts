'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractList } from '@/lib/api-helpers';
import type { RevenueAmountDto, RevenueDashboardDto } from '@/services/client';
import {
  getPlatformFeeSummaryOptions,
  getRevenueDashboard1Options,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';

export type RevenueRange = '7d' | '30d' | '90d' | '12m';

export const REVENUE_RANGES: { value: RevenueRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
];

const DAYS_BACK: Record<RevenueRange, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 };

/**
 * The range is the only thing that varies, so it is the only query-key input. The old
 * console asked for the same figures six times on one page; one range, one request.
 */
export function revenueWindow(range: RevenueRange) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - DAYS_BACK[range]);
  return { start, end };
}

/** Platform revenue for one range, plus the fees collected inside it. */
export function useRevenue(range: RevenueRange) {
  const { start, end } = useMemo(() => revenueWindow(range), [range]);

  const dashboardQuery = useQuery({
    ...getRevenueDashboard1Options({
      query: { domain: 'admin', start_date: start, end_date: end },
    }),
    ...listQuery,
  });

  const feesQuery = useQuery({
    ...getPlatformFeeSummaryOptions({ query: { start_date: start, end_date: end } }),
    ...listQuery,
  });

  const dashboard = useMemo(
    () => extractEntity<RevenueDashboardDto>(dashboardQuery.data),
    [dashboardQuery.data]
  );
  const fees = useMemo(
    () => extractList<RevenueAmountDto>(feesQuery.data),
    [feesQuery.data]
  );

  return { dashboard, fees, start, end, dashboardQuery, feesQuery };
}
