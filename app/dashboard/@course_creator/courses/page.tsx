'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { CourseCreatorEmptyState, CourseCreatorLoadingState } from '../_components/loading-state';
import CourseCreatorCoursesContent from './courses-content';

export default function CourseCreatorCoursesPage() {
  const { isLoading, profile } = useCourseCreator();

  if (isLoading) {
    return <CourseCreatorLoadingState headline='Loading your course catalogue…' />;
  }

  if (!profile) {
    return <CourseCreatorEmptyState />;
  }

  return <CourseCreatorCoursesContent />;
}
