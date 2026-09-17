'use client';

import { Check, Info, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { APPROVAL_REFETCH_INTERVAL_MS } from '@/lib/query-client';
import { cn } from '@/lib/utils';

export type TrackStepState = 'done' | 'current' | 'todo' | 'failed';

export type TrackStep = { title: string; when?: string; state: TrackStepState };

function useMinutesSince(timestamp: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return timestamp ? Math.max(0, Math.floor((now - timestamp) / 60_000)) : null;
}

/** "Where it is": the application's stages, freshness and the next step. */
export function ApplicationTracker({
  steps,
  checkedAt,
  refreshing,
  onRefresh,
  note,
  noteTone = 'info',
}: {
  steps: TrackStep[];
  checkedAt: number;
  refreshing: boolean;
  onRefresh: () => void;
  note?: string | null;
  noteTone?: 'info' | 'danger';
}) {
  const minutes = useMinutesSince(checkedAt);
  const refreshMinutes = Math.round(APPROVAL_REFETCH_INTERVAL_MS / 60_000);
  const checked = minutes === null ? 'not yet' : minutes === 0 ? 'just now' : `${minutes} min ago`;

  return (
    <section
      aria-label='Where this application is'
      className='bg-card space-y-4 rounded-xl border px-5 py-4'
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-foreground text-base font-semibold'>Where it is</h2>
        <p className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs'>
          <RefreshCw aria-hidden className={cn('size-3.5', refreshing && 'animate-spin')} />
          <span aria-live='polite'>
            Checked {checked} · refreshes every {refreshMinutes} minutes
          </span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 px-2'
            onClick={onRefresh}
            disabled={refreshing}
          >
            Refresh now
          </Button>
        </p>
      </div>

      <ol className='grid gap-3 sm:grid-cols-4 sm:gap-0'>
        {steps.map((step, index) => (
          <li
            key={step.title}
            className='relative flex items-start gap-3 sm:flex-col sm:gap-1 sm:pr-3'
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  'absolute top-3.5 right-2 left-9 hidden h-0.5 sm:block',
                  step.state === 'done' ? 'bg-primary' : 'bg-border'
                )}
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                step.state === 'done' && 'border-primary bg-primary text-primary-foreground',
                step.state === 'current' && 'border-primary bg-card text-primary border-2',
                step.state === 'todo' && 'border-border bg-card text-muted-foreground',
                step.state === 'failed' &&
                  'border-destructive bg-destructive text-destructive-foreground'
              )}
            >
              {step.state === 'done' ? (
                <Check aria-hidden className='size-3.5' />
              ) : step.state === 'failed' ? (
                <X aria-hidden className='size-3.5' />
              ) : (
                index + 1
              )}
            </span>
            <span className='min-w-0'>
              <span
                className={cn(
                  'block text-sm',
                  step.state === 'todo'
                    ? 'text-muted-foreground font-medium'
                    : 'text-foreground font-semibold'
                )}
              >
                {step.title}
              </span>
              {step.when ? (
                <span className='text-muted-foreground block text-xs'>{step.when}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      {note ? (
        <p
          className={cn(
            'flex items-start gap-2 rounded-lg border p-3 text-sm',
            noteTone === 'danger'
              ? 'border-destructive/40 bg-destructive/5 text-foreground'
              : 'border-primary/30 bg-primary/5 text-foreground'
          )}
        >
          <Info
            aria-hidden
            className={cn(
              'mt-0.5 size-4 shrink-0',
              noteTone === 'danger' ? 'text-destructive' : 'text-primary'
            )}
          />
          {note}
        </p>
      ) : null}
    </section>
  );
}
