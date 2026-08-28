'use client';

import { PageHeader } from '../../../../components/page-header';
import { adminTheme } from '../../admin/_components/ui/admin-theme';
import { CourseCreatorStudentsTable } from './_components/CourseCreatorStudentsTable';

export default function EnrollmentsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <PageHeader
          title='Students'
          description='View every student enrolled in your courses and programs, then open a student record to review their course history.'
        />
        <CourseCreatorStudentsTable />
      </div>
    </main>
  );
}
