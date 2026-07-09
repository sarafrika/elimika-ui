'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Building2, GraduationCap, ShieldQuestion, Users } from 'lucide-react';
import { useUserProfile } from '@/context/profile-context';
import { relativeTimeFromNow } from '@/lib/date';
import { useAdminActivityFeed } from '@/services/admin';
import { getDashboardStatisticsOptions } from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
} from '../_components/ui';

const num = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

export default function OrganisationReportsPage() {
  const profile = useUserProfile();
  const isAdmin = profile?.user_domain?.includes('admin');

  const statsQuery = useQuery({
    ...getDashboardStatisticsOptions(),
    enabled: isAdmin,
  });

  const {
    data: activityFeed,
    isLoading: isActivityLoading,
    error: activityError,
  } = useAdminActivityFeed({ enabled: isAdmin });

  if (!isAdmin) {
    return (
      <div className={adminTheme.page}>
        <div className={adminTheme.pageStack}>
          <AdminPageHeader
            title='Reports & Analytics'
            description='Platform-wide insights across organisations, learners and content.'
          />
          <SectionCard title='Administrators only'>
            <div className='flex items-center gap-3 text-sm text-muted-foreground'>
              <ShieldQuestion className='size-5' />
              Reports and analytics are visible only to system administrators.
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data?.data ?? {};
  const org = stats.organisation_metrics ?? {};
  const users = stats.user_metrics ?? {};
  const learning = stats.learning_metrics ?? {};
  const isLoading = statsQuery.isLoading;

  const kpis = [
    { label: 'Organisations', value: num(org.total_organisations), icon: Building2, tone: 'info' as const },
    { label: 'Total users', value: num(users.total_users), icon: Users, tone: 'neutral' as const },
    {
      label: 'Published courses',
      value: num(learning.published_courses),
      icon: GraduationCap,
      tone: 'success' as const,
    },
    {
      label: 'Active enrollments',
      value: num(learning.active_course_enrollments),
      icon: Activity,
      tone: 'warning' as const,
    },
  ];

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Reports & Analytics'
          description='Platform-wide insights across organisations, learners and content.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {isLoading
            ? kpis.map(kpi => <StatCardSkeleton key={kpi.label} />)
            : kpis.map(kpi => (
                <StatCard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  icon={kpi.icon}
                  tone={kpi.tone}
                />
              ))}
        </div>

        <div className='grid gap-4 xl:grid-cols-2'>
          <SectionCard title='Organisations' description='Verification and status breakdown'>
            <DetailGrid
              items={[
                { label: 'Total', value: num(org.total_organisations) },
                { label: 'Active', value: num(org.active_organisations) },
                { label: 'Pending approval', value: num(org.pending_approvals) },
                { label: 'Suspended', value: num(org.suspended_organisations) },
              ]}
            />
          </SectionCard>

          <SectionCard title='Users' description='Registration and activity'>
            <DetailGrid
              items={[
                { label: 'Total users', value: num(users.total_users) },
                { label: 'Active (24h)', value: num(users.active_users_24h) },
                { label: 'New (7d)', value: num(users.new_registrations_7d) },
                { label: 'Suspended', value: num(users.suspended_accounts) },
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard title='Learning' description='Courses, programs and enrollment performance'>
          <DetailGrid
            columns={3}
            items={[
              { label: 'Published courses', value: num(learning.published_courses) },
              { label: 'Draft courses', value: num(learning.draft_courses) },
              { label: 'In review', value: num(learning.in_review_courses) },
              { label: 'Total enrollments', value: num(learning.total_course_enrollments) },
              { label: 'Active enrollments', value: num(learning.active_course_enrollments) },
              { label: 'New enrollments (7d)', value: num(learning.new_course_enrollments_7d) },
              { label: 'Training programs', value: num(learning.total_training_programs) },
              { label: 'Published programs', value: num(learning.published_training_programs) },
              { label: 'Program enrollments', value: num(learning.program_enrollments) },
            ]}
          />
        </SectionCard>

        <SectionCard title='Recent activity' description='Latest platform events'>
          {activityError ? (
            <p className='text-sm text-muted-foreground'>Unable to load activity.</p>
          ) : isActivityLoading ? (
            <p className='text-sm text-muted-foreground'>Loading activity…</p>
          ) : (activityFeed?.events?.length ?? 0) === 0 ? (
            <p className='text-sm text-muted-foreground'>No recent activity.</p>
          ) : (
            <ul className='space-y-3'>
              {activityFeed?.events?.slice(0, 10).map((event, index) => (
                <li
                  key={`${event.title}-${event.timestamp}-${index}`}
                  className='rounded-md border border-border/60 bg-muted/20 p-3'
                >
                  <p className='text-sm font-medium text-foreground'>{event.title ?? 'Event'}</p>
                  {event.description ? (
                    <p className='mt-0.5 text-xs text-muted-foreground'>{event.description}</p>
                  ) : null}
                  <p className='mt-0.5 text-xs text-muted-foreground'>
                    {event.timestamp ? relativeTimeFromNow(event.timestamp, '—') : '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
