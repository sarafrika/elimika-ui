'use client';

import { useSearchParams } from 'next/navigation';
import InstructorHirePage from '../../../../../src/features/dashboard/courses/shared/instructor/_components/instructor-hire-page';
import StudentInstructorSearchPage from '../../../../../src/features/dashboard/courses/shared/instructor/_components/student-instructor-search-page';

export default function StudentInstructorSearchRoute() {
  const searchParams = useSearchParams();
  const instructorId = searchParams.get('id');

  if (instructorId) {
    return (
      <InstructorHirePage
        courseId={searchParams.get('courseId')}
        instructorId={instructorId}
      />
    );
  }

  return <StudentInstructorSearchPage />;
}
