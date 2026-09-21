'use client';

import { BookOpen, CalendarClock, Receipt, TrendingUp } from 'lucide-react';

import {
  SectionCard,
  SectionCardSkeleton,
  StatCard,
  StatCardSkeleton,
  surfaceTheme,
} from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import type { RevenueAmountDto, RevenueTimeSeriesPointDto } from '@/services/client';
import { MoneyList, formatMoney } from '../components/money-list';
import { SectionBoundary } from '../components/section-boundary';
import { REVENUE_RANGES, type RevenueRange, useRevenue } from '../hooks/use-revenue';
import { enumParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const rangeParam = enumParam<RevenueRange>(['7d', '30d', '90d', '12m'], '30d');

/** The currency with the largest total, used to draw a single readable trend line. */
function leadCurrency(points: RevenueTimeSeriesPointDto[]): string | undefined {
  const totals = new Map<string, number>();
  for (const point of points) {
    for (const amount of point.gross_totals ?? []) {
      if (!amount.currency_code) continue;
      totals.set(amount.currency_code, (totals.get(amount.currency_code) ?? 0) + (amount.amount ?? 0));
    }
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const amountIn = (amounts: RevenueAmountDto[] | undefined, currency?: string) =>
  amounts?.find(entry => entry.currency_code === currency)?.amount ?? 0;

export function RevenuePage() {
  const [range, setRange] = useSearchState('range', rangeParam);
  const { dashboard, fees, start, end, dashboardQuery, feesQuery } = useRevenue(range);

  const series = dashboard?.daily_series ?? [];
  const currency = leadCurrency(series);

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Finance'
          title='Revenue'
          description={`Captured sales between ${formatDate(start)} and ${formatDate(end)}.`}
          actions={
            <div className='border-border/70 flex overflow-hidden rounded-md border'>
              {REVENUE_RANGES.map(option => (
                <Button
                  key={option.value}
                  variant='ghost'
                  size='sm'
                  aria-pressed={range === option.value}
                  className={cn(
                    'rounded-none',
                    range === option.value && 'bg-primary/10 text-primary font-semibold'
                  )}
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          }
        />

        <SectionBoundary
          label='the revenue figures'
          loading={dashboardQuery.isLoading && !dashboardQuery.data}
          error={dashboardQuery.error}
          onRetry={dashboardQuery.refetch}
          skeleton={
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              {[0, 1, 2, 3].map(item => (
                <StatCardSkeleton key={item} />
              ))}
            </div>
          }
        >
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              label='Gross sales'
              value={<MoneyList amounts={dashboard?.gross_totals} />}
              icon={TrendingUp}
              hint='Captured lines only'
            />
            <StatCard
              label='Platform fees'
              value={
                <SectionBoundary
                  label='the fee summary'
                  loading={feesQuery.isLoading && !feesQuery.data}
                  error={feesQuery.error}
                  onRetry={feesQuery.refetch}
                  skeleton={<span className='text-muted-foreground text-sm'>Loading…</span>}
                >
                  <MoneyList amounts={fees} />
                </SectionBoundary>
              }
              icon={Receipt}
              tone='warning'
            />
            <StatCard
              label='Estimated earnings'
              value={<MoneyList amounts={dashboard?.estimated_earnings} />}
              icon={BookOpen}
              hint='Equals gross sales on the admin view'
            />
            <StatCard
              label='Orders'
              value={toNumber(dashboard?.order_count)}
              icon={CalendarClock}
              hint={`${toNumber(dashboard?.units_sold)} unit(s) · ${toNumber(
                dashboard?.line_item_count
              )} line(s)`}
            />
          </div>
        </SectionBoundary>

        <div className='grid gap-4 lg:grid-cols-3'>
          <SectionCard
            className='lg:col-span-2'
            title='Daily gross sales'
            description={
              currency ? `Plotted in ${currency}, the busiest currency in this range.` : undefined
            }
          >
            <SectionBoundary
              label='the trend'
              loading={dashboardQuery.isLoading && !dashboardQuery.data}
              error={dashboardQuery.error}
              empty={series.length === 0}
              onRetry={dashboardQuery.refetch}
              skeleton={<SectionCardSkeleton rows={4} withHeader={false} />}
              emptyTitle='Nothing captured yet'
              emptyDescription='No orders were captured in this range.'
            >
              <TrendChart points={series} currency={currency} />
            </SectionBoundary>
          </SectionCard>

          <SectionCard title='By scope' description='Courses against classes.'>
            <SectionBoundary
              label='the scope split'
              loading={dashboardQuery.isLoading && !dashboardQuery.data}
              error={dashboardQuery.error}
              empty={(dashboard?.scope_breakdown ?? []).length === 0}
              onRetry={dashboardQuery.refetch}
              emptyTitle='No breakdown yet'
              emptyDescription='Captured sales are split by scope once there are some.'
            >
              <ul className='flex flex-col gap-3'>
                {(dashboard?.scope_breakdown ?? []).map(entry => (
                  <li
                    key={entry.scope}
                    className='border-border/60 flex items-start justify-between gap-3 rounded-md border px-3 py-2.5'
                  >
                    <div className='min-w-0'>
                      <p className='text-foreground text-sm font-medium'>{entry.scope ?? '—'}</p>
                      <p className='text-muted-foreground text-xs'>
                        {toNumber(entry.units_sold)} unit(s) · {toNumber(entry.line_item_count)}{' '}
                        line(s)
                      </p>
                    </div>
                    <MoneyList amounts={entry.gross_totals} className='items-end text-right' />
                  </li>
                ))}
              </ul>
            </SectionBoundary>
            <p className='text-muted-foreground mt-3 text-xs'>
              Scope is the only breakdown the revenue API returns. What each instructor,
              creator or organisation earned is not in it.
            </p>
          </SectionCard>
        </div>

        <p className='text-muted-foreground text-xs'>
          Only captured lines count. An order that is pending or failed appears in Sales &amp;
          payments but not in these totals.
        </p>
      </div>
    </div>
  );
}

/** A plain line chart. Tokens only, no chart library, no invented points. */
function TrendChart({
  points,
  currency,
}: {
  points: RevenueTimeSeriesPointDto[];
  currency?: string;
}) {
  const width = 640;
  const height = 180;
  const padding = 8;

  const values = points.map(point => amountIn(point.gross_totals, currency));
  const max = Math.max(...values, 1);
  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coordinates = values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = coordinates.join(' ');
  const area = `${padding},${height - padding} ${line} ${(padding + (points.length - 1) * step).toFixed(1)},${height - padding}`;
  const peak = points[values.indexOf(Math.max(...values))];

  return (
    <div className='flex flex-col gap-2'>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className='h-44 w-full'
        role='img'
        aria-label={`Daily gross sales, peaking at ${formatMoney(Math.max(...values), currency)}`}
      >
        <polygon points={area} className='fill-primary/10' />
        <polyline
          points={line}
          fill='none'
          className='stroke-primary'
          strokeWidth={2}
          strokeLinejoin='round'
          strokeLinecap='round'
        />
      </svg>
      <div className='text-muted-foreground flex justify-between text-xs'>
        <span>{formatDate(points[0]?.date) || '—'}</span>
        {peak ? (
          <span>
            Peak {formatDate(peak.date)} · {formatMoney(Math.max(...values), currency)}
          </span>
        ) : null}
        <span>{formatDate(points[points.length - 1]?.date) || '—'}</span>
      </div>
    </div>
  );
}
