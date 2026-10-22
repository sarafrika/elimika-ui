'use client';

import { OverviewSidebar } from '../../students/_components/OverviewSidebar';
import { StudentTable } from '../../students/_components/StudentTable';
import { useInstructorStudentsData } from '../../students/data';
import type { RosterScope } from './enrollment-filters';

export function EnrollmentStudentsTab({ scope }: { scope: RosterScope }) {
  const data = useInstructorStudentsData(scope);

  return (
    <div className='flex flex-col gap-6 xl:flex-row'>
      <StudentTable data={data} />
      <OverviewSidebar data={data} />
    </div>
  );
}
