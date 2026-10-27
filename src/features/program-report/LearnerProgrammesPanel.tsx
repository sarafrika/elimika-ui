'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramRemarksPanel } from './ProgramRemarksPanel';
import { ProgramReportView } from './ProgramReportView';
import { ProgramSkillsView } from './ProgramSkillsView';
import { useProgramReport, useStudentProgrammes } from './use-program-report';

type Audience = 'learner' | 'guardian' | 'instructor';

/** Every programme the caller may open for this learner, each with its report. */
export function LearnerProgrammesPanel({
  studentUuid,
  audience,
  printHref,
}: {
  studentUuid: string;
  audience: Audience;
  printHref?: (programUuid: string) => string;
}) {
  const programmes = useStudentProgrammes(studentUuid);
  if (programmes.isLoading) return <Skeleton className='h-48 w-full' />;
  const rows = programmes.data?.data ?? [];
  if (rows.length === 0)
    return (
      <EmptyState
        variant='compact'
        title='No programmes'
        description='This learner is not enrolled in a programme you can see.'
      />
    );
  return (
    <div className='flex flex-col gap-6'>
      {rows.map(row => (
        <LearnerProgrammeReport
          key={row.program_uuid}
          programUuid={row.program_uuid ?? ''}
          studentUuid={studentUuid}
          audience={audience}
          printHref={printHref?.(row.program_uuid ?? '')}
        />
      ))}
    </div>
  );
}

/** One programme's report, skills and remarks for the learner. */
export function LearnerProgrammeReport({
  programUuid,
  studentUuid,
  audience,
  printHref,
}: {
  programUuid: string;
  studentUuid: string;
  audience: Audience;
  printHref?: string;
}) {
  const query = useProgramReport(programUuid, studentUuid);
  const report = query.data?.data;
  if (query.isLoading) return <Skeleton className='h-48 w-full' />;
  if (!report) return <EmptyState variant='compact' title='Unable to load this programme report' />;
  if (audience === 'guardian')
    return <ProgramReportView report={report} audience='guardian' printHref={printHref} compact />;
  return (
    <div className='flex flex-col gap-5'>
      <ProgramReportView report={report} audience={audience} printHref={printHref} />
      <div className='bg-card rounded-2xl border p-5'>
        <ProgramSkillsView
          report={report}
          audience={audience === 'learner' ? 'learner' : 'instructor'}
        />
      </div>
      <div className='bg-card rounded-2xl border p-5'>
        <ProgramRemarksPanel report={report} canWrite={report.can_add_remarks === true} />
      </div>
    </div>
  );
}
