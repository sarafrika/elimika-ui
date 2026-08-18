'use client';

import AvailableClassesPage from '@/src/features/dashboard/courses/pages/AvailableClassesPage';
import { use } from 'react';

type WorkspaceAvailableClassesPageProps = {
  params: Promise<{
    domain: string;
    id: string;
  }>;
};

export default function WorkspaceAvailableClassesPage({
  params,
}: WorkspaceAvailableClassesPageProps) {
  const { id } = use(params);

  return <AvailableClassesPage courseId={id} instructorView={false} />;
}
