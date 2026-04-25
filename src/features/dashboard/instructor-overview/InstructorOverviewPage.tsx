'use client';

import { CalendarDays } from 'lucide-react';
import { OverviewClassInvitesPanel } from './_components/OverviewClassInvitesPanel';
import { OverviewCourseListPanel } from './_components/OverviewCourseListPanel';
import { OverviewEarningPanel } from './_components/OverviewEarningPanel';
import { OverviewHeader } from './_components/OverviewHeader';
import { OverviewLiveClassesPanel } from './_components/OverviewLiveClassesPanel';
import { OverviewStatCard } from './_components/OverviewStatCard';
import { OverviewUpcomingClassesPanel } from './_components/OverviewUpcomingClassesPanel';
import { useInstructorOverviewData } from './useInstructorOverviewData';

type InstructorOverviewPageProps = {
  firstName: string;
};

export function InstructorOverviewPage({ firstName }: InstructorOverviewPageProps) {
  const { activeCourses, classInvites, courseSummary, earningOverview, liveClasses, stats, upcomingClasses } =
    useInstructorOverviewData();

  return (
    <main className='w-full'>
      <div className='mx-auto max-w-[1480px] px-2 py-2 sm:px-3 lg:px-4'>
        <div className='space-y-3 border border-[#e6e8fb] bg-white p-3 sm:p-4'>
          <OverviewHeader firstName={firstName} />

          <section className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
            {stats.map(stat => (
              <OverviewStatCard key={stat.label} stat={stat} />
            ))}
          </section>

          <section className='grid gap-3 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,0.94fr)_minmax(240px,0.72fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,0.78fr)]'>
            <div className='space-y-3'>
              <OverviewCourseListPanel courses={activeCourses} summary={courseSummary} />
            </div>

            <div className='space-y-3'>
              <OverviewLiveClassesPanel liveClasses={liveClasses} />
              <OverviewEarningPanel earningOverview={earningOverview} />
            </div>

            <div className='grid gap-3'>
              <OverviewUpcomingClassesPanel upcomingClasses={upcomingClasses} />
              <OverviewClassInvitesPanel invites={classInvites} />
              <button
                type='button'
                className='flex max-h-[48px] w-full items-center justify-center gap-3 rounded-[10px] bg-cyan-600 px-4 py-3 text-center text-[0.96rem] font-medium text-white transition hover:bg-cyan-700'
              >
                <CalendarDays className='size-4 shrink-0' />
                <span>Invite Past Students</span>
                <span aria-hidden='true'>›</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
