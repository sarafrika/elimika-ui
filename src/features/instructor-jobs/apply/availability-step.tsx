'use client';

import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { useMemo } from 'react';

import { SectionError } from '@/components/data/async-section';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { SchedulingConflict } from '@/lib/scheduling-conflicts';
import { cn } from '@/lib/utils';
import { sessionTimeRange } from '@/src/features/organisation/jobs/lib/job-stage';

import { clashesBySession, clashReason, type JobFacts, sessionDate } from '../job-facts';

export type AvailabilityCheck = {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  /** Why the application can't go ahead, when it isn't the schedule. */
  blocker: string | null;
};

export function AvailabilityStep({
  facts,
  conflicts,
  check,
  confirmed,
  onConfirmedChange,
}: {
  facts: JobFacts;
  conflicts: SchedulingConflict[];
  check: AvailabilityCheck;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}) {
  const clashes = useMemo(
    () => clashesBySession(facts.windows, conflicts),
    [facts.windows, conflicts]
  );
  const total = facts.sessionCount;
  const clashCount = clashes.size || conflicts.length;

  return (
    <div className='flex flex-col gap-4'>
      {check.error ? (
        <SectionError
          title='Couldn’t check your calendar'
          error={check.error}
          onRetry={check.onRetry}
        />
      ) : check.loading ? (
        <div role='status' className='space-y-2'>
          <Skeleton className='h-12 w-full rounded-md' />
          <span className='sr-only'>Checking your calendar</span>
        </div>
      ) : clashCount > 0 ? (
        <p
          role='alert'
          className='border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm'
        >
          <CircleAlert aria-hidden className='mt-0.5 size-4 shrink-0' />
          <span>
            <strong>
              {clashCount} of {total} session{total === 1 ? '' : 's'} clash
              with your calendar.
            </strong>{' '}
            Free those times, then apply.
          </span>
        </p>
      ) : (
        <p className='border-success/30 bg-success/10 text-foreground flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm'>
          <CircleCheck aria-hidden className='text-success mt-0.5 size-4 shrink-0' />
          <span>
            <strong>
              {total === 1 ? 'The session is' : `All ${total} sessions are`} free in your calendar.
            </strong>{' '}
            Checked just now.
          </span>
        </p>
      )}

      {check.blocker && !check.loading ? (
        <p
          role='alert'
          className='border-warning/40 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm'
        >
          <CircleAlert aria-hidden className='text-warning mt-0.5 size-4 shrink-0' />
          <span>{check.blocker}</span>
        </p>
      ) : null}

      <ul
        aria-label='Sessions on this schedule'
        className='grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4'
      >
        {facts.windows.map((window, index) => {
          const clash = clashes.get(index);
          return (
            <li
              key={window.start.toISOString()}
              className={cn(
                'rounded-md border px-2.5 py-2',
                clash ? 'border-destructive/40 bg-destructive/5' : 'border-border/70 bg-muted/20'
              )}
            >
              <p className='text-foreground text-[13px] font-semibold'>{sessionDate(window)}</p>
              <p className='text-muted-foreground font-mono text-xs'>{sessionTimeRange(window)}</p>
              {clash ? (
                <p className='text-destructive mt-1 text-xs font-medium'>{clashReason(clash)}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className='border-border/70 flex items-start gap-3 rounded-md border px-3.5 py-3'>
        <Checkbox
          id='apply-confirm-schedule'
          checked={confirmed}
          onCheckedChange={value => onConfirmedChange(value === true)}
          className='mt-0.5'
        />
        <Label htmlFor='apply-confirm-schedule' className='block text-sm leading-5 font-normal'>
          <strong className='font-semibold'>I can teach every session on this schedule.</strong> If
          a date stops working, withdraw before you’re hired.
        </Label>
      </div>

      <p className='border-primary/20 bg-primary/5 text-foreground flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm'>
        <Info aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
        <span>
          Applying pencils these sessions into your calendar. They’re only blocked if you’re hired.
        </span>
      </p>
    </div>
  );
}
