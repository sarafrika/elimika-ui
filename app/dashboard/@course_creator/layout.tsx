'use client';

import type { ReactNode } from 'react';
import { useCourseCreatorDashboardData } from '../../../hooks/course-creator-data';
import CourseCreatorLayoutClient from './layout-client';

export default function CourseCreatorLayout({ children }: { children: ReactNode }) {
  // const initialData = await getCourseCreatorDashboardData();
  const { data: initialData } = useCourseCreatorDashboardData();

  return (
    <CourseCreatorLayoutClient initialData={initialData}>{children}</CourseCreatorLayoutClient>
  );
}
