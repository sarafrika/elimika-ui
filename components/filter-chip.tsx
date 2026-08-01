import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FilterChipRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('scrollbar-hide flex gap-2 overflow-x-auto pb-2', className)}
      {...props}
    />
  )
);
FilterChipRow.displayName = 'FilterChipRow';

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, active = false, type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      data-active={active ? 'true' : 'false'}
      className={cn(
        'focus-visible:ring-ring inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        active
          ? 'border-primary bg-primary text-primary-foreground ring-primary font-semibold shadow-sm ring-2 ring-offset-2'
          : 'border-border bg-card text-foreground hover:bg-muted font-medium',
        className
      )}
      {...props}
    >
      {active && <Check className='h-4 w-4 shrink-0' aria-hidden='true' />}
      {children}
    </button>
  )
);
FilterChip.displayName = 'FilterChip';
