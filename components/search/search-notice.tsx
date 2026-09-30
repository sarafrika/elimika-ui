'use client';

import { SearchX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { SearchIssue } from '@/lib/search/query';

/**
 * A non-blocking line above a searchable list. When the search index is down the list
 * keeps working without the term; when a search is refused the user can reset it.
 */
export function SearchNotice({
  issue,
  onReset,
  className,
}: {
  issue: SearchIssue;
  onReset?: () => void;
  className?: string;
}) {
  if (!issue) return null;

  const unavailable = issue === 'unavailable';

  return (
    <Alert className={className}>
      <SearchX className='text-warning' />
      <AlertTitle>
        {unavailable ? 'Search is temporarily unavailable' : 'This search could not be run'}
      </AlertTitle>
      <AlertDescription>
        <p>
          {unavailable
            ? 'Showing the list without the search term. Try again in a moment.'
            : 'Reset the search to see the list again.'}
        </p>
        {onReset ? (
          <Button variant='outline' size='sm' onClick={onReset} className='mt-1'>
            Reset search
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
