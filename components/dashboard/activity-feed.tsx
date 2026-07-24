import type { LucideIcon } from 'lucide-react';
import { Activity } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string | number;
  text: string;
  time: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon chip, e.g. "bg-primary/10 text-primary". */
  iconClassName?: string;
}

/** Presentational activity feed. Data comes from a container via `items`. */
export function ActivityFeed({
  items,
  title = 'Activity Feed',
  className,
}: {
  items: ActivityItem[];
  title?: string;
  className?: string;
}) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base font-semibold'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
              <Activity className='h-5 w-5' />
            </div>
            <p className='text-sm text-muted-foreground'>No recent activity yet.</p>
          </div>
        ) : (
          <ul className='space-y-3'>
            {items.map(item => (
              <li key={item.id} className='flex items-start gap-3'>
                <div
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    item.iconClassName ?? 'bg-primary/10 text-primary'
                  )}
                >
                  <item.icon className='h-4 w-4' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium'>{item.text}</p>
                  <p className='text-xs text-muted-foreground'>{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityFeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-2'>
        <Skeleton className='h-5 w-32' />
      </CardHeader>
      <CardContent>
        <ul className='space-y-3'>
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className='flex items-start gap-3'>
              <Skeleton className='h-8 w-8 shrink-0 rounded-full' />
              <div className='flex-1 space-y-1.5'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-16' />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
