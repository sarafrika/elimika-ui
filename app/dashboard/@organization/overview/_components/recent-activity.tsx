'use client';

import { format } from 'date-fns';
import { BookOpen, Clock, Settings, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { useAdminActivityFeed } from '@/services/admin';
import { SectionCard } from '../../_components/ui';

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

  const emptyState = (message: string) => (
    <SectionCard title='Recent activity'>
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        <Clock className='mb-3 size-8 text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>{message}</p>
      </div>
    </SectionCard>
  );

  if (!isSystemAdmin) {
    return emptyState('Activity tracking is available for system administrators.');
  }
  if (error) {
    return emptyState('Unable to load the activity feed.');
  }
  if (isLoading) {
    return (
      <SectionCard title='Recent activity'>
        <div className='space-y-3'>
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
        </div>
      </SectionCard>
    );
  }

  const events = activityFeed?.events ?? [];
  if (events.length === 0) {
    return emptyState('No recent activity to display.');
  }

  return (
    <SectionCard title='Recent activity'>
      <ul className='space-y-3'>
        {events.slice(0, 5).map((event, index) => {
          const Icon = getActivityIcon(event.title);
          return (
            <li
              key={`${event.title}-${event.timestamp}-${index}`}
              className='flex items-start gap-3 rounded-md border border-border/60 bg-muted/20 p-3'
            >
              <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40'>
                <Icon className='size-4 text-muted-foreground' />
              </span>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-foreground'>
                  {event.title ?? 'Activity event'}
                </p>
                {event.description ? (
                  <p className='mt-0.5 text-xs text-muted-foreground'>{event.description}</p>
                ) : null}
                <p className='mt-0.5 text-xs text-muted-foreground'>
                  {event.timestamp
                    ? format(new Date(event.timestamp), 'MMM dd, yyyy • HH:mm')
                    : 'Recently'}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function getActivityIcon(title?: string) {
  if (!title) return Clock;
  const lower = title.toLowerCase();
  if (lower.includes('user') || lower.includes('member') || lower.includes('invite')) {
    return UserPlus;
  }
  if (lower.includes('course') || lower.includes('learn')) return BookOpen;
  if (lower.includes('setting') || lower.includes('config') || lower.includes('update')) {
    return Settings;
  }
  return Clock;
}
