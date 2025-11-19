'use client';

import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStatisticsOptions } from '@/services/client/@tanstack/react-query.gen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Bell, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminActivityFeed } from '@/services/admin';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import { useUserProfile } from '@/context/profile-context';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatCount } from '@/lib/metrics';
import KPICards from './KPICards';
import AnalyticsCharts from './AnalyticsCharts';
import SystemHealth from './SystemHealth';
import ActivityFeed from './ActivityFeed';
import MetricsBreakdown from './MetricsBreakdown';
import { VerificationSnapshot } from './VerificationSnapshot';
import { RecentActivitySummary } from './RecentActivitySummary';
import { EnrollmentComplianceCard, type EnrollmentComplianceMetrics } from './EnrollmentComplianceCard';

export default function StatisticsContent() {
  const router = useRouter();
  const profile = useUserProfile();
  const [searchValue, setSearchValue] = useState('');
  const { data, error, isLoading, refetch } = useQuery(getDashboardStatisticsOptions());
  const {
    data: activityFeed,
    error: activityError,
    isLoading: isActivityFeedLoading,
    isRefetching: isActivityFeedRefetching,
    refetch: refetchActivityFeed,
  } = useAdminActivityFeed();

  type ExtendedAdminDashboardStats = AdminDashboardStats & {
    enrollment_compliance_metrics?: EnrollmentComplianceMetrics;
  };

  const statistics = data?.data as ExtendedAdminDashboardStats | undefined;
  const adminMetrics = statistics?.admin_metrics;
  const organizationMetrics = statistics?.organization_metrics;
  const complianceMetrics = statistics?.compliance_metrics;
  const enrollmentComplianceMetrics = statistics?.enrollment_compliance_metrics;

  const missionStats = useMemo(
    () => [
      {
        label: 'Total admins',
        value: formatCount(adminMetrics?.total_admins),
      },
      {
        label: 'Active sessions',
        value: formatCount(adminMetrics?.active_admin_sessions),
      },
      {
        label: 'Pending org approvals',
        value: formatCount(organizationMetrics?.pending_approvals),
      },
      {
        label: 'Pending verifications',
        value: formatCount(complianceMetrics?.pending_instructor_verifications),
      },
    ],
    [adminMetrics, organizationMetrics, complianceMetrics]
  );

  let lastUpdatedLabel: string | null = null;
  if (statistics?.timestamp) {
    const timestamp =
      statistics.timestamp instanceof Date ? statistics.timestamp : new Date(statistics.timestamp);

    if (!Number.isNaN(timestamp.getTime())) {
      lastUpdatedLabel = formatDistanceToNow(timestamp, { addSuffix: true });
    }
  }

  const handleSearch = () => {
    const query = searchValue.trim();

    if (!query) {
      return;
    }

    router.push(`/dashboard/users?search=${encodeURIComponent(query)}`);
  };

  const initials = useMemo(() => {
    if (!profile?.first_name && !profile?.last_name) {
      return 'SA';
    }

    return `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();
  }, [profile?.first_name, profile?.last_name]);

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
      <div className='space-y-4'>
        <div className='rounded-3xl border border-border/60 bg-card p-6 shadow-sm'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div className='space-y-3'>
              <Badge variant='outline' className='w-fit uppercase tracking-[0.3em]'>
                System Administrator
              </Badge>
              <div>
                <h1 className='text-3xl font-bold tracking-tight'>
                  360° admin control center
                </h1>
                <p className='text-muted-foreground text-sm'>
                  Stay ahead of growth, compliance, and performance in a single workspace. Grant
                  access, review risk, and triage verifications without leaving this dashboard.
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                <Button
                  className='gap-2'
                  onClick={() => router.push('/dashboard/users?view=eligible')}
                  size='sm'
                >
                  <UserPlus className='h-4 w-4' />
                  Grant access
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2'
                  onClick={() => router.push('/dashboard/system-config')}
                >
                  <ShieldCheck className='h-4 w-4' />
                  System config
                </Button>
                {lastUpdatedLabel && (
                  <Badge variant='outline' className='gap-2'>
                    Last updated {lastUpdatedLabel}
                  </Badge>
                )}
              </div>
            </div>
            <div className='grid min-w-[260px] flex-1 grid-cols-2 gap-3'>
              {missionStats.map(stat => (
                <div
                  key={stat.label}
                  className='rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-inner'
                >
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>
                    {stat.label}
                  </p>
                  <p className='text-2xl font-semibold'>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-border/60 bg-card p-4 shadow-sm'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex-1 min-w-[220px]'>
              <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search users, organizations, rules...'
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className='pl-10'
              />
            </div>
            <Button variant='outline' size='sm' className='gap-2' onClick={handleSearch}>
              <Search className='h-4 w-4' />
              Search
            </Button>
            <Button variant='outline' size='icon'>
              <Bell className='h-4 w-4' />
            </Button>
            <Avatar className='h-10 w-10'>
              <AvatarImage src={profile?.profile_image_url ?? undefined} alt={profile?.email ?? ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-6'>
          <KPICards statistics={statistics} isLoading={isLoading} />
          <AnalyticsCharts statistics={statistics} isLoading={isLoading} />
          <MetricsBreakdown statistics={statistics} isLoading={isLoading} />
          <div id='admin-activity-feed'>
            <ActivityFeed
              statistics={statistics}
              events={activityFeed?.events ?? []}
              isLoading={isLoading}
              isEventsLoading={isActivityFeedLoading || isActivityFeedRefetching}
              error={activityError ?? null}
              onRetry={refetchActivityFeed}
            />
          </div>
        </div>

        <aside className='space-y-6'>
          <SystemHealth statistics={statistics} isLoading={isLoading} />
          <VerificationSnapshot statistics={statistics} />
          <EnrollmentComplianceCard metrics={enrollmentComplianceMetrics} />
          <RecentActivitySummary
            events={activityFeed?.events ?? []}
            isLoading={isActivityFeedLoading || isActivityFeedRefetching}
          />
        </aside>
      </div>
    </div>
  );
}
