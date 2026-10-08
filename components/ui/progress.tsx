'use client';

import type * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
};

function Progress({ className, value, max = 100, indicatorClassName, ...props }: ProgressProps) {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const amount = value == null ? null : Number.isFinite(value) ? Math.max(0, Math.min(limit, value)) : 0;
  const percentage = ((amount ?? 0) / limit) * 100;
  return (
    <ProgressPrimitive.Root
      data-slot='progress'
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      value={amount}
      max={limit}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot='progress-indicator'
        className={cn('bg-primary h-full transition-[width]', percentage === 0 && 'transition-none', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
