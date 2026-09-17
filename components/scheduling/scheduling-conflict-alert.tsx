'use client';

import { CalendarX2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { conflictWindowLabel, type SchedulingConflict } from '@/lib/scheduling-conflicts';

const VISIBLE_CONFLICTS = 8;

/** Inline destructive callout listing each refused session window with the reasons it clashed. */
export function SchedulingConflictAlert({
  title,
  conflicts,
  timeZone,
  children,
}: {
  title: string;
  conflicts: SchedulingConflict[];
  timeZone?: string | null;
  children?: ReactNode;
}) {
  if (conflicts.length === 0) return null;
  const hidden = conflicts.length - VISIBLE_CONFLICTS;

  return (
    <div role='alert' className='border-destructive/30 bg-destructive/5 rounded-lg border p-4'>
      <div className='text-destructive flex items-center gap-2 text-sm font-semibold'>
        <CalendarX2 className='h-4 w-4 shrink-0' />
        <span>{title}</span>
      </div>
      <ul className='mt-3 space-y-2'>
        {conflicts.slice(0, VISIBLE_CONFLICTS).map((conflict, index) => {
          const window = conflictWindowLabel(conflict, timeZone);
          return (
            <li
              key={`${conflict.start?.toISOString() ?? 'window'}-${index}`}
              className='border-destructive/20 bg-card rounded-md border p-2.5 text-sm'
            >
              {window ? <div className='text-foreground font-medium'>{window}</div> : null}
              {conflict.reasons.length > 0 ? (
                <ul className='text-muted-foreground mt-1 list-disc space-y-0.5 pl-4 text-xs'>
                  {conflict.reasons.map(reason => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {hidden > 0 ? (
        <p className='text-muted-foreground mt-2 text-xs'>
          …and {hidden} more conflicting session{hidden === 1 ? '' : 's'}.
        </p>
      ) : null}
      {children ? <div className='text-foreground mt-3 text-sm'>{children}</div> : null}
    </div>
  );
}
