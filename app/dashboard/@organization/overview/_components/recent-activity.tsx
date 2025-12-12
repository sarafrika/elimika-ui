'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { useAdminActivityFeed } from '@/services/admin';
import { format } from 'date-fns';
import { Clock, UserPlus, BookOpen, Settings, AlertCircle } from 'lucide-react';

export function RecentActivity() {
  const profile = useUserProfile();
  const isSystemAdmin = profile?.user_domain?.includes('admin');

  const {
    data: activityFeed,
    isLoading,
    error,
  } = useAdminActivityFeed({
    enabled: isSystemAdmin,
  });

  if (!isSystemAdmin) {
    return (
      <div className={elimikaDesignSystem.components.card.base}>
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <Clock className='mb-3 h-10 w-10 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            Activity tracking is available for system administrators
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={elimikaDesignSystem.components.card.base}>
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <AlertCircle className='mb-3 h-10 w-10 text-destructive' />
          <p className='text-sm text-muted-foreground'>
            Unable to load activity feed
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={elimikaDesignSystem.components.card.base}>
        <div className='space-y-4'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
      </div>
    );
  }

  const events = activityFeed?.events ?? [];

  if (events.length === 0) {
    return (
      <div className={elimikaDesignSystem.components.card.base}>
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <Clock className='mb-3 h-10 w-10 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            No recent activity to display
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={elimikaDesignSystem.components.card.base}>
      <div className='space-y-3'>
        {events.slice(0, 5).map((event, index) => {
          const Icon = getActivityIcon(event.title);

          return (
            <div
              key={`${event.title}-${event.timestamp}-${index}`}
              className='rounded-xl border border-border bg-muted/30 p-3 transition hover:bg-muted/50'
            >
              <div className='flex items-start gap-3'>
                <div className='mt-0.5 rounded-lg bg-muted p-2'>
                  <Icon className='h-4 w-4 text-primary' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-foreground'>
                    {event.title ?? 'Activity Event'}
                  </p>
                  {event.description && (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {event.description}
                    </p>
                  )}
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {event.timestamp
                      ? format(new Date(event.timestamp), 'MMM dd, yyyy • HH:mm')
                      : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getActivityIcon(title?: string) {
  if (!title) return Clock;

  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('user') || lowerTitle.includes('member') || lowerTitle.includes('invite')) {
    return UserPlus;
  }
  if (lowerTitle.includes('course') || lowerTitle.includes('learn')) {
    return BookOpen;
  }
  if (lowerTitle.includes('setting') || lowerTitle.includes('config') || lowerTitle.includes('update')) {
    return Settings;
  }

  return Clock;
}
