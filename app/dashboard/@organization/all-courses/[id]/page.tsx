'use client';

import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useStudent } from '../../../../../context/student-context';

type OrganizationCourseDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function CourseDetailsPage({ params }: OrganizationCourseDetailsPageProps) {
  const data = params?.id;
  const student = useStudent();

  return (
    <ReusableCourseDetailsPage
      courseId={data}
      handleEnroll={() => {}}
      userRole='organization'
      student_uuid={student?.uuid}
    />
  );
}
