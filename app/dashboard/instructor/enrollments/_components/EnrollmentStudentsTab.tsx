'use client';

import { OverviewSidebar } from '../../students/_components/OverviewSidebar';
import { StudentTable } from '../../students/_components/StudentTable';
import { useInstructorStudentsData } from '../../students/data';
import type { RosterScope } from './enrollment-filters';

export function EnrollmentStudentsTab({ scope }: { scope: RosterScope }) {
  const data = useInstructorStudentsData(scope);

  return (
    <div className='bg-muted/20 flex w-full min-w-0 flex-col gap-5 rounded-2xl p-3 sm:p-4 lg:p-6'>
      <StudentTable data={data} />
      <OverviewSidebar data={data} />
    </div>
  );
}
