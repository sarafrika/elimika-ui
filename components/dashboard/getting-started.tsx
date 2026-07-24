'use client';

import { Check, Circle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface GettingStartedStep {
  key: string;
  label: string;
  href: string;
  done: boolean;
}

/**
 * Onboarding checklist ported from Lovable. Presentational: the `steps` and
 * their completion come from a container. `onToggleStep` is optional (used only
 * for locally-toggleable checklists).
 */
export function GettingStarted({
  steps,
  title = 'Getting started',
  description = 'Complete the organisation journey',
  onToggleStep,
  className,
}: {
  steps: GettingStartedStep[];
  title?: string;
  description?: string;
  onToggleStep?: (key: string) => void;
  className?: string;
}) {
  const doneCount = steps.filter(s => s.done).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <Card
      className={cn(
        'overflow-hidden border-0 bg-gradient-to-br from-teal-700 via-teal-700 to-primary text-white shadow-sm',
        className
      )}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <CardTitle className='text-base text-white'>{title}</CardTitle>
            <CardDescription className='text-white/70'>{description}</CardDescription>
          </div>
          <span className='rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold'>
            {doneCount}/{steps.length}
          </span>
        </div>
        <Progress value={pct} className='mt-3 h-2 bg-white/20 [&>div]:bg-primary' />
      </CardHeader>
      <CardContent className='space-y-1'>
        {steps.map(step => (
          <div
            key={step.key}
            className='flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-white/10'
          >
            {onToggleStep ? (
              <button
                type='button'
                aria-label={step.done ? 'Mark incomplete' : 'Mark complete'}
                onClick={() => onToggleStep(step.key)}
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  step.done
                    ? 'border-primary bg-primary text-teal-900'
                    : 'border-white/50 text-transparent hover:border-white'
                )}
              >
                {step.done ? <Check className='h-3 w-3' /> : <Circle className='h-3 w-3' />}
              </button>
            ) : (
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  step.done
                    ? 'border-primary bg-primary text-teal-900'
                    : 'border-white/50 text-transparent'
                )}
              >
                {step.done ? <Check className='h-3 w-3' /> : <Circle className='h-3 w-3' />}
              </span>
            )}
            <span
              className={cn('flex-1 text-sm', step.done ? 'text-white/50 line-through' : 'text-white')}
            >
              {step.label}
            </span>
            <Button
              asChild
              variant='ghost'
              size='sm'
              className='h-7 text-xs text-white hover:bg-white/20 hover:text-white'
            >
              <Link href={step.href}>Open</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
