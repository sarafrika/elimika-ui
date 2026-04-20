'use client';

import { useRouter } from 'next/navigation';
import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useStudent } from '@/context/student-context';

type CourseDetailsPageProps = {
  courseId: string;
};

export default function CourseDetailsPage({ courseId }: CourseDetailsPageProps) {
  const router = useRouter();
  const student = useStudent();

  return (
    <ReusableCourseDetailsPage
      courseId={courseId}
      handleEnroll={() => {
        router.push(`/dashboard/courses/enroll/${courseId}`);
      }}
      student_uuid={student?.uuid}
    />
  );
}
