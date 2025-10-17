'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { CourseCreatorEmptyState, CourseCreatorLoadingState } from '../../_components/loading-state';
import PublishedCoursesComponent from './publishedCourse-component';

function Page() {
  const { profile, isLoading } = useCourseCreator();

  if (isLoading) {
    return <CourseCreatorLoadingState headline='Gathering your published catalogue…' />;
  }

  if (!profile) {
    return <CourseCreatorEmptyState />;
  }

  return <PublishedCoursesComponent courseCreatorId={profile.uuid} />;
}

export default Page;
