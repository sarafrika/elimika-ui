'use client';

import { useTimeZone } from '@/context/timezone-context';
import { formatDateTime } from '@/lib/date';

export function ApplicationSubmissionDate({
  submittedAt,
  isLoading,
  isError,
}: {
  submittedAt: string | undefined;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const { zone } = useTimeZone();
  if (isError)
    return (
      <p role='alert' className='text-destructive mb-4 text-sm'>
        Unable to load your saved application. Refresh this page to try again.
      </p>
    );
  if (isLoading)
    return (
      <p role='status' className='text-muted-foreground mb-4 text-sm'>
        Loading your saved application…
      </p>
    );
  if (!submittedAt) return null;
  return (
    <p className='text-muted-foreground mb-4 text-sm'>
      Profile details submitted for review:{' '}
      <time dateTime={submittedAt}>{formatDateTime(submittedAt, { zone })}</time>
    </p>
  );
}
