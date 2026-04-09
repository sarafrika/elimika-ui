'use client';

import { CourseCreatorProvider } from '@/context/course-creator-context';
import { useCourseCreatorDashboardData } from '@/hooks/course-creator-data';
import CourseCreatorOverviewContent from '@/src/features/dashboard/workspace/pages/CourseCreatorOverviewContent';

export function CourseCreatorOverviewPage() {
  const { data } = useCourseCreatorDashboardData();

  return (
    <CourseCreatorProvider initialData={data}>
      <CourseCreatorOverviewContent />
    </CourseCreatorProvider>
  );
}
