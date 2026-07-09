'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import { getProgramCompletionRateOptions } from '@/services/client/@tanstack/react-query.gen';

/** Shows a single programme's completion rate. */
export function ProgramCompletionRate({
  programUuid,
  name,
}: {
  programUuid: string;
  name: string;
}) {
  const query = useQuery({
    ...getProgramCompletionRateOptions({ path: { programUuid } }),
    enabled: Boolean(programUuid),
    staleTime: STALE_TIMES.reference,
    retry: false,
  });

  const rate = query.data?.data;
  const label =
    query.isLoading || rate === undefined || rate === null
      ? query.isLoading
        ? '…'
        : '—'
      : `${Math.round(Number(rate))}%`;

  return (
    <div className='flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-3'>
      <span className='min-w-0 truncate text-sm font-medium text-foreground'>{name}</span>
      <span className='shrink-0 text-sm font-semibold tabular-nums text-foreground'>{label}</span>
    </div>
  );
}
