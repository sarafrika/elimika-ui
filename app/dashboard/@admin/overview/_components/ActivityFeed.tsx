'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Building2,
  BookOpen,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  BellRing,
} from 'lucide-react';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import { DashboardChartCard } from '@/components/ui/dashboard';
import { Icon } from '@/components/icons';

interface ActivityFeedProps {
  statistics?: AdminDashboardStats;
  isLoading: boolean;
}

const toNumber = (value?: bigint | number | string | null) => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user':
      return User;
    case 'organization':
      return Building2;
    case 'course':
      return BookOpen;
    case 'admin':
      return Shield;
    case 'notifications':
      return BellRing;
    default:
      return User;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant='success' className='gap-1'>
          <CheckCircle className='h-3 w-3' />
          Success
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant='warning' className='gap-1'>
          <Clock className='h-3 w-3' />
          Pending
        </Badge>
      );
    case 'rejected':
    case 'warning':
      return (
        <Badge variant='destructive' className='gap-1'>
          <XCircle className='h-3 w-3' />
          {status === 'rejected' ? 'Rejected' : 'Warning'}
        </Badge>
      );
    default:
      return <Badge variant='secondary'>{status}</Badge>;
  }
};

export default function ActivityFeed({ statistics, isLoading }: ActivityFeedProps) {
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

  const timestamp = statistics?.timestamp ? new Date(statistics.timestamp) : undefined;
  const snapshotTime = timestamp
    ? formatDistanceToNow(timestamp, { addSuffix: true })
    : 'a few moments ago';

  const userMetrics = statistics?.user_metrics;
  const organizationMetrics = statistics?.organization_metrics;
  const complianceMetrics = statistics?.compliance_metrics;
  const communicationMetrics = statistics?.communication_metrics;
  const adminMetrics = statistics?.admin_metrics;
  const learningMetrics = statistics?.learning_metrics;

  const activityData = [
    userMetrics && {
      id: 'user-growth',
      user: 'Platform Update',
      action: `${toNumber(userMetrics.new_registrations_7d).toLocaleString()} new user registrations in the last 7 days`,
      timestamp: snapshotTime,
      type: 'user',
      status: toNumber(userMetrics.new_registrations_7d) > 0 ? 'success' : 'pending',
    },
    organizationMetrics && {
      id: 'org-approvals',
      user: 'Organisation Review',
      action: `${toNumber(organizationMetrics.pending_approvals).toLocaleString()} organisations pending approval`,
      timestamp: snapshotTime,
      type: 'organization',
      status: toNumber(organizationMetrics.pending_approvals) > 0 ? 'pending' : 'success',
    },
    complianceMetrics && {
      id: 'instructor-verification',
      user: 'Instructor Verification',
      action: `${toNumber(complianceMetrics.pending_instructor_verifications).toLocaleString()} instructor verifications awaiting review`,
      timestamp: snapshotTime,
      type: 'admin',
      status: toNumber(complianceMetrics.pending_instructor_verifications) > 0 ? 'pending' : 'success',
    },
    complianceMetrics && {
      id: 'course-creator-verification',
      user: 'Course Creator Verification',
      action: `${toNumber(complianceMetrics.pending_course_creator_verifications).toLocaleString()} course creator applications pending review`,
      timestamp: snapshotTime,
      type: 'course',
      status:
        toNumber(complianceMetrics.pending_course_creator_verifications) > 0 ? 'pending' : 'success',
    },
    learningMetrics && {
      id: 'published-courses',
      user: 'Learning Programs',
      action: `${toNumber(learningMetrics.published_courses).toLocaleString()} published courses available to learners`,
      timestamp: snapshotTime,
      type: 'course',
      status: toNumber(learningMetrics.published_courses) > 0 ? 'success' : 'pending',
    },
    adminMetrics && {
      id: 'admin-actions',
      user: 'Admin Activity',
      action: `${toNumber(adminMetrics.admin_actions_today).toLocaleString()} admin actions recorded today`,
      timestamp: snapshotTime,
      type: 'admin',
      status: toNumber(adminMetrics.admin_actions_today) > 0 ? 'success' : 'pending',
    },
    communicationMetrics && {
      id: 'pending-notifications',
      user: 'Notifications',
      action: `${toNumber(communicationMetrics.pending_notifications).toLocaleString()} notifications pending delivery`,
      timestamp: snapshotTime,
      type: 'notifications',
      status: toNumber(communicationMetrics.pending_notifications) > 0 ? 'warning' : 'success',
    },
  ].filter(Boolean) as Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
    type: string;
    status: string;
  }>;

  return (
    <DashboardChartCard
      title='Recent activity'
      description='Latest events and actions across the platform'
      contentClassName='p-0'
    >
      <ScrollArea className='h-[400px] p-6 pr-8'>
        {activityData.length > 0 ? (
          <div className='space-y-4'>
            {activityData.map(activity => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className='dashboard-activity-card'>
                  <div className='dashboard-card-icon'>
                    <ActivityIcon className='h-5 w-5' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm'>
                      <span className='font-medium'>{activity.user}</span>{' '}
                      <span className='text-muted-foreground'>{activity.action}</span>
                    </p>
                    <p className='text-muted-foreground text-xs'>{activity.timestamp}</p>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className='flex h-32 flex-col items-center justify-center text-center text-sm text-muted-foreground'>
            <Icon name='security' className='mb-2 h-6 w-6' />
            No recent activity to display for this snapshot.
          </div>
        )}
      </ScrollArea>
    </DashboardChartCard>
  );
}
