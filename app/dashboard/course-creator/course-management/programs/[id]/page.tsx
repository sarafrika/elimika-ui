'use client';

import { useParams } from 'next/navigation';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { cn } from '@/lib/utils';
import { ProgramRecordPage } from '@/src/features/program-record';

export default function ProgramRoute() {
  const params = useParams();
  const programUuid = typeof params?.id === 'string' ? params.id : undefined;
  if (!programUuid) return null;
  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-4 py-4 pb-10')}>
      <ProgramRecordPage
        programUuid={programUuid}
        backHref='/dashboard/course-creator/course-management'
      />
    </div>
  );
}
