'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Opens the search palette. Looks like the search box it replaces, but is a button: the
 * typing happens in the palette. Shows the ⌘K hint (Ctrl K elsewhere).
 */
export function GlobalSearchTrigger({
  onOpen,
  className,
  compact = false,
}: {
  onOpen: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onOpen}
      aria-label='Search (⌘K)'
      aria-keyshortcuts='Meta+K Control+K /'
      className={cn(
        'border-input bg-background text-muted-foreground hover:border-primary/40 focus-visible:ring-ring/50 relative flex w-full items-center gap-3 border text-left text-xs shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
        compact ? 'h-11 rounded-md px-4 text-sm' : 'h-10 rounded-full px-4',
        className
      )}
    >
      <Search aria-hidden className='size-4 shrink-0' />
      <span className='flex-1 truncate'>Search courses, programs, jobs and more…</span>
      <kbd className='border-border bg-muted pointer-events-none hidden rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline-block'>
        ⌘K
      </kbd>
    </button>
  );
}
