"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUserProfile } from '@/context/profile-context';
import { getDashboardStatisticsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useAdminActivityFeed } from '@/services/admin';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Activity, BarChart3, ShieldQuestion } from 'lucide-react';

export default function AuditActivityPage() {
  const profile = useUserProfile();
  const isAdmin = profile?.user_domain?.includes('admin');

  const statsQuery = useQuery({
    ...getDashboardStatisticsOptions(),
    enabled: isAdmin,
  });

  const { data: activityFeed, isLoading: isActivityLoading, error: activityError } = useAdminActivityFeed({
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader className='flex items-center gap-2'>
          <ShieldQuestion className='h-4 w-4' />
          <CardTitle>Admin only</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Platform audit and activity feeds are visible only to system administrators.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const statistics = (statsQuery.data as any)?.data ?? {};
  const organisationMetrics = statistics.organization_metrics ?? {};
  const adminMetrics = statistics.admin_metrics ?? {};

  return (
    <div className='space-y-6'>
      <div className='rounded-3xl border border-border/60 bg-card p-6 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold'>Platform health</p>
            <p className='text-muted-foreground text-sm'>
              Uses GET /api/v1/admin/dashboard/statistics and /activity-feed.
            </p>
          </div>
          <Badge variant='outline'>Admin visibility</Badge>
        </div>
        <Separator className='my-4' />
        <div className='grid gap-4 sm:grid-cols-3'>
          <MetricTile label='Total organisations' value={organisationMetrics.total_organisations} />
          <MetricTile label='Pending approvals' value={organisationMetrics.pending_approvals} />
          <MetricTile label='Active admins' value={adminMetrics.active_admin_sessions} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Activity className='h-4 w-4' />
            <CardTitle>Activity feed</CardTitle>
          </div>
          <CardDescription>Events from GET /api/v1/admin/dashboard/activity-feed.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {activityError ? (
            <p className='text-muted-foreground text-sm'>Unable to load activity.</p>
          ) : null}
          {isActivityLoading ? (
            <p className='text-muted-foreground text-sm'>Loading activity…</p>
          ) : (
            activityFeed?.events?.slice(0, 10).map(event => (
              <div
                key={`${event.title}-${event.timestamp}`}
                className='rounded-lg border border-border/60 bg-muted/30 p-3'
              >
                <p className='font-medium'>{event.title ?? 'Admin event'}</p>
                <p className='text-muted-foreground text-xs'>
                  {event.timestamp
                    ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })
                    : '—'}
                </p>
                {event.description ? (
                  <p className='text-muted-foreground text-xs'>{event.description}</p>
                ) : null}
              </div>
            ))
          )}
          {activityFeed?.events?.length === 0 && !isActivityLoading ? (
            <p className='text-muted-foreground text-sm'>No recent admin activity.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className='rounded-xl border border-border/60 bg-muted/40 p-4'>
      <div className='flex items-center gap-2 text-sm font-semibold'>
        <BarChart3 className='h-4 w-4 text-muted-foreground' />
        {label}
      </div>
      <p className='text-2xl font-semibold'>{value ?? '—'}</p>
    </div>
  );
}
