'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import { ProgramReportPrint } from '@/src/features/program-report/ProgramReportPrint';
import { useProgramReport } from '@/src/features/program-report/use-program-report';

/** The printable learner academic report, outside the dashboard shell so it prints clean. */
export default function ProgrammeReportPrintPage() {
  return (
    <Suspense fallback={<Skeleton className='mx-auto mt-8 h-96 max-w-[820px]' />}>
      <ProgrammeReportPrintContent />
    </Suspense>
  );
}

function ProgrammeReportPrintContent() {
  const params = useParams<{ programUuid: string; studentUuid: string }>();
  const autoPrint = useSearchParams().get('print') === '1';
  const query = useProgramReport(params.programUuid, params.studentUuid);
  const { studentMap } = useStudentsByIds(params.studentUuid ? [params.studentUuid] : []);
  const report = query.data?.success === false ? undefined : query.data?.data;
  if (query.isLoading) return <Skeleton className='mx-auto mt-8 h-96 max-w-[820px]' />;
  if (!report)
    return (
      <EmptyState
        title='This report is not available'
        description='You may not have access to it.'
      />
    );
  return (
    <ProgramReportPrint
      report={report}
      learnerName={studentMap[params.studentUuid]?.full_name ?? 'Learner'}
      autoPrint={autoPrint}
    />
  );
}
