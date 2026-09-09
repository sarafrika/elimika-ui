'use client';

/**
 * Step 1 — how the applicant would deliver this course.
 *
 * Five formats, any number of them. Hybrid is on the list even though the rate
 * card has no cell for it: an applicant who only offers a mix would otherwise
 * have no way to say so, and the notes carry it to the creator.
 */

import type { Dispatch } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { type ApplyAction, type ApplyState, METHOD_OPTIONS } from './apply-model';

export function StepMethod({
  state,
  dispatch,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
}) {
  return (
    <div className='space-y-3'>
      <p className='text-muted-foreground text-xs'>
        Select all training methods you can offer — you&apos;ll set pricing per method in the
        Pricing step.
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        {METHOD_OPTIONS.map(({ value, title, description, icon: Icon }) => {
          const selected = state.methods.includes(value);
          return (
            <label
              key={value}
              htmlFor={`m-${value}`}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
              )}
            >
              <Checkbox
                id={`m-${value}`}
                checked={selected}
                onCheckedChange={() => dispatch({ type: 'toggleMethod', method: value })}
                className='mt-0.5'
              />
              <div className='flex-1 space-y-1'>
                <div className='flex items-center gap-2'>
                  <Icon className='text-primary h-4 w-4' />
                  <span className='font-medium'>{title}</span>
                </div>
                <p className='text-muted-foreground text-sm'>{description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
