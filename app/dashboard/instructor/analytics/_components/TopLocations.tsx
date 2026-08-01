'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from './useInstructorAnalyticsData';

export function TopLocations({ handleViewTopLocations }: { handleViewTopLocations?: () => void }) {
  const { locations, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className='bg-card border-border h-full rounded-xl border p-3 shadow-sm sm:p-4'>
        <div className='text-muted-foreground flex h-40 items-center justify-center text-sm'>
          Loading location analytics...
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <EmptyState
        icon={() => null}
        title='No locations yet'
        description='Your top locations will update once sessions are added.'
        variant='card'
      />
    );
  }

  return (
    <div className='bg-card border-border h-full rounded-xl border p-3 shadow-sm sm:p-4'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h3 className='text-foreground text-xs font-semibold sm:text-sm'>
          Top Locations by Sessions
        </h3>
        <button
          onClick={handleViewTopLocations}
          className='text-primary hover:text-primary/80 shrink-0 text-xs whitespace-nowrap transition-colors'
        >
          View Report
        </button>
      </div>

      <div className='space-y-3'>
        {locations.map(({ name, sessions, pct }) => (
          <div key={name}>
            <div className='mb-1 flex items-center justify-between gap-2'>
              <span className='text-muted-foreground truncate text-xs'>{name}</span>
              <span className='text-foreground shrink-0 text-xs font-semibold'>
                {sessions} <span className='text-muted-foreground font-normal'>({pct}%)</span>
              </span>
            </div>

            <div className='bg-muted h-2 w-full rounded-full'>
              <div
                className='bg-primary/90 h-2 rounded-full transition-all duration-500'
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
