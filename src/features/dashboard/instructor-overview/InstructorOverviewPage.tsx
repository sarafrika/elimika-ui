'use client';

import { CalendarDays } from 'lucide-react';
import { WelcomeBanner } from '../../../../components/dashboard';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import { OverviewClassInvitesPanel } from './_components/OverviewClassInvitesPanel';
import { OverviewCourseListPanel } from './_components/OverviewCourseListPanel';
import { OverviewEarningPanel } from './_components/OverviewEarningPanel';
import { OverviewLiveClassesPanel } from './_components/OverviewLiveClassesPanel';
import { OverviewStatCard } from './_components/OverviewStatCard';
import { OverviewUpcomingClassesPanel } from './_components/OverviewUpcomingClassesPanel';
import { useInstructorOverviewData } from './useInstructorOverviewData';

type InstructorOverviewPageProps = {
  firstName: string;
};

const dateLabel = () =>
  new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export function InstructorOverviewPage({ firstName }: InstructorOverviewPageProps) {
  const {
    activeCourses,
    classInvites,
    courseSummary,
    earningOverview,
    liveClasses,
    stats,
    upcomingClasses,
    isLoading,
  } = useInstructorOverviewData();

  if (isLoading) {
    return (
      <main className='mb-20 w-full'>
        <div className='space-y-3 px-2 py-2 sm:px-3 lg:px-4'>
          <Skeleton className='h-16 w-full rounded-2xl' />
          <div className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
            {[0, 1, 2, 3].map(idx => (
              <Skeleton key={idx} className='h-28 w-full rounded-2xl' />
            ))}
          </div>
          <div className='grid gap-3 xl:grid-cols-3'>
            {[0, 1, 2].map(idx => (
              <Skeleton key={idx} className='h-96 w-full rounded-2xl' />
            ))}
          </div>
        </div>
      </main>
    );
  }

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

          <section className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
            {stats.map(stat => <OverviewStatCard key={stat.label} stat={stat} />)}
          </section>

          <section className='grid min-w-0 gap-4 overflow-x-hidden xl:grid-cols-2'>
            <div className='min-w-0 space-y-4 overflow-hidden'>
              <OverviewCourseListPanel courses={activeCourses} summary={courseSummary} />
              <OverviewUpcomingClassesPanel upcomingClasses={upcomingClasses} />
            </div>

            <div className='min-w-0 space-y-4 overflow-hidden'>
              <OverviewLiveClassesPanel liveClasses={liveClasses} />
              <OverviewEarningPanel earningOverview={earningOverview} />
            </div>

            <div className='xl:col-span-2'>
              <OverviewClassInvitesPanel invites={classInvites} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
