import { ReactNode } from 'react';
import { getCourseCreatorDashboardData } from '@/services/course-creator/data';
import CourseCreatorLayoutClient from './layout-client';

export default async function CourseCreatorLayout({ children }: { children: ReactNode }) {
  const initialData = await getCourseCreatorDashboardData();
  return (
    <CourseCreatorLayoutClient initialData={initialData}>{children}</CourseCreatorLayoutClient>
  );
}
