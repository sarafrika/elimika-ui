import { History } from 'lucide-react';

import { SectionCard } from '@/app/dashboard/admin/_components/ui';
import { AsyncSection } from '@/components/data/async-section';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJobApplicationEvent } from '@/services/client';

import { type EventTone, timelineEntry } from '../application-view';

const DOT_TONES: Record<EventTone, string> = {
  brand: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  muted: 'bg-muted-foreground/50',
};

function ActivitySkeleton() {
  return (
    <div className='space-y-5' aria-hidden>
      {[0, 1, 2].map(item => (
        <div key={item} className='grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3'>
          <Skeleton className='mx-auto mt-1 size-3 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-3 w-56' />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Every event on the application, newest first, as the API returns them. */
export function ApplicationActivity({
  events,
  loading,
  error,
  onRetry,
}: {
  events: ClassMarketplaceJobApplicationEvent[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const entries = events.map(timelineEntry);
  const last = entries.length - 1;

  return (
    <SectionCard title='Activity' description='Every move on this application, newest first.'>
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        errorTitle='Couldn’t load the activity'
        skeleton={<ActivitySkeleton />}
        empty={entries.length === 0}
        emptyState={
          <EmptyState
            variant='compact'
            icon={History}
            title='No activity yet'
            description='Each step on this application will be listed here.'
          />
        }
      >
        <ol className='flex flex-col'>
          {entries.map((entry, index) => (
            <li key={entry.key} className='grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3'>
              <div aria-hidden className='flex flex-col items-center'>
                <span
                  className={cn('mt-1.5 size-3 shrink-0 rounded-full', DOT_TONES[entry.tone])}
                />
                {index < last ? <span className='bg-border mt-1 w-0.5 flex-1' /> : null}
              </div>
              <div className={cn('min-w-0 space-y-2', index < last && 'pb-5')}>
                <div>
                  <p className='text-foreground font-semibold'>{entry.title}</p>
                  <p className='text-muted-foreground text-sm'>
                    {[
                      entry.date,
                      entry.interview ? `for ${entry.interview}` : null,
                      entry.actor ? `by ${entry.actor}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {entry.note ? (
                  <blockquote className='border-border/70 bg-muted/40 text-muted-foreground rounded-md border px-3 py-2 text-sm break-words whitespace-pre-wrap'>
                    “{entry.note}”
                  </blockquote>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </AsyncSection>
    </SectionCard>
  );
}
