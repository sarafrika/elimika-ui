'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from './useInstructorAnalyticsData';

export function SatisfactionDistribution({
  handleViewSatisfactionDistribution,
}: {
  handleViewSatisfactionDistribution?: () => void;
}) {
  const { satisfactionBuckets, reviewCount, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className='bg-card border-border h-full rounded-xl border p-3 shadow-sm sm:p-4'>
        <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>
          Loading satisfaction metrics...
        </div>
      </div>
    );
  }

  if (reviewCount === 0) {
    return (
      <EmptyState
        icon={() => null}
        title='No review data yet'
        description='Instructor satisfaction will appear once learners submit reviews.'
        variant='card'
      />
    );
  }

  return (
    <div className='bg-card border-border h-full rounded-xl border p-3 shadow-sm sm:p-4'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h3 className='text-foreground text-xs font-semibold sm:text-sm'>
          Satisfaction Distribution
        </h3>
        <button
          onClick={handleViewSatisfactionDistribution}
          className='text-primary hover:text-primary/80 shrink-0 text-xs whitespace-nowrap transition-colors'
        >
          View Report
        </button>
      </div>

      <div className='space-y-3'>
        {satisfactionBuckets.map(({ label, pct, color }) => (
          <div key={label}>
            <div className='mb-1 flex items-center justify-between gap-2'>
              <span className='text-muted-foreground truncate text-xs'>{label}</span>
              <span className='text-foreground shrink-0 text-xs font-semibold'>{pct}%</span>
            </div>
            <div className='bg-muted h-2 w-full rounded-full'>
              <div
                className={`${color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
