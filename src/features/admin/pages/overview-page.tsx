'use client';

import { ArrowRight, Building2, BookOpen, ShoppingCart, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatDate, formatDateTime } from '@/lib/date';
import { formatCount, toNumber } from '@/lib/metrics';
import type { AdminActivityEvent } from '@/services/client';
import { SectionBoundary } from '../components/section-boundary';
import { useAdminActivity, useAdminStatistics } from '../hooks/use-admin-dashboard';
import { adminRoutes, type InboxType } from '../lib/admin-routes';

export function AdminOverviewPage() {
  const { statistics, query: statisticsQuery } = useAdminStatistics();
  const { events, query: activityQuery } = useAdminActivity();

  const compliance = statistics?.compliance_metrics;
  const organisations = statistics?.organisation_metrics;
  const content = statistics?.content_metrics;
  const users = statistics?.user_metrics;
  const learning = statistics?.learning_metrics;
  const commerce = statistics?.commerce_metrics;
  const performance = statistics?.system_performance;

  const queues = useMemo(
    () => [
      {
        type: 'documents' as InboxType,
        label: 'Documents to verify',
        hint: 'Instructor credentials',
        count: toNumber(compliance?.pending_instructor_documents),
      },
      {
        type: 'instructors' as InboxType,
        label: 'Instructor profiles',
        hint: 'Awaiting verification',
        count: toNumber(compliance?.pending_instructor_verifications),
      },
      {
        type: 'creators' as InboxType,
        label: 'Course creators',
        hint: 'Awaiting verification',
        count: toNumber(compliance?.pending_course_creator_verifications),
      },
      {
        type: 'organisations' as InboxType,
        label: 'Organisations',
        hint: 'Registration review',
        count: toNumber(organisations?.pending_approvals),
      },
      {
        type: 'courses' as InboxType,
        label: 'Courses in review',
        hint: 'Submitted for approval',
        count: toNumber(content?.pending_moderation),
      },
    ],
    [compliance, organisations, content]
  );

  const waiting = queues.reduce((total, queue) => total + queue.count, 0);

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow={formatDate(new Date())}
          title='Admin console'
          description={
            statisticsQuery.isLoading
              ? 'Counting what is waiting for a decision…'
              : waiting > 0
                ? `${waiting} ${waiting === 1 ? 'item is' : 'items are'} waiting for a decision.`
                : 'Nothing is waiting for a decision right now.'
          }
          actions={
            <Button asChild className='rounded-md'>
              <Link href={adminRoutes.inbox()}>
                Open review inbox
                <ArrowRight className='ml-2 size-4' />
              </Link>
            </Button>
          }
        />

        <SectionBoundary
          label='the decision queues'
          loading={statisticsQuery.isLoading && !statistics}
          error={statisticsQuery.error}
          onRetry={() => statisticsQuery.refetch()}
          skeleton={<SectionCardSkeleton rows={3} />}
          errorTitle='Couldn’t load the decision queues'
        >
          <section className='bg-primary text-primary-foreground rounded-md p-6'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
              <div className='space-y-1'>
                <p className='text-primary-foreground/70 text-xs font-semibold tracking-wide uppercase'>
                  Needs your decision
                </p>
                <p className='text-xl font-semibold'>
                  {waiting > 0
                    ? `${waiting} across ${queues.filter(queue => queue.count > 0).length} ${
                        queues.filter(queue => queue.count > 0).length === 1 ? 'queue' : 'queues'
                      }`
                    : 'Inbox zero'}
                </p>
              </div>
              <Button asChild variant='secondary' className='rounded-md'>
                <Link href={adminRoutes.inbox()}>Start reviewing</Link>
              </Button>
            </div>

            <div className='mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
              {queues.map(queue => (
                <Link
                  key={queue.type}
                  href={adminRoutes.inbox(queue.type)}
                  className='border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/15 flex items-center gap-3 rounded-md border px-4 py-3 transition-colors'
                >
                  <span className='min-w-0 flex-1'>
                    <span className='block text-sm font-semibold'>{queue.label}</span>
                    <span className='text-primary-foreground/70 block text-xs'>{queue.hint}</span>
                  </span>
                  <span className='font-mono text-xl'>{queue.count}</span>
                </Link>
              ))}
            </div>

            <p className='text-primary-foreground/70 mt-4 text-xs'>
              Course edits are counted in the inbox itself — the statistics payload has no count
              for them.
            </p>
          </section>
        </SectionBoundary>

        <SectionBoundary
          label='the platform counts'
          loading={statisticsQuery.isLoading && !statistics}
          error={statisticsQuery.error}
          onRetry={() => statisticsQuery.refetch()}
          skeleton={
            <div className='grid gap-4 lg:grid-cols-4'>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          }
          errorTitle='Couldn’t load the platform counts'
        >
          <div className='grid gap-4 lg:grid-cols-4'>
            <StatCard
              label='People'
              value={formatCount(users?.total_users)}
              hint={`${formatCount(users?.active_users_24h, '0')} active today · ${formatCount(
                users?.new_registrations_7d,
                '0'
              )} new this week`}
              icon={Users}
            />
            <StatCard
              label='Organisations'
              value={formatCount(organisations?.total_organisations)}
              hint={`${formatCount(organisations?.active_organisations, '0')} active · ${formatCount(
                organisations?.suspended_organisations,
                '0'
              )} suspended`}
              icon={Building2}
              tone='success'
            />
            <StatCard
              label='Courses'
              value={formatCount(learning?.total_courses ?? content?.total_courses)}
              hint={`${formatCount(learning?.published_courses, '0')} published · ${formatCount(
                learning?.in_review_courses,
                '0'
              )} in review`}
              icon={BookOpen}
              tone='warning'
            />
            <StatCard
              label='Orders'
              value={formatCount(commerce?.total_orders)}
              hint={`${formatCount(commerce?.unique_customers, '0')} customers · ${formatCount(
                commerce?.captured_orders,
                '0'
              )} captured`}
              icon={ShoppingCart}
              tone='neutral'
            />
          </div>
        </SectionBoundary>

        <div className='grid gap-4 lg:grid-cols-3'>
          <ActivitySection
            events={events}
            isLoading={activityQuery.isLoading && events.length === 0}
            error={activityQuery.error}
            onRetry={() => activityQuery.refetch()}
          />

          <SectionBoundary
            label='platform health'
            loading={statisticsQuery.isLoading && !statistics}
            error={statisticsQuery.error}
            onRetry={() => statisticsQuery.refetch()}
            skeleton={<SectionCardSkeleton rows={4} />}
            errorTitle='Couldn’t load platform health'
          >
            <SectionCard
              title='Platform health'
              actions={<StatusBadge status={statistics?.overall_health} />}
            >
              <DetailGrid
                columns={1}
                items={[
                  { label: 'Uptime', value: performance?.server_uptime ?? '—' },
                  {
                    label: 'Average response',
                    value: performance?.average_response_time ?? '—',
                  },
                  { label: 'Error rate', value: performance?.error_rate ?? '—' },
                  { label: 'Storage used', value: performance?.storage_usage ?? '—' },
                ]}
              />
            </SectionCard>
          </SectionBoundary>
        </div>
      </div>
    </div>
  );
}

function ActivitySection({
  events,
  isLoading,
  error,
  onRetry,
}: {
  events: AdminActivityEvent[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const [hideViews, setHideViews] = useState(true);

  const visible = useMemo(
    () =>
      hideViews
        ? events.filter(event => (event.http_method ?? '').toUpperCase() !== 'GET')
        : events,
    [events, hideViews]
  );

  return (
    <div className='lg:col-span-2'>
      <SectionBoundary
        label='recent activity'
        loading={isLoading}
        error={error}
        onRetry={onRetry}
        skeleton={<SectionCardSkeleton rows={6} />}
        errorTitle='Couldn’t load recent activity'
      >
        <SectionCard
          title='Recent activity'
          description='Admin requests, newest first.'
          bodyClassName='p-0'
          actions={
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Switch id='hide-views' checked={hideViews} onCheckedChange={setHideViews} />
                <Label htmlFor='hide-views' className='text-muted-foreground text-xs'>
                  Hide views
                </Label>
              </div>
              <Link
                href={adminRoutes.activity()}
                className='text-primary text-sm font-semibold hover:underline'
              >
                Open activity log
              </Link>
            </div>
          }
        >
          {visible.length === 0 ? (
            <p className='text-muted-foreground px-5 py-8 text-center text-sm'>
              {events.length === 0
                ? 'No admin activity recorded yet.'
                : 'Every event on this page is a view. Turn off “Hide views” to see them.'}
            </p>
          ) : (
            <ul className='divide-border/60 divide-y'>
              {visible.map(event => (
                <li
                  key={event.event_uuid}
                  className='flex flex-wrap items-center gap-3 px-5 py-3 text-sm'
                >
                  <Badge variant='outline' className='rounded-sm font-mono text-[11px]'>
                    {event.http_method ?? '—'}
                  </Badge>
                  <span className='text-foreground min-w-0 flex-1'>
                    <span className='font-medium'>{event.actor_name ?? 'Someone'}</span>{' '}
                    {event.summary ?? event.endpoint ?? 'made a request'}
                  </span>
                  {typeof event.response_status === 'number' ? (
                    <StatusBadge
                      label={String(event.response_status)}
                      tone={event.response_status >= 400 ? 'destructive' : 'neutral'}
                    />
                  ) : null}
                  <span className='text-muted-foreground font-mono text-xs whitespace-nowrap'>
                    {formatDateTime(event.occurred_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className='text-muted-foreground border-border/60 border-t px-5 py-3 text-xs'>
            Hiding views filters the rows already loaded. Filtering by date, actor or action needs
            a backend change.
          </p>
        </SectionCard>
      </SectionBoundary>
    </div>
  );
}
