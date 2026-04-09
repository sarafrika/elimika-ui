'use client';

import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useStudent } from '../../../../../context/student-context';

type AdminCourseDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function CourseDetailsPage({ params }: AdminCourseDetailsPageProps) {
  const data = params?.id;
  const student = useStudent();

  return (
    <ReusableCourseDetailsPage
      courseId={data}
      handleEnroll={() => {}}
      userRole='admin'
      student_uuid={student?.uuid}
    />
  );
}
