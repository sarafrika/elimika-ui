'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useEffect } from 'react';
import { InstructorAssessmentWorkspace } from './_components/instructor-assessment-workspace';

export default function AssessmentManagementPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'assessment', title: 'Assessment', url: '/dashboard/assessment', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  return <InstructorAssessmentWorkspace />;
}
