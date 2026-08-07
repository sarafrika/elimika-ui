'use client';

import { useRouter } from 'next/navigation';
import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useStudent } from '@/context/student-context';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';

type CourseDetailsPageProps = {
  courseId: string;
};

export default function CourseDetailsPage({ courseId }: CourseDetailsPageProps) {
  const router = useRouter();
  const { activeDomain } = useUserDomain();
  const student = useStudent();

  return (
    <ReusableCourseDetailsPage
      courseId={courseId}
      handleEnroll={() => {
        router.push(
          buildWorkspaceAliasPath(activeDomain, `/dashboard/courses/available-classes/${courseId}`)
        );
      }}
      student_uuid={student?.uuid}
    />
  );
}
