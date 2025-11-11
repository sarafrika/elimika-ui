'use client';

import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStatisticsOptions } from '@/services/client/@tanstack/react-query.gen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminActivityFeed } from '@/services/admin';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import KPICards from './KPICards';
import AnalyticsCharts from './AnalyticsCharts';
import SystemHealth from './SystemHealth';
import ActivityFeed from './ActivityFeed';
import MetricsBreakdown from './MetricsBreakdown';

export default function StatisticsContent() {
  const { data, error, isLoading, refetch } = useQuery(getDashboardStatisticsOptions());
  const {
    data: activityFeed,
    error: activityError,
    isLoading: isActivityFeedLoading,
    isRefetching: isActivityFeedRefetching,
    refetch: refetchActivityFeed,
  } = useAdminActivityFeed();

  if (error) {
    return (
      <div className='flex h-[calc(100vh-120px)] items-center justify-center'>
        <Alert variant='destructive' className='max-w-lg'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error Loading Statistics</AlertTitle>
          <AlertDescription className='mt-2 space-y-4'>
            <p>Failed to load dashboard statistics.</p>
            <Button onClick={() => refetch()} variant='outline' size='sm'>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statistics: AdminDashboardStats | undefined = data?.data;

  let lastUpdatedLabel: string | null = null;
  if (statistics?.timestamp) {
    const timestamp =
      statistics.timestamp instanceof Date ? statistics.timestamp : new Date(statistics.timestamp);

    if (!Number.isNaN(timestamp.getTime())) {
      lastUpdatedLabel = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  }

  if (!statistics && !isLoading) {
    return (
      <Alert className='flex flex-col items-start gap-3'>
        <AlertCircle className='h-4 w-4' />
        <div>
          <AlertTitle>No statistics available</AlertTitle>
          <AlertDescription>
            We couldn&apos;t retrieve dashboard metrics right now. Please try again later.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard Statistics</h1>
          <p className='text-muted-foreground'>
            Real-time overview of platform metrics, service health, and administrator activity.
          </p>
        </div>
        {lastUpdatedLabel && (
          <Badge variant='outline' className='w-fit'>
            Last updated {lastUpdatedLabel}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <KPICards statistics={statistics} isLoading={isLoading} />

      {/* Analytics Charts & System Health */}
      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <AnalyticsCharts statistics={statistics} isLoading={isLoading} />
        </div>
        <div className='lg:col-span-1'>
          <SystemHealth statistics={statistics} isLoading={isLoading} />
        </div>
      </div>

      {/* Expanded Metrics */}
      <MetricsBreakdown statistics={statistics} isLoading={isLoading} />

      {/* Activity Feed */}
      <ActivityFeed
        statistics={statistics}
        events={activityFeed?.events ?? []}
        isLoading={isLoading}
        isEventsLoading={isActivityFeedLoading || isActivityFeedRefetching}
        error={activityError ?? null}
        onRetry={refetchActivityFeed}
      />
    </div>
  );
}
