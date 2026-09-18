'use client';

import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SectionCard } from '@/app/dashboard/admin/_components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SchedulingConflict } from '@/lib/scheduling-conflicts';
import { cn } from '@/lib/utils';
import {
  scheduleSummary,
  sessionTimeRange,
} from '@/src/features/organisation/jobs/lib/job-stage';

import { ReadinessChip } from '../components/readiness-chip';
import { clashesBySession, clashReason, hoursLabel, type JobFacts, sessionDate } from '../job-facts';

const FIRST_ROWS = 6;

export type ScheduleFit = { checking: boolean; checked: boolean; conflicts: SchedulingConflict[] };

/** Every session with its fit against the instructor's calendar, clashes first to hand. */
export function SchedulePanel({
  facts,
  fit,
  clashesOnly,
  onClashesOnlyChange,
}: {
  facts: JobFacts;
  fit: ScheduleFit;
  clashesOnly: boolean;
  onClashesOnlyChange: (clashesOnly: boolean) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const clashes = useMemo(
    () => clashesBySession(facts.windows, fit.conflicts),
    [facts.windows, fit.conflicts]
  );
  const total = facts.sessionCount;
  const clashCount = clashes.size;
  const narrowed = clashesOnly && clashCount > 0;
  const rows = facts.windows
    .map((window, index) => ({ window, index, clash: clashes.get(index) }))
    .filter(row => !narrowed || row.clash);
  const visible = showAll || narrowed ? rows : rows.slice(0, FIRST_ROWS);

  const fitChip = fit.checking ? (
    <Skeleton className='h-6.5 w-36 rounded-full' />
  ) : !fit.checked ? null : clashCount > 0 ? (
    <ReadinessChip label={`${clashCount} of ${total} sessions clash`} tone='danger' />
  ) : (
    <ReadinessChip
      label={total === 1 ? 'The session is free' : `All ${total} sessions free`}
      tone='success'
    />
  );

  return (
    <SectionCard
      title='Schedule'
      description={`${scheduleSummary(facts.windows)}.`}
      actions={fitChip}
      bodyClassName='p-0'
    >
      {clashCount > 0 ? (
        <div className='border-border/60 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3'>
          <p className='text-destructive text-sm font-medium'>
            Free {clashCount === 1 ? 'this session' : `these ${clashCount} sessions`} in your
            calendar, or pass on this job.
          </p>
          <div role='group' aria-label='Sessions to show' className='bg-muted flex gap-0.5 rounded-lg p-0.5'>
            {[
              { value: false, label: 'All sessions' },
              { value: true, label: 'Clashes only' },
            ].map(option => (
              <button
                key={option.label}
                type='button'
                aria-pressed={clashesOnly === option.value}
                onClick={() => onClashesOnlyChange(option.value)}
                className={cn(
                  'focus-visible:ring-ring/50 rounded-md px-3 py-1 text-sm outline-none focus-visible:ring-[3px]',
                  clashesOnly === option.value
                    ? 'bg-background text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {total === 0 ? (
        <p className='text-muted-foreground px-5 py-6 text-sm'>
          The organisation hasn’t scheduled any sessions yet.
        </p>
      ) : (
        <ol aria-label='Sessions'>
          {visible.map(({ window, index, clash }) => (
            <li
              key={window.start.toISOString()}
              className={cn(
                'border-border/60 grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b px-5 py-2.5 text-sm sm:grid-cols-[28px_120px_150px_64px_minmax(0,1fr)]',
                clash && 'bg-destructive/5'
              )}
            >
              <span className='text-muted-foreground font-mono text-[13px]'>{index + 1}</span>
              <span className='text-foreground font-medium'>{sessionDate(window)}</span>
              <span className='text-muted-foreground font-mono max-sm:col-start-2 max-sm:row-start-2'>
                {sessionTimeRange(window)}
              </span>
              <Badge
                variant='outline'
                className='border-primary/30 bg-primary/10 text-primary justify-self-start rounded-md max-sm:col-start-3 max-sm:row-start-1'
              >
                {hoursLabel((window.end.getTime() - window.start.getTime()) / 3_600_000)}
              </Badge>
              <span
                className={cn(
                  'text-[13px] font-medium max-sm:col-span-2 max-sm:col-start-2',
                  clash ? 'text-destructive' : 'text-success'
                )}
              >
                {clash ? clashReason(clash) : fit.checked ? 'Free' : ''}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className='flex flex-wrap items-center justify-between gap-2 px-5 py-3'>
        {!narrowed && rows.length > FIRST_ROWS ? (
          <Button variant='ghost' size='sm' onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
            {showAll ? 'Show fewer' : `Show all ${rows.length} sessions`}
            <ChevronDown aria-hidden className={cn('transition-transform', showAll && 'rotate-180')} />
          </Button>
        ) : (
          <span />
        )}
        <p className='text-muted-foreground text-[13px]'>
          Applying pencils these sessions in. They’re only blocked if you’re hired.
        </p>
      </div>
    </SectionCard>
  );
}
