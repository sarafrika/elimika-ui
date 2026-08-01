'use client';

import { OverviewSidebar } from './_components/OverviewSidebar';
import { StudentTable } from './_components/StudentTable';

export default function StudentsPage() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <div className='mx-auto p-4 sm:p-6'>
        <div className='flex flex-col gap-6 xl:flex-row'>
          <StudentTable />

          <OverviewSidebar />
        </div>
      </div>
    </div>
  );
}
