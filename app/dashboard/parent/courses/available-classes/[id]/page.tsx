'use client';

import { useParams } from 'next/navigation';
import AvailableClassesPage from '@/src/features/dashboard/courses/pages/AvailableClassesPage';

export default function ParentAvailableClassesRoute() {
  const params = useParams();
  const courseId = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');

  return <AvailableClassesPage courseId={courseId} instructorView={false} />;
}
