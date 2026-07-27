'use client';

import type { ReactNode } from 'react';
import { useCourseCreatorDashboardData } from '../../../hooks/course-creator-data';
import CourseCreatorLayoutClient from './layout-client';

export default function CourseCreatorLayoutHook({ children }: { children: ReactNode }) {
  const { data: initialData } = useCourseCreatorDashboardData();

  return (
    <CourseCreatorLayoutClient initialData={initialData}>{children}</CourseCreatorLayoutClient>
  );
}
