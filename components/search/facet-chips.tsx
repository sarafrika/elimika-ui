'use client';

import { X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type FacetOption = {
  value: string;
  label: string;
  /** Hits with this value, from the search response's `facets`. */
  count?: number;
};

/**
 * One facet group as toggle chips. Meilisearch counts facets with every filter applied,
 * including this group's own, so once an option is selected the others would read zero:
 * counts are shown only while nothing in the group is selected.
 */
export function FacetChips({
  label,
  options,
  selected,
  onChange,
  multiple = true,
  hideEmpty = false,
  className,
}: {
  label: string;
  options: FacetOption[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  /** Drop options whose count is zero (only while counts are shown). */
  hideEmpty?: boolean;
  className?: string;
}) {
  const showCounts = selected.length === 0;
  const visible =
    hideEmpty && showCounts ? options.filter(option => option.count !== 0) : options;

  const toggle = (value: string) => {
    const isOn = selected.includes(value);
    if (multiple) {
      onChange(isOn ? selected.filter(item => item !== value) : [...selected, value]);
    } else {
      onChange(isOn ? [] : [value]);
    }
  };

  if (visible.length === 0) return null;

  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className='text-muted-foreground mb-1.5 text-xs font-medium'>{label}</legend>
      <div className='flex flex-wrap gap-1.5'>
        {visible.map(option => {
          const isOn = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type='button'
              aria-pressed={isOn}
              onClick={() => toggle(option.value)}
              className={cn(
                'focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                isOn
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              {option.label}
              {showCounts && option.count !== undefined ? (
                <span className='text-muted-foreground tabular-nums'>{option.count}</span>
              ) : null}
              {isOn ? <X aria-hidden className='size-3' /> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FacetChipsSkeleton({ chips = 5, className }: { chips?: number; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)} aria-hidden>
      <Skeleton className='h-3 w-20' />
      <div className='flex flex-wrap gap-1.5'>
        {Array.from({ length: chips }, (_, index) => (
          <Skeleton key={index} className='h-7 w-20 rounded-full' />
        ))}
      </div>
    </div>
  );
}
