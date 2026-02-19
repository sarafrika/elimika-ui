import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  FileWarning,
  GraduationCap,
  Info,
  Server,
  Shield,
  ShoppingCart,
  UserCheck,
  Users,
} from 'lucide-react';

interface KPICardsProps {
  statistics?: AdminDashboardStats;
  isLoading: boolean;
}

interface SubMetric {
  label: string;
  value: number | bigint | string | undefined;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

interface GroupedKPI {
  title: string;
  icon: any;
  primaryMetric: {
    label: string;
    value: number | bigint | string | undefined;
  };
  subMetrics: SubMetric[];
  description: string;
  highlight?: boolean;
}

export default function KPICards({ statistics, isLoading }: KPICardsProps) {
  const userMetrics = statistics?.user_metrics;
  const organizationMetrics = statistics?.organization_metrics;
  const learningMetrics = statistics?.learning_metrics;
  const adminMetrics = statistics?.admin_metrics;
  const commerceMetrics = statistics?.commerce_metrics;
  const complianceMetrics = statistics?.compliance_metrics;
  const contentMetrics = statistics?.content_metrics;
  const systemPerformance = statistics?.system_performance;
  const timetablingMetrics = statistics?.timetabling_metrics;
  const communicationMetrics = statistics?.communication_metrics;

  const formatValue = (value: number | bigint | string | undefined): string => {
    if (value === undefined || value === null) return '0';
    return typeof value === 'bigint' ? value.toString() : String(value);
  };

  const groupedKPIs: GroupedKPI[] = [
    // User Metrics Card
    {
      title: 'Users',
      icon: Users,
      primaryMetric: {
        label: 'Total Users',
        value: userMetrics?.total_users,
      },
      subMetrics: [
        {
          label: 'Active (24h)',
          value: userMetrics?.active_users_24h,
          trend: 'neutral',
        },
        {
          label: 'New (7d)',
          value: userMetrics?.new_registrations_7d,
          trend: 'up',
        },
        {
          label: 'Suspended',
          value: userMetrics?.suspended_accounts,
          highlight: Number(userMetrics?.suspended_accounts) > 0,
        },
      ],
      description: 'Platform user statistics and activity',
    },

    // Organizations Card
    {
      title: 'Organizations',
      icon: Building2,
      primaryMetric: {
        label: 'Total',
        value: organizationMetrics?.total_organizations,
      },
      subMetrics: [
        {
          label: 'Active',
          value: organizationMetrics?.active_organizations,
        },
        {
          label: 'Pending Approval',
          value: organizationMetrics?.pending_approvals,
          highlight: Number(organizationMetrics?.pending_approvals) > 0,
        },
        {
          label: 'Suspended',
          value: organizationMetrics?.suspended_organizations,
          highlight: Number(organizationMetrics?.suspended_organizations) > 0,
        },
      ],
      description: 'Organization management overview',
      highlight: Number(organizationMetrics?.pending_approvals) > 0,
    },

    // Courses Card
    {
      title: 'Courses',
      icon: BookOpen,
      primaryMetric: {
        label: 'Total Courses',
        value: learningMetrics?.total_courses,
      },
      subMetrics: [
        {
          label: 'Published',
          value: learningMetrics?.published_courses,
        },
        {
          label: 'In Review',
          value: learningMetrics?.in_review_courses,
          highlight: Number(learningMetrics?.in_review_courses) > 0,
        },
        {
          label: 'Drafts',
          value: learningMetrics?.draft_courses,
        },
      ],
      description: 'Course catalog and publication status',
    },

    // Instructors Card
    {
      title: 'Instructors',
      icon: GraduationCap,
      primaryMetric: {
        label: 'Total Creators',
        value: complianceMetrics?.total_course_creators,
      },
      subMetrics: [
        {
          label: 'Verified',
          value: complianceMetrics?.verified_instructors,
        },
        {
          label: 'Pending Verification',
          value: complianceMetrics?.pending_instructor_verifications,
          highlight: Number(complianceMetrics?.pending_instructor_verifications) > 0,
        },
        {
          label: 'Pending Documents',
          value: complianceMetrics?.pending_instructor_documents,
          highlight: Number(complianceMetrics?.pending_instructor_documents) > 0,
        },
      ],
      description: 'Instructor verification and compliance',
      highlight: Number(complianceMetrics?.pending_instructor_verifications) > 0,
    },

    // Enrollments Card
    {
      title: 'Enrollments',
      icon: UserCheck,
      primaryMetric: {
        label: 'Total Enrollments',
        value: learningMetrics?.total_enrollments,
      },
      subMetrics: [
        {
          label: 'Active',
          value: learningMetrics?.active_enrollments,
        },
        {
          label: 'Completed',
          value: learningMetrics?.completed_enrollments,
        },
        {
          label: 'Completion Rate',
          value: learningMetrics?.completion_rate
            ? `${Number(learningMetrics.completion_rate).toFixed(1)}%`
            : '0%',
        },
      ],
      description: 'Student enrollment and completion metrics',
    },

    // Admins Card
    {
      title: 'Administrators',
      icon: Shield,
      primaryMetric: {
        label: 'Total Admins',
        value: adminMetrics?.total_admins,
      },
      subMetrics: [
        {
          label: 'System Admins',
          value: adminMetrics?.system_admins,
        },
        {
          label: 'Org Admins',
          value: adminMetrics?.organization_admins,
        },
        {
          label: 'Active Sessions',
          value: adminMetrics?.active_admin_sessions,
        },
      ],
      description: 'Administrator accounts and activity',
    },

    // Commerce Card
    {
      title: 'Commerce',
      icon: ShoppingCart,
      primaryMetric: {
        label: 'Total Orders',
        value: commerceMetrics?.total_orders,
      },
      subMetrics: [
        {
          label: 'Last 30d',
          value: commerceMetrics?.orders_last_30d,
        },
        {
          label: 'Captured',
          value: commerceMetrics?.captured_orders,
        },
        {
          label: 'Customers',
          value: commerceMetrics?.unique_customers,
        },
      ],
      description: 'Order and customer statistics',
    },

    // Content Moderation Card
    {
      title: 'Content Moderation',
      icon: FileWarning,
      primaryMetric: {
        label: 'Reported Content',
        value: contentMetrics?.reported_content,
      },
      subMetrics: [
        {
          label: 'Pending Moderation',
          value: contentMetrics?.pending_moderation,
          highlight: Number(contentMetrics?.pending_moderation) > 0,
        },
        {
          label: 'Avg Quality Score',
          value: contentMetrics?.average_quality_score
            ? Number(contentMetrics.average_quality_score).toFixed(1)
            : '0',
        },
      ],
      description: 'Content quality and moderation queue',
      highlight:
        Number(contentMetrics?.pending_moderation) > 0 ||
        Number(contentMetrics?.reported_content) > 0,
    },

    // Sessions/Timetabling Card
    {
      title: 'Sessions',
      icon: Calendar,
      primaryMetric: {
        label: 'Next 7 Days',
        value: timetablingMetrics?.sessions_next_7d,
      },
      subMetrics: [
        {
          label: 'Last 30d',
          value: timetablingMetrics?.sessions_last_30d,
        },
        {
          label: 'Completed',
          value: timetablingMetrics?.sessions_completed_last_30d,
        },
        {
          label: 'Cancelled',
          value: timetablingMetrics?.sessions_cancelled_last_30d,
          highlight: Number(timetablingMetrics?.sessions_cancelled_last_30d) > 0,
        },
      ],
      description: 'Scheduled and completed sessions',
    },

    // System Performance Card
    {
      title: 'System Health',
      icon: Server,
      primaryMetric: {
        label: 'Uptime',
        value: systemPerformance?.server_uptime,
      },
      subMetrics: [
        {
          label: 'Avg Response',
          value: systemPerformance?.average_response_time,
        },
        {
          label: 'Error Rate',
          value: systemPerformance?.error_rate,
          highlight: parseFloat(systemPerformance?.error_rate || '0') > 5,
        },
        {
          label: 'Storage',
          value: systemPerformance?.storage_usage,
        },
      ],
      description: 'Platform performance metrics',
    },

    // Communications Card
    {
      title: 'Communications',
      icon: Bell,
      primaryMetric: {
        label: 'Sent (7d)',
        value: communicationMetrics?.notifications_delivered_7d,
      },
      subMetrics: [
        {
          label: 'Created',
          value: communicationMetrics?.notifications_created_7d,
        },
        {
          label: 'Failed',
          value: communicationMetrics?.notifications_failed_7d,
          highlight: Number(communicationMetrics?.notifications_failed_7d) > 0,
        },
        {
          label: 'Pending',
          value: communicationMetrics?.pending_notifications,
        },
      ],
      description: 'Notification delivery statistics',
    },
  ];

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {Array.from({ length: 11 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-10 w-10 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-3 h-8 w-20' />
              <div className='space-y-2'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {groupedKPIs.map((kpi, index) => (
        <Card
          key={index}
          className={`flex flex-col transition-shadow hover:shadow-md ${
            kpi.highlight ? 'border-warning bg-warning/5' : ''
          }`}
        >
          <CardHeader className='flex flex-row items-start justify-between space-y-0'>
            <div className='flex items-center gap-2'>
              <div
                className={`flex-shrink-0 rounded-full p-2 ${
                  kpi.highlight ? 'bg-warning/20' : 'bg-primary/10'
                }`}
              >
                <kpi.icon
                  className={`h-5 w-5 ${kpi.highlight ? 'text-warning' : 'text-primary'}`}
                />
              </div>
              <CardTitle className='text-sm font-medium'>{kpi.title}</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className='text-muted-foreground h-4 w-4 flex-shrink-0 cursor-help' />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{kpi.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          <CardContent className='flex flex-grow flex-col gap-3'>
            {/* Primary Metric */}
            <div className='flex flex-row items-center gap-2 border-b pb-3'>
              <div className='text-3xl font-bold'>{formatValue(kpi.primaryMetric.value)}</div>
              <div className='text-muted-foreground mt-1 text-xs'>{kpi.primaryMetric.label}</div>
            </div>

            {/* Sub Metrics */}
            <div className='grid grid-cols-1 gap-2'>
              {kpi.subMetrics.map((subMetric, subIndex) => (
                <div
                  key={subIndex}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                    subMetric.highlight ? 'bg-warning/10' : 'bg-muted/50'
                  }`}
                >
                  <span className='text-muted-foreground text-xs'>{subMetric.label}</span>
                  <span
                    className={`font-semibold ${
                      subMetric.highlight ? 'text-warning' : 'text-foreground'
                    }`}
                  >
                    {formatValue(subMetric.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
