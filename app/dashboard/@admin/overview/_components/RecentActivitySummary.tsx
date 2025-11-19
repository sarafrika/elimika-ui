'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminActivityEvent } from '@/services/admin/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ArrowUpRight } from 'lucide-react';

interface RecentActivitySummaryProps {
  events: AdminActivityEvent[];
  isLoading: boolean;
}

export function RecentActivitySummary({ events, isLoading }: RecentActivitySummaryProps) {
  if (!isLoading && events.length === 0) {
    return null;
  }

  const items = events.slice(0, 4);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-4'>
        <div>
          <CardTitle className='text-base font-semibold'>Recent Admin Actions</CardTitle>
          <CardDescription>Live feed of privileged operations.</CardDescription>
        </div>
        <Button asChild variant='ghost' size='sm' className='gap-1 px-2 text-xs'>
          <a href='#admin-activity-feed'>
            View timeline
            <ArrowUpRight className='h-3.5 w-3.5' />
          </a>
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className='space-y-2'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-3 w-32' />
            </div>
          ))}
        {!isLoading &&
          items.map(event => {
            const timestamp =
              event.occurred_at || event.timestamp || event.created_at || event.id || '';
            const relativeTime =
              typeof timestamp === 'string' && timestamp.length
                ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
                : 'Just now';

            return (
              <div
                key={event.id ?? event.uuid ?? `${event.summary}-${timestamp}`}
                className='flex items-start gap-3 rounded-xl border border-border/50 p-3'
              >
                <div className='bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full'>
                  <Activity className='h-4 w-4' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-foreground'>
                    {event.summary ?? event.title ?? 'Admin action'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {event.actor_name ?? event.actor?.name ?? 'System'} · {relativeTime}
                  </p>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}
