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
      <div className='flex min-h-[360px] items-center justify-center rounded-lg border border-dashed'>
        <Alert variant='destructive' className='max-w-lg'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error loading statistics</AlertTitle>
          <AlertDescription className='mt-2 space-y-4'>
            <p>Failed to load dashboard statistics.</p>
            <Button onClick={() => refetch()} variant='outline' size='sm'>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statistics = data?.data;

  return (
    <div className='flex flex-col gap-6'>
      <KPICards statistics={statistics} isLoading={isLoading} />

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <AnalyticsCharts statistics={statistics} isLoading={isLoading} />
        </div>
        <div className='lg:col-span-1'>
          <SystemHealth statistics={statistics} isLoading={isLoading} />
        </div>
      </div>

      <ActivityFeed statistics={statistics} isLoading={isLoading} />
    </div>
  );
}
