'use client';

import { useParams, useSearchParams } from 'next/navigation';
import ClassEnrollmentPage from '../../../../../_home-components/ClassEnrollmentPage';

const Page = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const courseId = params?.id as string;
  const classId = searchParams.get('id');

  return (
    <ClassEnrollmentPage classId={classId as string} courseId={courseId as string} />
  )
}

export default Page