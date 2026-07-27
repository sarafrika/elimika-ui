'use client';

import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useStudent } from '../../../../../context/student-context';

type ParentCourseDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function CourseDetailsPage({ params }: ParentCourseDetailsPageProps) {
  const data = params?.id;
  const student = useStudent();

  return (
    <ReusableCourseDetailsPage
      courseId={data}
      handleEnroll={() => {}}
      student_uuid={student?.uuid}
    />
  );
}
