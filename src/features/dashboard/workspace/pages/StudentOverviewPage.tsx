'use client';

import { LazySection } from '@/components/data/lazy-section';
import { StudentOverviewActiveCoursesCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewActiveCoursesCard';
import { StudentOverviewAssessmentsCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewAssessmentsCard';
import { StudentOverviewHeroCard } from '@/src/features/dashboard/workspace/student-overview/_components/StudentOverviewHeroCard';
import type {
  StudentClassInvite,
  StudentOverviewOpportunity,
} from '@/src/features/dashboard/workspace/student-overview/useStudentOverviewData';
import { CourseRecommendationsCard } from '@/src/features/recommendations/course-recommendation-rail';
import { useUserProfile } from '../../../profile/context/profile-context';
import StudentOpportunities from './StudentOpportunities';

// Placement matching and class invites have no backend yet; both cards show empty states.
const NO_OPPORTUNITIES: StudentOverviewOpportunity[] = [];
const NO_CLASS_INVITES: StudentClassInvite[] = [];

/** Each card owns its queries and loading state, so no section waits on another. */
export default function StudentOverviewPage() {
  const profile = useUserProfile();

  return (
    <div className='bg-background mb-10 w-full max-w-[1480px] overflow-x-clip px-2 py-3 sm:px-3 sm:py-4 lg:px-4'>
      <div className='min-w-0 space-y-4'>
        <StudentOverviewHeroCard profile={profile} />

        <section className='grid gap-4 lg:grid-cols-3'>
          <StudentOverviewActiveCoursesCard />
          <StudentOverviewAssessmentsCard />
        </section>

        <LazySection minHeight={280}>
          <CourseRecommendationsCard courseHref={uuid => `/dashboard/student/courses/${uuid}`} />
        </LazySection>

        <LazySection minHeight={420}>
          <StudentOpportunities opportunities={NO_OPPORTUNITIES} classInvites={NO_CLASS_INVITES} />
        </LazySection>
      </div>
    </div>
  );
}
