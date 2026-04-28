'use client';

import { StudentOverviewActiveCoursesCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewActiveCoursesCard';
import { StudentOverviewHeroCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewHeroCard';
import { StudentOverviewOpportunityCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewOpportunityCard';
import { StudentOverviewSearchBar } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewSearchBar';
import { StudentOverviewSkillsCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewSkillsCard';
import { useStudentOverviewData } from '@/src/features/dashboard/workspace/student-overview/useStudentOverviewData';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { startTransition, useDeferredValue, useState } from 'react';

const matchesQuery = (value: string, query: string) =>
  query.trim() === '' || value.toLowerCase().includes(query.toLowerCase());

export default function StudentOverviewPage() {
  const [searchValue, setSearchValue] = useState('');
  const deferredSearch = useDeferredValue(searchValue);
  const data = useStudentOverviewData();

  const filteredCourses = data.activeCourses.filter(
    course =>
      matchesQuery(course.title, deferredSearch) || matchesQuery(course.subtitle, deferredSearch)
  );

  const filteredOpportunities = data.opportunities.filter(
    opportunity =>
      matchesQuery(opportunity.title, deferredSearch) ||
      matchesQuery(opportunity.company, deferredSearch) ||
      matchesQuery(opportunity.location, deferredSearch)
  );

  return (
    <div className='mb-10 mx-auto w-full max-w-[1280px] overflow-x-clip bg-background px-1 py-3 sm:px-0 sm:py-4'>
      <div className='space-y-4 min-w-0'>
        <StudentOverviewSearchBar
          value={searchValue}
          onChange={value => {
            startTransition(() => setSearchValue(value));
          }}
          placeholder={data.searchPlaceholder}
        />

        <div className='grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(0,0.76fr)]'>
          <StudentOverviewHeroCard firstName={data.firstName} />

          <div className='grid min-w-0 gap-4'>
            <StudentOverviewSkillsCard
              progress={data.skillsProgress}
              verifiedSkills={data.verifiedSkills}
              newSkillsThisMonth={data.newSkillsThisMonth}
            />
            <StudentOverviewActiveCoursesCard
              courses={filteredCourses.length > 0 ? filteredCourses : data.activeCourses}
              isLoading={data.isLoadingCourses}
            />
          </div>
        </div>

        <section className='min-w-0 rounded-[22px] border border-border bg-card p-3.5 shadow-sm sm:p-6'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
            <h2 className='text-xl font-semibold tracking-tight text-foreground'>Opportunities</h2>
            <Link
              prefetch
              href='/dashboard/job-marketplace'
              className='inline-flex items-center gap-1 text-[0.84rem] font-medium text-primary transition hover:text-primary/80'
            >
              See All Jobs
              <ArrowRight className='size-4' />
            </Link>
          </div>

          <div className='w-full mt-3 grid min-w-0 gap-3 lg:grid-cols-2 min-[1500px]:grid-cols-3'>
            {(filteredOpportunities.length > 0
              ? filteredOpportunities
              : data.opportunities
            ).map(opportunity => (
              <StudentOverviewOpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>

          {filteredOpportunities?.length === 0 &&
            <div className="w-full mt-3 flex h-auto py-16 items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
              No opportunities available yet
            </div>
          }
        </section>
      </div>
    </div>
  );
}
