'use client';

import { StudentOverviewActiveCoursesCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewActiveCoursesCard';
import { StudentOverviewHeroCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewHeroCard';
import { useStudentOverviewData } from '@/src/features/dashboard/workspace/student-overview/useStudentOverviewData';
import { useDeferredValue, useState } from 'react';
import { useUserProfile } from '../../../profile/context/profile-context';
import StudentOpportunities from './StudentOpportunities';

const matchesQuery = (value: string, query: string) =>
  query.trim() === '' || value.toLowerCase().includes(query.toLowerCase());

export default function StudentOverviewPage() {
  const [searchValue, setSearchValue] = useState('');
  const deferredSearch = useDeferredValue(searchValue);

  const profile = useUserProfile();
  const data = useStudentOverviewData();

  const filteredCourses = data.activeCourses.filter(
    course =>
      matchesQuery(course.title, deferredSearch) || matchesQuery(course.subtitle, deferredSearch)
  );

  const filteredOpportunities = data.opportunities.filter(
    opportunity =>
      matchesQuery(opportunity.role, deferredSearch) ||
      matchesQuery(opportunity.org, deferredSearch) ||
      matchesQuery(opportunity.location, deferredSearch)
  );

  return (
    <div className='bg-background mb-10 w-full max-w-[1480px] overflow-x-clip px-2 py-3 sm:px-3 sm:py-4 lg:px-4'>
      <div className='min-w-0 space-y-4'>
        <StudentOverviewHeroCard profile={profile} data={data} />

        <StudentOverviewActiveCoursesCard
          courses={filteredCourses}
          isLoading={data.isLoadingCourses}
          upcomingAssessments={data.assessments}
        />

        <StudentOpportunities
          opportunities={filteredOpportunities}
          classInvites={data?.studentClassInvite}
          data={data}
        />
      </div>
    </div>
  );
}
