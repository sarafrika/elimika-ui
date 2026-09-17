'use client';

import { Check, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

export type RailStepState = 'current' | 'done' | 'open' | 'locked';

export type RailStep = { title: string; summary: string; state: RailStepState };

/** Steps with their status; finished steps reopen, steps after an unfinished one stay locked. */
export function StepRail({
  steps,
  onSelect,
}: {
  steps: RailStep[];
  onSelect: (index: number) => void;
}) {
  return (
    <nav
      aria-label='Job posting steps'
      className='border-border/70 bg-card rounded-md border p-2 shadow-sm lg:sticky lg:top-4'
    >
      <ol className='flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible'>
        {steps.map((step, index) => (
          <li key={step.title} className='min-w-40 shrink-0 lg:min-w-0'>
            <button
              type='button'
              onClick={() => onSelect(index)}
              disabled={step.state === 'locked'}
              aria-current={step.state === 'current' ? 'step' : undefined}
              className={cn(
                'focus-visible:ring-ring/50 flex w-full items-start gap-2.5 rounded-md p-2.5 text-left transition-colors outline-none focus-visible:ring-[3px]',
                step.state === 'current' ? 'bg-primary/10' : 'hover:bg-muted/60',
                step.state === 'locked' && 'cursor-not-allowed opacity-60 hover:bg-transparent'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  step.state === 'done'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : step.state === 'current'
                      ? 'border-primary text-primary border-2'
                      : 'border-border text-muted-foreground bg-background'
                )}
              >
                {step.state === 'done' ? (
                  <Check className='size-3.5' />
                ) : step.state === 'locked' ? (
                  <Lock className='size-3' />
                ) : (
                  index + 1
                )}
              </span>
              <span className='flex min-w-0 flex-col'>
                <span className='text-foreground text-sm font-semibold'>{step.title}</span>
                <span className='text-muted-foreground min-h-4 truncate text-xs'>
                  {step.state === 'current' ? 'In progress' : step.summary}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
