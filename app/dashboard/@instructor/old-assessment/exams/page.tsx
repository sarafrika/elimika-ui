'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useEffect } from 'react';
import { InstructorAssessmentWorkspace } from '../_components/instructor-assessment-workspace';

export default function ExamsPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'assessment', title: 'Assessment', url: '/dashboard/assessment' },
      {
        id: 'exams',
        title: 'Exams',
        url: '/dashboard/assessment/exams',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  return <InstructorAssessmentWorkspace embedded defaultTab='exams' />;
}
