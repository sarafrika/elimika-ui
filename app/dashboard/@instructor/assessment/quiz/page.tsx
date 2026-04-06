'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useEffect } from 'react';
import { InstructorAssessmentWorkspace } from '../_components/instructor-assessment-workspace';

export default function QuizPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'assessment', title: 'Assessment', url: '/dashboard/assessment' },
      {
        id: 'quiz',
        title: 'Quizzes',
        url: '/dashboard/assessment/quiz',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  return <InstructorAssessmentWorkspace embedded defaultTab='tasks' defaultTaskType='quiz' />;
}
