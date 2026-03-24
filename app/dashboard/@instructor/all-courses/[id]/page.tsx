'use client';

import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useStudent } from '../../../../../context/student-context';

export default function CourseDetailsPage({ params }: any) {
  const data = params?.id;
  const student = useStudent();

  return (
    <ReusableCourseDetailsPage
      courseId={data}
      handleEnroll={() => {}}
      userRole='instructor'
      student_uuid={student?.uuid}
    />
  );
}
