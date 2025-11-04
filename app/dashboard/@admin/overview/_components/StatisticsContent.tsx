'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStatisticsOptions } from '@/services/client/@tanstack/react-query.gen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KPICards from './KPICards';
import AnalyticsCharts from './AnalyticsCharts';
import SystemHealth from './SystemHealth';
import ActivityFeed from './ActivityFeed';

export default function StatisticsContent() {
  const { data, error, isLoading, refetch } = useQuery(getDashboardStatisticsOptions());

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

  const statistics = data?.data;

  return (
    <div className='flex flex-col gap-6'>
      {/* Page Header */}
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard Statistics</h1>
        <p className='text-muted-foreground'>
          Real-time overview of platform metrics and system health
        </p>
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

      {/* Activity Feed */}
      <ActivityFeed statistics={statistics} isLoading={isLoading} />
    </div>
  );
}
