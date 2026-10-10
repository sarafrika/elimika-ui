'use client';

import { useParams } from 'next/navigation';
import AvailableProgramsPage from '@/src/features/dashboard/courses/pages/AvailableProgramsPage';

export default function ParentAvailableProgramsRoute() {
  const params = useParams();
  const programId = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');

  return <AvailableProgramsPage programId={programId} />;
}
