"use client";

import { ProgramRecordPage } from '@/src/features/program-record';
import { useParams } from 'next/navigation';

export default function ProgramRoute() {
  const params = useParams();
  const programUuid = typeof params?.id === 'string' ? params.id : undefined;
  if (!programUuid) return null;
  return (
    <ProgramRecordPage
      programUuid={programUuid}
      backHref={'/dashboard/course-creator/course-management'}

    />
  );
}
