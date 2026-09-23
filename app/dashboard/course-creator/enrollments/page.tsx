'use client';

import { PageHeader } from '../../../../components/page-header';
import { CourseCreatorStudentsTable } from './_components/CourseCreatorStudentsTable';
import { surfaceTheme } from '@/components/data-display';

export default function EnrollmentsPage() {
  return (
    <main className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          title='Students'
          description='View every student enrolled in your courses and programs, then open a student record to review their course history.'
        />
        <CourseCreatorStudentsTable />
      </div>
    </main>
  );
}
