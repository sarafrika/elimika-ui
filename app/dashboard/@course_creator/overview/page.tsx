'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { CourseCreatorEmptyState, CourseCreatorLoadingState } from '../_components/loading-state';
import CourseCreatorOverviewContent from './overview-content';

export default function CourseCreatorOverviewPage() {
  const { isLoading, profile } = useCourseCreator();

  if (isLoading) {
    return <CourseCreatorLoadingState />;
  }

  if (!profile) {
    return <CourseCreatorEmptyState />;
  }

  return <CourseCreatorOverviewContent />;
}
