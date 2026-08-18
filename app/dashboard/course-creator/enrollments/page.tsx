'use client';

import { adminTheme } from '../../admin/_components/ui/admin-theme';
import { AdminPageHeader } from '../../admin/_components/ui/AdminPageHeader';
import { CourseCreatorEnrollmentsTable } from './_components/CourseCreatorEnrollmentsTable';

export default function EnrollmentsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Enrollments'
          description='Browse every course and program you created, then open a roster to review enrolled students.'
        />
        <CourseCreatorEnrollmentsTable />
      </div>
    </main>
  );
}
