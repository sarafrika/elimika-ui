import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import { formatCount, formatPercentage } from '@/lib/metrics';

interface MetricsBreakdownProps {
  statistics?: AdminDashboardStats;
  isLoading: boolean;
}

const formatDecimal = (
  value: number | null | undefined,
  { fractionDigits = 1, fallback = '—' } = {}
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export default function MetricsBreakdown({ statistics, isLoading }: MetricsBreakdownProps) {
  const userMetrics = statistics?.user_metrics;
  const learningMetrics = statistics?.learning_metrics;
  const contentMetrics = statistics?.content_metrics;
  const complianceMetrics = statistics?.compliance_metrics;
  const commerceMetrics = statistics?.commerce_metrics;
  const communicationMetrics = statistics?.communication_metrics;
  const timetablingMetrics = statistics?.timetabling_metrics;

  if (isLoading) {
    return (
      <div className='grid gap-4 lg:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-4 w-64' />
            </CardHeader>
            <CardContent className='space-y-4'>
              {Array.from({ length: 4 }).map((__, metricIndex) => (
                <div key={metricIndex} className='flex items-center justify-between gap-4'>
                  <Skeleton className='h-3 w-32' />
                  <Skeleton className='h-4 w-16' />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sections = [
    {
      key: 'users',
      title: 'User Overview',
      description: 'Platform-wide user engagement and acquisition.',
      metrics: [
        { label: 'Total users', value: formatCount(userMetrics?.total_users) },
        { label: 'Active past 24h', value: formatCount(userMetrics?.active_users_24h) },
        { label: 'New registrations (7d)', value: formatCount(userMetrics?.new_registrations_7d) },
        { label: 'Suspended accounts', value: formatCount(userMetrics?.suspended_accounts) },
      ],
    },
    {
      key: 'learning',
      title: 'Learning Performance',
      description: 'Course and enrollment progression across Elimika.',
      metrics: [
        { label: 'Published courses', value: formatCount(learningMetrics?.published_courses) },
        { label: 'In review', value: formatCount(learningMetrics?.in_review_courses) },
        { label: 'Drafts', value: formatCount(learningMetrics?.draft_courses) },
        {
          label: 'Average course progress',
          value: formatPercentage(learningMetrics?.average_course_progress),
        },
        {
          label: 'Total enrollments',
          value: formatCount(learningMetrics?.total_course_enrollments),
        },
        {
          label: 'Active enrollments',
          value: formatCount(learningMetrics?.active_course_enrollments),
        },
        {
          label: 'New enrollments (7d)',
          value: formatCount(learningMetrics?.new_course_enrollments_7d),
        },
        {
          label: 'Average quality score',
          value: formatDecimal(contentMetrics?.average_quality_score, { fractionDigits: 2 }),
        },
      ],
    },
    {
      key: 'compliance',
      title: 'Compliance & Verification',
      description: 'Verification backlog across instructors and creators.',
      metrics: [
        {
          label: 'Verified instructors',
          value: formatCount(complianceMetrics?.verified_instructors),
        },
        {
          label: 'Pending instructor verification',
          value: formatCount(complianceMetrics?.pending_instructor_verifications),
        },
        {
          label: 'Expiring documents (30d)',
          value: formatCount(complianceMetrics?.expiring_instructor_documents_30d),
        },
        {
          label: 'Verified course creators',
          value: formatCount(complianceMetrics?.verified_course_creators),
        },
        {
          label: 'Pending course creator checks',
          value: formatCount(complianceMetrics?.pending_course_creator_verifications),
        },
      ],
    },
    {
      key: 'commerce',
      title: 'Commerce Snapshot',
      description: 'Orders and monetisation across the platform.',
      metrics: [
        { label: 'Total orders', value: formatCount(commerceMetrics?.total_orders) },
        { label: 'Orders last 30d', value: formatCount(commerceMetrics?.orders_last_30d) },
        { label: 'Captured orders', value: formatCount(commerceMetrics?.captured_orders) },
        { label: 'Unique customers', value: formatCount(commerceMetrics?.unique_customers) },
        {
          label: 'New customers (30d)',
          value: formatCount(commerceMetrics?.new_customers_last_30d),
        },
        {
          label: 'Course purchases (30d)',
          value: formatCount(commerceMetrics?.course_purchases_last_30d),
        },
      ],
    },
    {
      key: 'communications',
      title: 'Communication Health',
      description: 'Notification throughput and pending deliveries.',
      metrics: [
        {
          label: 'Notifications created (7d)',
          value: formatCount(communicationMetrics?.notifications_created_7d),
        },
        {
          label: 'Delivered (7d)',
          value: formatCount(communicationMetrics?.notifications_delivered_7d),
        },
        {
          label: 'Failed (7d)',
          value: formatCount(communicationMetrics?.notifications_failed_7d),
        },
        {
          label: 'Pending delivery',
          value: formatCount(communicationMetrics?.pending_notifications),
        },
      ],
    },
    {
      key: 'timetabling',
      title: 'Timetabling Utilisation',
      description: 'Scheduling and attendance across instructor-led sessions.',
      metrics: [
        { label: 'Sessions next 7d', value: formatCount(timetablingMetrics?.sessions_next_7d) },
        { label: 'Sessions last 30d', value: formatCount(timetablingMetrics?.sessions_last_30d) },
        {
          label: 'Sessions completed (30d)',
          value: formatCount(timetablingMetrics?.sessions_completed_last_30d),
        },
        {
          label: 'Sessions cancelled (30d)',
          value: formatCount(timetablingMetrics?.sessions_cancelled_last_30d),
        },
        {
          label: 'Attendance (30d)',
          value: `${formatCount(
            timetablingMetrics?.attended_enrollments_last_30d
          )} attended / ${formatCount(timetablingMetrics?.absent_enrollments_last_30d)} absent`,
        },
      ],
    },
  ].filter(section => section.metrics.some(metric => metric.value !== '—'));

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      {sections.map(section => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className='space-y-3'>
              {section.metrics.map(metric => (
                <div
                  key={`${section.key}-${metric.label}`}
                  className='flex items-center justify-between gap-4 rounded-md border border-dashed border-border/60 px-3 py-2'
                >
                  <dt className='text-muted-foreground text-sm font-medium'>{metric.label}</dt>
                  <dd className='text-sm font-semibold'>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
