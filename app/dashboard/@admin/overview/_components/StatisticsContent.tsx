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
import {
  DashboardSection,
  DashboardSectionDescription,
  DashboardSectionHeader,
  DashboardSectionTitle,
  DashboardShell,
} from '@/components/ui/dashboard';

export default function StatisticsContent() {
  const { data, error, isLoading, refetch } = useQuery(getDashboardStatisticsOptions());

  if (error) {
    return (
      <DashboardShell>
        <DashboardSection className='min-h-[360px] items-center justify-center'>
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
        </DashboardSection>
      </DashboardShell>
    );
  }

  const statistics = data?.data;

  return (
    <DashboardShell>
      <DashboardSection>
        <DashboardSectionHeader>
          <DashboardSectionTitle>Dashboard statistics</DashboardSectionTitle>
          <DashboardSectionDescription>
            Real-time overview of platform metrics and system health.
          </DashboardSectionDescription>
        </DashboardSectionHeader>
        <KPICards statistics={statistics} isLoading={isLoading} />
      </DashboardSection>

      <DashboardSection>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <AnalyticsCharts statistics={statistics} isLoading={isLoading} />
          </div>
          <div className='lg:col-span-1'>
            <SystemHealth statistics={statistics} isLoading={isLoading} />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection>
        <ActivityFeed statistics={statistics} isLoading={isLoading} />
      </DashboardSection>
    </DashboardShell>
  );
}
