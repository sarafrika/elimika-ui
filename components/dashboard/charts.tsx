'use client';

import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/lib/utils';

/**
 * Recharts-based dashboard charts ported from the Lovable design. Each one is a
 * pure presentational component that consumes its `data` via props — containers
 * map backend aggregates into these shapes and render a graceful empty state
 * (no fabricated data) when there is nothing to show.
 */

const chartHeight = 'h-[240px] w-full sm:h-[280px] 2xl:h-[340px]';

const tooltipContentStyle = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-foreground)',
} as const;

const axisTick = { fontSize: 12, fill: 'var(--color-muted-foreground)' } as const;

function ChartEmpty({ label = 'No data yet', className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center text-muted-foreground',
        chartHeight,
        className
      )}
    >
      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted'>
        <BarChart3 className='h-5 w-5' />
      </div>
      <p className='text-sm'>{label}</p>
    </div>
  );
}

export interface FundUtilizationPoint {
  month: string;
  allocated: number;
  spent: number;
}

export function FundUtilizationChart({
  data,
  currencyPrefix = '$',
}: {
  data: FundUtilizationPoint[];
  currencyPrefix?: string;
}) {
  if (!data.length) return <ChartEmpty label='No fund activity yet' />;
  return (
    <div className={chartHeight}>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--color-border)' />
          <XAxis dataKey='month' axisLine={false} tickLine={false} tick={axisTick} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            tickFormatter={value => `${currencyPrefix}${value / 1000}K`}
          />
          <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: 'var(--color-muted)' }} />
          <Legend iconType='circle' wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey='allocated' fill='var(--color-chart-1)' radius={[4, 4, 0, 0]} name='Allocated' />
          <Bar dataKey='spent' fill='var(--color-chart-2)' radius={[4, 4, 0, 0]} name='Spent' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface EnrollmentTrendSeries {
  key: string;
  name: string;
  color: string;
}

const defaultEnrollmentSeries: EnrollmentTrendSeries[] = [
  { key: 'stem', name: 'STEM', color: 'var(--color-chart-1)' },
  { key: 'arts', name: 'Arts', color: 'var(--color-chart-4)' },
  { key: 'vocational', name: 'Vocational', color: 'var(--color-chart-3)' },
];

export function EnrollmentTrendsChart({
  data,
  series = defaultEnrollmentSeries,
}: {
  data: Array<Record<string, string | number>>;
  series?: EnrollmentTrendSeries[];
}) {
  if (!data.length) return <ChartEmpty label='No enrolment history yet' />;
  return (
    <div className={chartHeight}>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--color-border)' />
          <XAxis dataKey='month' axisLine={false} tickLine={false} tick={axisTick} />
          <YAxis axisLine={false} tickLine={false} tick={axisTick} />
          <Tooltip contentStyle={tooltipContentStyle} />
          <Legend iconType='circle' wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {series.map(s => (
            <Line
              key={s.key}
              type='monotone'
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={3}
              dot={false}
              name={s.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface TodayGrowthPoint {
  hour: string;
  enrollments: number;
  disbursements: number;
}

export function TodayGrowthChart({ data }: { data: TodayGrowthPoint[] }) {
  if (!data.length) return <ChartEmpty label='No activity recorded today' />;
  return (
    <div className={cn(chartHeight, 'sm:h-[240px] 2xl:h-[300px]')}>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--color-border)' />
          <XAxis dataKey='hour' axisLine={false} tickLine={false} tick={axisTick} />
          <YAxis axisLine={false} tickLine={false} tick={axisTick} />
          <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: 'var(--color-muted)' }} />
          <Legend iconType='circle' wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey='enrollments' fill='var(--color-chart-1)' radius={[4, 4, 0, 0]} name='Enrolments' />
          <Bar
            dataKey='disbursements'
            fill='var(--color-chart-2)'
            radius={[4, 4, 0, 0]}
            name='Disbursements'
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
