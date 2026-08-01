'use client';

import { CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UpcomingSession } from './class-form-shared';

export function UpcomingSessions({ sessions }: { sessions: UpcomingSession[] }) {
  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div className='flex items-center gap-2 text-sm font-semibold'>
        <CalendarDays className='text-primary h-4 w-4' />
        Upcoming Sessions
        <Badge variant='secondary' className='ml-auto text-xs'>
          {sessions.length}
        </Badge>
      </div>
      {sessions.length === 0 ? (
        <div className='text-muted-foreground text-xs'>
          No sessions match the selected dates and schedule.
        </div>
      ) : (
        <div className='max-h-40 space-y-1 overflow-y-auto pr-1'>
          {sessions.slice(0, 50).map((s, idx) => (
            <div
              key={idx}
              className='bg-muted/50 flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-xs'
            >
              <span className='min-w-0 truncate font-medium'>{s.label}</span>
              <span className='text-muted-foreground shrink-0'>{s.time}</span>
            </div>
          ))}
          {sessions.length > 50 && (
            <div className='text-muted-foreground py-1 text-center text-xs'>
              + {sessions.length - 50} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
