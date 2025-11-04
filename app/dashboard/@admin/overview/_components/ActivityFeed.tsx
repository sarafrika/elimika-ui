'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BellRing,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminActivityEvent } from '@/services/admin/dashboard';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import { formatCount, toNumber } from '@/lib/metrics';

interface ActivityFeedProps {
  statistics?: AdminDashboardStats;
  events: AdminActivityEvent[];
  isLoading: boolean;
  isEventsLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const statusIconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  destructive: XCircle,
  secondary: AlertCircle,
  pending: Clock,
} as const;

const resolveEventStatus = (event: AdminActivityEvent): string | undefined =>
  event.status ?? event.severity ?? (event.state ? String(event.state) : undefined);

const resolveStatusVariant = (
  status: string | undefined
): 'success' | 'warning' | 'destructive' | 'secondary' => {
  if (!status) return 'secondary';
  const normalized = status.toLowerCase();

  if (
    ['success', 'completed', 'resolved', 'delivered', 'approved', 'healthy'].includes(normalized)
  ) {
    return 'success';
  }

  if (
    ['pending', 'processing', 'queued', 'awaiting', 'in_progress', 'warning'].includes(normalized)
  ) {
    return 'warning';
  }

  if (
    ['failed', 'error', 'critical', 'rejected', 'blocked', 'cancelled'].includes(normalized)
  ) {
    return 'destructive';
  }

  return 'secondary';
};

const formatStatusLabel = (status: string): string =>
  status
    .toLowerCase()
    .split(/[_-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getEventIcon = (event: AdminActivityEvent) => {
  const category =
    event.category ?? event.domain ?? event.event_type ?? event.type ?? '';

  switch (category.toLowerCase()) {
    case 'user':
    case 'users':
    case 'enrollment':
      return User;
    case 'organization':
    case 'organisation':
    case 'tenant':
      return Building2;
    case 'course':
    case 'learning':
    case 'content':
      return BookOpen;
    case 'notification':
    case 'notifications':
      return BellRing;
    case 'commerce':
    case 'order':
    case 'transaction':
      return DollarSign;
    case 'timetabling':
    case 'schedule':
      return CalendarClock;
    case 'security':
    case 'admin':
    case 'system':
      return Shield;
    default:
      return Shield;
  }
};

const resolveEventTimestamp = (event: AdminActivityEvent): string => {
  const timestamp = event.occurred_at ?? event.created_at ?? event.timestamp;
  if (!timestamp) return 'a few moments ago';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'a few moments ago';
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

const resolveEventSummary = (event: AdminActivityEvent): string =>
  event.summary ??
  event.message ??
  event.description ??
  event.title ??
  'Platform update recorded.';

const resolveEventCategoryLabel = (event: AdminActivityEvent): string | null => {
  const category =
    event.category ?? event.domain ?? event.event_type ?? event.type ?? null;
  return category ? formatStatusLabel(category) : null;
};

const resolveActorLabel = (event: AdminActivityEvent): string | null =>
  event.actor?.name ?? event.actor_name ?? event.actor_identifier ?? null;

const extractMetadataEntries = (event: AdminActivityEvent) => {
  const metadata = event.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }

  return Object.entries(metadata)
    .filter(
      ([, value]) =>
        value !== null &&
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean')
    )
    .slice(0, 3);
};

const selectPrimaryLink = (event: AdminActivityEvent) => {
  if (event.link?.href) {
    return event.link;
  }

  if (Array.isArray(event.links)) {
    return event.links.find(link => Boolean(link.href));
  }

  return undefined;
};

const buildDerivedEventsFromStatistics = (
  statistics?: AdminDashboardStats
): AdminActivityEvent[] => {
  if (!statistics) return [];

  const occurredAt = statistics.timestamp ?? undefined;
  const events: AdminActivityEvent[] = [];

  const userMetrics = statistics.user_metrics;
  const organizationMetrics = statistics.organization_metrics;
  const complianceMetrics = statistics.compliance_metrics;
  const communicationMetrics = statistics.communication_metrics;
  const adminMetrics = statistics.admin_metrics;
  const learningMetrics = statistics.learning_metrics;
  const commerceMetrics = statistics.commerce_metrics;
  const timetablingMetrics = statistics.timetabling_metrics;

  if (userMetrics) {
    const registrations = toNumber(userMetrics.new_registrations_7d);
    events.push({
      event_id: 'user-growth',
      category: 'users',
      summary: `${formatCount(registrations)} new user registrations in the last 7 days`,
      status: registrations > 0 ? 'success' : 'pending',
      occurred_at: occurredAt,
      metadata: {
        total_users: toNumber(userMetrics.total_users),
        active_24h: toNumber(userMetrics.active_users_24h),
      },
    });
  }

  if (organizationMetrics) {
    const pending = toNumber(organizationMetrics.pending_approvals);
    events.push({
      event_id: 'organization-approvals',
      category: 'organization',
      summary: `${formatCount(pending)} organizations pending approval`,
      status: pending > 0 ? 'warning' : 'success',
      occurred_at: occurredAt,
      metadata: {
        total: toNumber(organizationMetrics.total_organizations),
        active: toNumber(organizationMetrics.active_organizations),
      },
    });
  }

  if (complianceMetrics) {
    const pendingInstructors = toNumber(complianceMetrics.pending_instructor_verifications);
    const pendingCreators = toNumber(complianceMetrics.pending_course_creator_verifications);

    events.push({
      event_id: 'instructor-verification',
      category: 'admin',
      summary: `${formatCount(pendingInstructors)} instructor verifications awaiting review`,
      status: pendingInstructors > 0 ? 'warning' : 'success',
      occurred_at: occurredAt,
    });

    events.push({
      event_id: 'course-creator-verification',
      category: 'course',
      summary: `${formatCount(pendingCreators)} course creator applications pending review`,
      status: pendingCreators > 0 ? 'warning' : 'success',
      occurred_at: occurredAt,
    });
  }

  if (learningMetrics) {
    const published = toNumber(learningMetrics.published_courses);
    events.push({
      event_id: 'published-courses',
      category: 'course',
      summary: `${formatCount(published)} published courses available to learners`,
      status: published > 0 ? 'success' : 'pending',
      occurred_at: occurredAt,
      metadata: {
        total_courses: toNumber(learningMetrics.total_courses),
        active_enrollments: toNumber(learningMetrics.active_course_enrollments),
      },
    });
  }

  if (adminMetrics) {
    const actionsToday = toNumber(adminMetrics.admin_actions_today);
    events.push({
      event_id: 'admin-actions',
      category: 'admin',
      summary: `${formatCount(actionsToday)} admin actions recorded today`,
      status: actionsToday > 0 ? 'success' : 'pending',
      occurred_at: occurredAt,
      metadata: {
        active_sessions: toNumber(adminMetrics.active_admin_sessions),
      },
    });
  }

  if (communicationMetrics) {
    const pendingNotifications = toNumber(communicationMetrics.pending_notifications);
    events.push({
      event_id: 'pending-notifications',
      category: 'notifications',
      summary: `${formatCount(pendingNotifications)} notifications pending delivery`,
      status: pendingNotifications > 0 ? 'warning' : 'success',
      occurred_at: occurredAt,
    });
  }

  if (commerceMetrics) {
    const orders30d = toNumber(commerceMetrics.orders_last_30d);
    events.push({
      event_id: 'commerce-orders',
      category: 'commerce',
      summary: `${formatCount(orders30d)} orders captured in the last 30 days`,
      status: orders30d > 0 ? 'success' : 'pending',
      occurred_at: occurredAt,
    });
  }

  if (timetablingMetrics) {
    const sessionsNext7d = toNumber(timetablingMetrics.sessions_next_7d);
    events.push({
      event_id: 'timetabling-sessions',
      category: 'timetabling',
      summary: `${formatCount(sessionsNext7d)} sessions scheduled for the next 7 days`,
      status: sessionsNext7d > 0 ? 'success' : 'pending',
      occurred_at: occurredAt,
    });
  }

  return events;
};

const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const variant = resolveStatusVariant(status);
  const Icon = statusIconMap[variant];

  return (
    <Badge variant={variant} className='gap-1'>
      <Icon className='h-3 w-3' />
      {formatStatusLabel(status)}
    </Badge>
  );
};

export default function ActivityFeed({
  statistics,
  events,
  isLoading,
  isEventsLoading,
  error,
  onRetry,
}: ActivityFeedProps) {
  const derivedEvents =
    events.length === 0 ? buildDerivedEventsFromStatistics(statistics) : [];

  const items = events.length > 0 ? events : derivedEvents;
  const showLoading = isLoading || isEventsLoading;
  const isDerived = events.length === 0 && derivedEvents.length > 0;

  if (showLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events and actions across the platform</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className='h-20 w-full' />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='space-y-2'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events and actions across the platform</CardDescription>
          </div>
          {events.length > 0 && onRetry ? (
            <Button variant='outline' size='sm' onClick={() => onRetry()}>
              Refresh
            </Button>
          ) : null}
        </div>
        {isDerived ? (
          <Badge variant='outline' className='w-fit text-xs uppercase'>
            Derived from snapshot metrics
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && events.length === 0 ? (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='flex items-center justify-between gap-3'>
              <span>We could not load the activity feed. Showing snapshot insights instead.</span>
              {onRetry ? (
                <Button variant='secondary' size='sm' onClick={() => onRetry()}>
                  Try again
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <ScrollArea className='h-[400px] pr-4'>
          {items.length > 0 ? (
            <div className='space-y-4'>
              {items.map((event, index) => {
                const Icon = getEventIcon(event);
                const key = event.uuid ?? event.id ?? event.event_id ?? `event-${index}`;
                const status = resolveEventStatus(event);
                const statusBadge = getStatusBadge(status);
                const categoryLabel = resolveEventCategoryLabel(event);
                const actorLabel = resolveActorLabel(event);
                const timestamp = resolveEventTimestamp(event);
                const summary = resolveEventSummary(event);
                const metadataEntries = extractMetadataEntries(event);
                const link = selectPrimaryLink(event);

                return (
                  <div
                    key={key}
                    className='hover:bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 transition-colors md:flex-row md:items-center md:justify-between'
                  >
                    <div className='flex w-full flex-1 gap-4'>
                      <div className='bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full'>
                        <Icon className='text-primary h-5 w-5' />
                      </div>
                      <div className='flex flex-1 flex-col gap-2'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='text-sm font-medium'>
                            {actorLabel ? `${actorLabel} · ` : ''}
                            <span className='font-normal text-muted-foreground'>{summary}</span>
                          </p>
                          {categoryLabel ? (
                            <Badge variant='outline' className='text-xs uppercase'>
                              {categoryLabel}
                            </Badge>
                          ) : null}
                        </div>

                        {metadataEntries.length > 0 ? (
                          <div className='text-xs text-muted-foreground'>
                            <ul className='flex flex-wrap gap-x-4 gap-y-1'>
                              {metadataEntries.map(([key, value]) => (
                                <li key={key} className='flex items-center gap-1 capitalize'>
                                  <span className='uppercase tracking-wide'>{key}:</span>
                                  <span className='font-medium text-foreground'>
                                    {typeof value === 'number'
                                      ? value.toLocaleString()
                                      : String(value)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <p className='text-muted-foreground text-xs'>{timestamp}</p>
                      </div>
                    </div>

                    <div className='flex flex-shrink-0 items-center gap-3 self-start md:self-center'>
                      {statusBadge}
                      {link?.href ? (
                        <Button variant='ghost' size='sm' asChild>
                          <Link href={link.href}>
                            {link.label ?? 'View details'}
                            <ArrowRight className='ml-1 h-4 w-4' />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='flex h-32 flex-col items-center justify-center text-center text-sm text-muted-foreground'>
              <Shield className='mb-2 h-6 w-6' />
              No recent activity available yet.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
