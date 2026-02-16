'use client';

import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useRouter } from 'next/navigation';
import { useStudent } from '../../../../../context/student-context';

export default function CourseDetailsPage({ params }: any) {
  const data = params?.id;
  const router = useRouter();
  const student = useStudent();

  return (
    <ReusableCourseDetailsPage
      courseId={data}
      handleEnroll={() => {
        router.push(`/dashboard/browse-courses/enroll/${data}`);
      }}
      student_uuid={student?.uuid}
    />
  );
}
