'use client';

import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';
import { useRouter } from 'next/navigation';

export default function CourseDetailsPage({ params }: any) {
  const data = params?.id;
  const router = useRouter();

  return (
    <ReusableCourseDetailsPage
      courseId={data}
      handleEnroll={() => {
        router.push(`/dashboard/browse-courses/enroll/${data}`);
      }}
    />
  );
}
