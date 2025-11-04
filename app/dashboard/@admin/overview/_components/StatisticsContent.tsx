'use client';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DashboardGrid,
  DashboardSection,
  DashboardSectionDescription,
  DashboardSectionHeader,
  DashboardSectionTitle,
  DashboardShell,
} from '@/components/ui/dashboard';
import { getDashboardActivityFeedOptions } from '@/services/client/admin-dashboard';
import { getAdminDashboardStatisticsOptions } from '@/services/api/tanstack-client';
import type { AdminDashboardActivityFeed } from '@/services/client/admin-dashboard';
import type { ActivityEventDTO } from '@/services/api/actions';
import KPICards from './KPICards';
import AnalyticsCharts from './AnalyticsCharts';
import SystemHealth from './SystemHealth';
import ActivityFeed from './ActivityFeed';

const mapActivityEventsToFeed = (events: ActivityEventDTO[]): AdminDashboardActivityFeed => ({
  events: events.map(event => ({
    id: event.id,
    title: event.title,
    summary: event.description,
    description: event.description,
    status: event.status,
    occurredAt: event.occurredAt?.toISOString(),
    createdAt: event.occurredAt?.toISOString(),
  })),
  message: 'Derived activity from the latest dashboard snapshot',
});

export default function StatisticsContent() {
  const {
    data: statsResult,
    error: statsError,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    refetch: refetchStats,
  } = useQuery(getAdminDashboardStatisticsOptions());

  const {
    data: activityFeed,
    error: activityError,
    isLoading: isActivityLoading,
    isFetching: isActivityFetching,
    refetch: refetchActivity,
  } = useQuery(getDashboardActivityFeedOptions());

  if (statsError) {
    return (
      <div className='flex min-h-[360px] items-center justify-center rounded-lg border border-dashed'>
        <Alert variant='destructive' className='max-w-lg'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error loading statistics</AlertTitle>
          <AlertDescription className='mt-2 space-y-4'>
            <p>Failed to load dashboard statistics.</p>
            <Button onClick={() => refetchStats()} variant='outline' size='sm'>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statistics = statsResult?.statistics;
  const derivedActivityEvents = statsResult?.activityEvents ?? [];
  const isInitialLoading = isStatsLoading && !statistics;

  const fallbackFeed =
    derivedActivityEvents.length > 0 ? mapActivityEventsToFeed(derivedActivityEvents) : undefined;

  const feed = activityFeed ?? fallbackFeed;

  return (
    <DashboardShell className='space-y-8'>
      <DashboardSection>
        <DashboardSectionHeader>
          <DashboardSectionTitle>Dashboard statistics</DashboardSectionTitle>
          <DashboardSectionDescription>
            Real-time overview of platform metrics and system health
          </DashboardSectionDescription>
        </DashboardSectionHeader>
        <KPICards statistics={statistics} isLoading={isInitialLoading} />
      </DashboardSection>

      <DashboardSection>
        <DashboardGrid className='gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <AnalyticsCharts statistics={statistics} isLoading={isInitialLoading} />
          </div>
          <div className='lg:col-span-1'>
            <SystemHealth statistics={statistics} isLoading={isInitialLoading} />
          </div>
        </DashboardGrid>
      </DashboardSection>

      <DashboardSection>
        <ActivityFeed
          feed={feed}
          isLoading={isActivityLoading && !feed}
          isRefetching={isActivityFetching || isStatsFetching}
          error={activityError}
          onRetry={refetchActivity}
        />
      </DashboardSection>
    </DashboardShell>
  );
}
