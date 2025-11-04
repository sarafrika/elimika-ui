'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  User,
  Building2,
  BookOpen,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  BellRing,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { AdminDashboardActivityFeed, AdminDashboardActivityEvent } from '@/services/client/admin-dashboard';

interface ActivityFeedProps {
  feed?: AdminDashboardActivityFeed;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  isRefetching?: boolean;
}

const getActivityIcon = (event: AdminDashboardActivityEvent) => {
  const key =
    event.category ?? event.entityType ?? event.eventType ?? event.status ?? event.severity ?? 'default';

  switch (key.toLowerCase()) {
    case 'user':
    case 'users':
      return User;
    case 'organization':
    case 'organisation':
    case 'organizations':
    case 'organisations':
      return Building2;
    case 'course':
    case 'courses':
    case 'learning':
      return BookOpen;
    case 'admin':
    case 'administrator':
      return Shield;
    case 'notification':
    case 'notifications':
      return BellRing;
    case 'compliance':
      return Shield;
    default:
      return User;
  }
};

const getStatusBadge = (status?: string, severity?: string) => {
  const normalizedStatus = status?.toLowerCase();
  const normalizedSeverity = severity?.toLowerCase();

  if (normalizedStatus === 'success' || normalizedStatus === 'completed') {
    return (
      <Badge variant='success' className='gap-1'>
        <CheckCircle className='h-3 w-3' />
        Success
      </Badge>
    );
  }

  if (normalizedStatus === 'pending' || normalizedStatus === 'queued') {
    return (
      <Badge variant='warning' className='gap-1'>
        <Clock className='h-3 w-3' />
        Pending
      </Badge>
    );
  }

  if (normalizedStatus === 'failed' || normalizedStatus === 'rejected') {
    return (
      <Badge variant='destructive' className='gap-1'>
        <XCircle className='h-3 w-3' />
        {normalizedStatus === 'failed' ? 'Failed' : 'Rejected'}
      </Badge>
    );
  }

  if (normalizedSeverity === 'warning') {
    return (
      <Badge variant='warning' className='gap-1'>
        <AlertTriangle className='h-3 w-3' />
        Warning
      </Badge>
    );
  }

  if (normalizedSeverity === 'critical' || normalizedSeverity === 'error') {
    return (
      <Badge variant='destructive' className='gap-1'>
        <XCircle className='h-3 w-3' />
        {normalizedSeverity === 'critical' ? 'Critical' : 'Error'}
      </Badge>
    );
  }

  if (normalizedSeverity === 'success') {
    return (
      <Badge variant='success' className='gap-1'>
        <CheckCircle className='h-3 w-3' />
        Success
      </Badge>
    );
  }

  if (normalizedStatus) {
    return <Badge variant='secondary'>{status}</Badge>;
  }

  return null;
};

const formatTimestamp = (event: AdminDashboardActivityEvent) => {
  const timestamp = event.occurredAt ?? event.createdAt;

  if (!timestamp) {
    return 'moments ago';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'moments ago';
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

const renderMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata) {
    return null;
  }

  const entries = Object.entries(metadata).filter(([, value]) =>
    ['string', 'number', 'boolean'].includes(typeof value)
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {entries.map(([key, value]) => (
        <Badge key={key} variant='outline' className='text-xs font-medium'>
          {key}: {String(value)}
        </Badge>
      ))}
    </div>
  );
};

export default function ActivityFeed({ feed, isLoading, error, onRetry, isRefetching }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <DashboardChartCard
        title='Recent activity'
        description='Latest events and actions across the platform'
      >
        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className='h-20 w-full' />
          ))}
        </div>
      </DashboardChartCard>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Unable to load recent activity.';
    return (
      <Card className='border-destructive/40'>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events and actions across the platform</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-destructive'>{message}</p>
          <Button variant='outline' size='sm' onClick={onRetry} disabled={isRefetching}>
            {isRefetching ? 'Retrying...' : 'Try again'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = [...(feed?.events ?? [])].sort((a, b) => {
    const aTime = new Date(a.occurredAt ?? a.createdAt ?? 0).getTime();
    const bTime = new Date(b.occurredAt ?? b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });

  return (
    <Card>
      <CardHeader className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {feed?.message ?? 'Latest events and actions across the platform'}
          </CardDescription>
        </div>
        {onRetry && (
          <Button
            variant='outline'
            size='sm'
            className='mt-2 sm:mt-0'
            onClick={onRetry}
            disabled={isRefetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[400px] pr-4'>
          {items.length > 0 ? (
            <div className='space-y-4'>
              {items.map(activity => {
                const Icon = getActivityIcon(activity);
                const statusBadge = getStatusBadge(activity.status, activity.severity);
                const timestampLabel = formatTimestamp(activity);

                return (
                  <div
                    key={activity.id}
                    className='hover:bg-muted/50 flex items-start gap-4 rounded-lg border p-4 transition-colors'
                  >
                    <div className='bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full'>
                      <Icon className='text-primary h-5 w-5' />
                    </div>
                    <div className='flex-1 space-y-2'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div>
                          <p className='text-sm font-medium'>
                            {activity.title ?? activity.summary ?? activity.eventType ?? 'Activity update'}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {activity.actorName ? `${activity.actorName} • ` : ''}
                            {timestampLabel}
                          </p>
                        </div>
                        {statusBadge}
                      </div>
                      {activity.summary && (
                        <p className='text-muted-foreground text-sm'>{activity.summary}</p>
                      )}
                      {activity.description && activity.description !== activity.summary && (
                        <p className='text-muted-foreground text-xs'>{activity.description}</p>
                      )}
                      {renderMetadata(activity.metadata)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='flex h-32 flex-col items-center justify-center text-center text-sm text-muted-foreground'>
              <ShieldAlert className='mb-2 h-6 w-6' />
              No recent activity to display right now.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
