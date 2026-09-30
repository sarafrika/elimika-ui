'use client';

import { Search, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type SearchInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** A request for the typed term is in flight or about to be sent. */
  isPending?: boolean;
  /** Called by the clear button; defaults to emptying the value. */
  onClear?: () => void;
  /** A keyboard hint shown at the right edge, e.g. `⌘K` or `/`. */
  shortcut?: string;
  /** Shown under the input, e.g. "Type at least 2 characters". */
  hint?: string;
  wrapperClassName?: string;
};

/**
 * The search box shared by every searchable list: a search icon, a clear button, a
 * spinner while a term is pending and an optional keyboard hint. Wrapped in
 * `role="search"` so assistive technology finds it as a landmark.
 */
export function SearchInput({
  value,
  onValueChange,
  isPending = false,
  onClear,
  shortcut,
  hint,
  placeholder = 'Search…',
  className,
  wrapperClassName,
  'aria-label': ariaLabel,
  ...props
}: SearchInputProps) {
  const hasValue = value.length > 0;

  return (
    <div role='search' className={cn('relative min-w-[200px] flex-1', wrapperClassName)}>
      <Search
        aria-hidden
        className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
      />
      <Input
        type='search'
        value={value}
        onChange={event => onValueChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'border-border/70 rounded-md pl-9 [&::-webkit-search-cancel-button]:hidden',
          (hasValue || isPending || shortcut) && 'pr-16',
          className
        )}
        {...props}
      />
      <div className='absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1'>
        {isPending ? <Spinner aria-label='Searching' /> : null}
        {hasValue ? (
          <button
            type='button'
            onClick={() => (onClear ? onClear() : onValueChange(''))}
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm p-1 focus-visible:ring-2 focus-visible:outline-none'
            aria-label='Clear search'
          >
            <X className='size-3.5' />
          </button>
        ) : shortcut ? (
          <kbd className='border-border bg-muted text-muted-foreground pointer-events-none rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium'>
            {shortcut}
          </kbd>
        ) : null}
      </div>
      {hint ? <p className='text-muted-foreground mt-1 text-xs'>{hint}</p> : null}
    </div>
  );
}
