'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { APPLY_TO_TRAIN_STEPS, type ApplyStepId } from '../types';

export type StepStatus = { done: boolean; errors: number };

/** Horizontal step strip: numbered dots, done checks and error counts once a step was seen. */
export function StepTabs({
  current,
  statuses,
  canOpen,
  onOpen,
}: {
  current: ApplyStepId;
  statuses: Record<ApplyStepId, StepStatus>;
  canOpen: (step: ApplyStepId) => boolean;
  onOpen: (step: ApplyStepId) => void;
}) {
  return (
    <nav
      aria-label='Application steps'
      className='bg-card flex gap-1 overflow-x-auto rounded-2xl border p-1.5 shadow-sm'
    >
      {APPLY_TO_TRAIN_STEPS.map((step, index) => {
        const active = step.id === current;
        const { done, errors } = statuses[step.id];
        return (
          <button
            key={step.id}
            type='button'
            aria-current={active ? 'step' : undefined}
            disabled={!canOpen(step.id)}
            onClick={() => onOpen(step.id)}
            className={cn(
              'flex h-11 flex-[1_0_auto] items-center gap-2.5 rounded-[10px] px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-xs',
                done && 'border-success/20 bg-success/15 text-success',
                active && !done && 'border-primary bg-primary text-primary-foreground'
              )}
            >
              {done ? <Check className='size-3.5' /> : index + 1}
            </span>
            {step.label}
            {errors > 0 ? (
              <span className='bg-destructive text-destructive-foreground rounded-full px-2 text-[11px] font-semibold'>
                {errors}
                <span className='sr-only'> {errors === 1 ? 'issue' : 'issues'}</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
