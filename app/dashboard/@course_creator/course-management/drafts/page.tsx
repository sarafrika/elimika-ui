'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { CourseCreatorEmptyState, CourseCreatorLoadingState } from '../../_components/loading-state';
import DraftCoursesComponent from './draftCourse-component';

function Page() {
  const { profile, isLoading } = useCourseCreator();

  if (isLoading) {
    return <CourseCreatorLoadingState headline='Loading your draft courses…' />;
  }

  if (!profile) {
    return <CourseCreatorEmptyState />;
  }

  return <DraftCoursesComponent courseCreatorId={profile.uuid as string} />;
}

export default Page;
