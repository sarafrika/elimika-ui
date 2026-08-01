'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from '../useInstructorAnalyticsData';

export function DonutChart({
  breakdown,
}: {
  breakdown: Array<{ value: number; pct: number; color: string }>;
}) {
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const total = breakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <svg viewBox='0 0 120 120' className='mx-auto h-28 w-28 shrink-0 sm:h-32 sm:w-32'>
      {breakdown.map(({ pct, color }, i) => {
        const dash = (pct / 100) * circumference;
        const gap = circumference - dash;
        const rotation = (offset / 100) * 360 - 90;

        offset += pct;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke='currentColor'
            strokeWidth='18'
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            className={`${color} transition-all duration-500`}
          />
        );
      })}

      <text
        x={cx}
        y={cy - 5}
        textAnchor='middle'
        fontSize='16'
        fontWeight='700'
        className='fill-foreground'
      >
        {total}
      </text>

      <text x={cx} y={cy + 10} textAnchor='middle' fontSize='7' className='fill-muted-foreground'>
        Total Sessions
      </text>
    </svg>
  );
}

export function StatusBreakdown({
  handleViewStatusBreakdown,
}: {
  handleViewStatusBreakdown?: () => void;
}) {
  const { statusBreakdown, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className='border-border bg-card h-full animate-pulse rounded-xl border p-3 shadow-sm sm:p-4'>
        {/* Header skeleton */}
        <div className='mb-3 flex items-center justify-between'>
          <div className='bg-muted h-3 w-36 rounded' />
          <div className='bg-muted h-3 w-20 rounded' />
        </div>

        {/* Donut skeleton */}
        <div className='flex justify-center'>
          <div className='bg-muted/40 relative h-28 w-28 rounded-full sm:h-32 sm:w-32'>
            {/* fake ring segments */}
            <div className='border-muted/60 absolute inset-0 rounded-full border-8' />
            <div className='bg-card absolute inset-4 rounded-full' />

            {/* center text skeleton */}
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-1'>
              <div className='bg-muted h-4 w-10 rounded' />
              <div className='bg-muted h-2 w-20 rounded' />
            </div>
          </div>
        </div>

        {/* Legend skeleton */}
        <div className='mt-3 space-y-1.5'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex items-center justify-between gap-2'>
              {/* label */}
              <div className='flex min-w-0 flex-1 items-center gap-1.5'>
                <div className='bg-muted h-2.5 w-2.5 shrink-0 rounded-full' />
                <div className='bg-muted h-3 w-24 rounded' />
              </div>

              {/* value */}
              <div className='bg-muted h-3 w-16 shrink-0 rounded' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (statusBreakdown.length === 0) {
    return (
      <EmptyState
        icon={() => null}
        title='No session statuses yet'
        description='Status breakdown appears once your sessions are scheduled and completed.'
        variant='card'
      />
    );
  }

  return (
    <div className='border-border bg-card h-full rounded-xl border p-3 shadow-sm sm:p-4'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h3 className='text-foreground text-xs font-semibold sm:text-sm'>Status Breakdown</h3>

        <button
          onClick={handleViewStatusBreakdown}
          className='text-primary shrink-0 text-xs whitespace-nowrap transition-colors hover:opacity-80'
        >
          View Report
        </button>
      </div>

      <DonutChart breakdown={statusBreakdown} />

      <div className='mt-3 space-y-1.5'>
        {statusBreakdown.map(({ label, value, pct, color }) => (
          <div key={label} className='flex items-center justify-between gap-2'>
            <div className='flex min-w-0 items-center gap-1.5'>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.replace('text-', 'bg-')}`}
              />

              <span className='text-muted-foreground truncate text-xs'>{label}</span>
            </div>

            <span className='text-foreground shrink-0 text-xs font-semibold'>
              {value} <span className='text-muted-foreground font-normal'>({pct}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
