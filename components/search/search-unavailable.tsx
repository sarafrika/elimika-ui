'use client';

import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const SEARCH_UNAVAILABLE_TITLE = 'Search is temporarily unavailable';

/**
 * Shown where search results would be when the index answered 503. There is no
 * database fallback: "Clear search" gets back to the unfiltered list, "Try again" sends
 * the term once more.
 */
export function SearchUnavailable({
  onClear,
  onRetry,
  description = 'We could not search right now. Clear the search to browse the full list, or try again in a moment.',
  variant = 'compact',
  className,
}: {
  onClear?: () => void;
  onRetry?: () => void;
  description?: string;
  variant?: 'default' | 'card' | 'compact' | 'plain';
  className?: string;
}) {
  return (
    <EmptyState
      icon={SearchX}
      variant={variant}
      className={className}
      title={SEARCH_UNAVAILABLE_TITLE}
      description={description}
      action={
        onClear || onRetry ? (
          <>
            {onClear ? (
              <Button variant='outline' size='sm' onClick={onClear}>
                Clear search
              </Button>
            ) : null}
            {onRetry ? (
              <Button variant='ghost' size='sm' onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    />
  );
}
