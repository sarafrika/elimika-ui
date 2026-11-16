'use client';

import { type ReactNode, Suspense } from 'react';
import { CourseCreatorProvider } from '@/context/course-creator-context';
import type { CourseCreatorDashboardData } from '@/lib/types/course-creator';
import { ClassJobModals } from '@/src/features/organisation/class-builder/class-job-modals';

export default function OrganisationLayoutClient({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: CourseCreatorDashboardData;
}) {
  return (
    <CourseCreatorProvider initialData={initialData}>
      {children}
      <Suspense fallback={null}>
        <ClassJobModals />
      </Suspense>
    </CourseCreatorProvider>
  );
}
