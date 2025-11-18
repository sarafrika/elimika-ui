'use client';

import { CourseCreatorProvider } from '@/context/course-creator-context';
import type { CourseCreatorDashboardData } from '@/lib/types/course-creator';
import type { ReactNode } from 'react';

export default function CourseCreatorLayoutClient({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: CourseCreatorDashboardData;
}) {
  return <CourseCreatorProvider initialData={initialData}>{children}</CourseCreatorProvider>;
}
