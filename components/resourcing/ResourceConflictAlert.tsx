'use client';

import type { ConflictItem } from '@/components/resourcing/conflicts';
import { CalendarX2 } from 'lucide-react';

/**
 * Inline destructive callout listing the per-occurrence conflict report the
 * backend returns with a 409 (resource holds, venue clashes, instructor
 * schedule overlaps). Rendered inside forms so the organiser can see exactly
 * which sessions collide instead of a lone toast.
 */
export function ResourceConflictAlert({
  title,
  conflicts,
}: {
  title: string;
  conflicts: ConflictItem[];
}) {
  if (conflicts.length === 0) return null;

  return (
    <div className='border-destructive/30 bg-destructive/5 rounded-lg border p-4'>
      <div className='text-destructive flex items-center gap-2 text-sm font-semibold'>
        <CalendarX2 className='h-4 w-4 shrink-0' />
        <span>{title}</span>
      </div>
      <ul className='mt-3 space-y-2'>
        {conflicts.slice(0, 8).map((conflict, index) => (
          <li
            key={`${conflict.start ?? 'window'}-${index}`}
            className='border-destructive/20 bg-card rounded-md border p-2.5 text-sm'
          >
            {conflict.start ? (
              <div className='text-foreground font-medium'>
                {conflict.start}
                {conflict.end ? ` – ${conflict.end}` : null}
              </div>
            ) : null}
            {conflict.reasons.length > 0 ? (
              <ul className='text-muted-foreground mt-1 list-disc space-y-0.5 pl-4 text-xs'>
                {conflict.reasons.map(reason => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      {conflicts.length > 8 ? (
        <p className='text-muted-foreground mt-2 text-xs'>
          …and {conflicts.length - 8} more conflicting session{conflicts.length - 8 === 1 ? '' : 's'}.
        </p>
      ) : null}
    </div>
  );
}
