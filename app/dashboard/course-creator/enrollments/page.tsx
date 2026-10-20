'use client';

import { surfaceTheme } from '@/components/data-display';
import { PageHeader } from '../../../../components/page-header';
import { CourseCreatorStudentsTable } from './_components/CourseCreatorStudentsTable';

export default function EnrollmentsPage() {
  return (
    <main className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='ENROLLMENT'
          title='Course & Program Enrollments'
          description='View classes delivering your courses and the number of students enrolled in each class.'
        />
        <CourseCreatorStudentsTable />
      </div>
    </main>
  );
}


