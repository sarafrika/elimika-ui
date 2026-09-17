'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** One option in a radio-card group; `children` sits outside the radio so it can hold buttons. */
export function ChoiceCard({
  title,
  description,
  aside,
  selected,
  disabled = false,
  onSelect,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'has-[button[role=radio]:focus-visible]:ring-ring/50 flex min-w-0 flex-col gap-2 rounded-lg border p-3 transition-colors has-[button[role=radio]:focus-visible]:ring-[3px]',
        selected
          ? 'border-primary bg-primary/5 ring-primary/25 ring-2'
          : disabled
            ? 'border-border bg-muted/30'
            : 'border-border hover:border-primary/40',
        className
      )}
    >
      <button
        type='button'
        role='radio'
        aria-checked={selected}
        disabled={disabled}
        onClick={onSelect}
        className='flex min-w-0 flex-col items-start gap-1 text-left outline-none disabled:cursor-not-allowed'
      >
        <span className='flex w-full min-w-0 items-center gap-2'>
          <span
            aria-hidden
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
              selected ? 'border-primary' : 'border-muted-foreground/40'
            )}
          >
            {selected ? <span className='bg-primary size-2 rounded-full' /> : null}
          </span>
          <span
            className={cn(
              'text-sm leading-tight font-medium',
              disabled && !selected ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {title}
          </span>
          {aside}
        </span>
        {description ? (
          <span className='text-muted-foreground pl-6 text-xs leading-snug'>{description}</span>
        ) : null}
      </button>
      {children}
    </div>
  );
}
