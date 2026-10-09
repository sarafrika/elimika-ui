'use client';

import { AsyncSection } from '@/components/data/async-section';
import { WelcomeBanner } from '../../../../components/dashboard';
import { Skeleton } from '../../../../components/ui/skeleton';
import { OverviewClassInvitesPanel } from './_components/OverviewClassInvitesPanel';
import { OverviewCourseListPanel } from './_components/OverviewCourseListPanel';
import { OverviewEarningPanel } from './_components/OverviewEarningPanel';
import { OverviewLiveClassesPanel } from './_components/OverviewLiveClassesPanel';
import { OverviewStatCard } from './_components/OverviewStatCard';
import { OverviewUpcomingClassesPanel } from './_components/OverviewUpcomingClassesPanel';
import {
  buildCourseSummary,
  buildOverviewStats,
  type OverviewClassesSource,
  useOverviewAssignmentCount,
  useOverviewClasses,
  useOverviewClassInvites,
  useOverviewCourses,
  useOverviewEarnings,
  useOverviewLiveClasses,
  useOverviewUpcomingClasses,
} from './useInstructorOverviewData';

type InstructorOverviewPageProps = {
  firstName: string;
};

const dateLabel = () =>
  new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const PanelSkeleton = ({ className = 'h-96' }: { className?: string }) => (
  <Skeleton className={`${className} w-full rounded-2xl`} />
);

function StatsSection({ source }: { source: OverviewClassesSource }) {
  const courses = useOverviewCourses(source);
  const assignments = useOverviewAssignmentCount(source.classes);

  return (
    <AsyncSection
      name='instructor-overview-stats'
      loading={courses.isLoading}
      error={source.error}
      onRetry={source.refetch}
      skeleton={
        <section className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
          {[0, 1, 2, 3].map(idx => (
            <Skeleton key={idx} className='h-28 w-full rounded-2xl' />
          ))}
        </section>
      }
    >
      <section className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
        {buildOverviewStats(courses, assignments).map(stat => (
          <OverviewStatCard key={stat.label} stat={stat} />
        ))}
      </section>
    </AsyncSection>
  );
}

function CoursesSection({ source }: { source: OverviewClassesSource }) {
  const courses = useOverviewCourses(source);
  const assignments = useOverviewAssignmentCount(source.classes);

  return (
    <AsyncSection
      name='instructor-overview-courses'
      loading={courses.isLoading}
      error={source.error}
      onRetry={source.refetch}
      skeleton={<PanelSkeleton />}
    >
      <OverviewCourseListPanel
        courses={courses.activeCourses}
        summary={buildCourseSummary(courses, assignments)}
      />
    </AsyncSection>
  );
}

function UpcomingSection({ source }: { source: OverviewClassesSource }) {
  const { upcomingClasses, isLoading } = useOverviewUpcomingClasses(source);

  return (
    <AsyncSection
      name='instructor-overview-upcoming'
      loading={isLoading}
      error={source.error}
      onRetry={source.refetch}
      skeleton={<PanelSkeleton className='h-64' />}
    >
      <OverviewUpcomingClassesPanel upcomingClasses={upcomingClasses} />
    </AsyncSection>
  );
}

function LiveSection({ source }: { source: OverviewClassesSource }) {
  const { liveClasses, isLoading } = useOverviewLiveClasses(source);

  return (
    <AsyncSection
      name='instructor-overview-live'
      loading={isLoading}
      error={source.error}
      onRetry={source.refetch}
      skeleton={<PanelSkeleton />}
    >
      <OverviewLiveClassesPanel liveClasses={liveClasses} />
    </AsyncSection>
  );
}

function EarningSection() {
  const { earningOverview, isLoading, error, refetch } = useOverviewEarnings();

  return (
    <AsyncSection
      name='instructor-overview-earnings'
      loading={isLoading}
      error={error}
      onRetry={refetch}
      skeleton={<PanelSkeleton className='h-64' />}
    >
      <OverviewEarningPanel earningOverview={earningOverview} />
    </AsyncSection>
  );
}

function InvitesSection({ source }: { source: OverviewClassesSource }) {
  const { classInvites, isLoading } = useOverviewClassInvites(source);

  return (
    <AsyncSection
      name='instructor-overview-invites'
      loading={isLoading}
      error={source.error}
      onRetry={source.refetch}
      skeleton={<PanelSkeleton className='h-48' />}
    >
      <OverviewClassInvitesPanel invites={classInvites} />
    </AsyncSection>
  );
}

export function InstructorOverviewPage({ firstName }: InstructorOverviewPageProps) {
  // One shared, non-blocking class source; every section resolves on its own inputs.
  const source = useOverviewClasses();

  return (
    <main className='mb-20 w-full'>
      <div className='px-2 py-2 sm:px-3 lg:px-4'>
        <div className='space-y-3'>
          <WelcomeBanner
            eyebrow={dateLabel()}
            title={`Welcome back, ${firstName}`}
            description={
              firstName
                ? `Here's your teaching overview for today, including your classes, students, and upcoming sessions.`
                : 'Here’s your teaching overview, including classes, students, and upcoming sessions.'
            }
            className='bg-primary/95'
          />

          <StatsSection source={source} />

          <section className='grid min-w-0 gap-4 overflow-x-hidden xl:grid-cols-2'>
            <div className='min-w-0 space-y-4 overflow-hidden'>
              <CoursesSection source={source} />
              <UpcomingSection source={source} />
            </div>

            <div className='min-w-0 space-y-4 overflow-hidden'>
              <LiveSection source={source} />
              <EarningSection />
            </div>

            <div className='xl:col-span-2'>
              <InvitesSection source={source} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
