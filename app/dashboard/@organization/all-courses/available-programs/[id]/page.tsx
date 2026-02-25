'use client';


import { useParams } from 'next/navigation';
import ProgramsEnrollmentPage from '../../../../_home-components/ProgramsEnrollmentPage';

const Page = () => {
  const params = useParams();
  const programId = params?.id as string;

  return (
    <ProgramsEnrollmentPage programId={programId as string} />
  )
}

export default Page