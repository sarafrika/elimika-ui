'use client';

import { useParams } from 'next/navigation';
import CourseEnrollmentsPage from '../../../../_home-components/CourseEnrollmentsPage';

const Page = () => {
  const params = useParams();
  const courseId = params?.id as string;

  return <CourseEnrollmentsPage courseId={courseId as string} />;
};

export default Page;
