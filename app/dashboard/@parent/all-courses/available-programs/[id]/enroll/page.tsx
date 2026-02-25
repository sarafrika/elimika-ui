'use client';

import { useParams, useSearchParams } from 'next/navigation';
import ProgramClassEnrollmentPage from '../../../../../_home-components/ProgramClassEnrollmentPage';

const Page = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const programId = params?.id as string;
  const classId = searchParams.get('id');

  return (
    <ProgramClassEnrollmentPage classId={classId as string} programId={programId as string} />
  )
}

export default Page