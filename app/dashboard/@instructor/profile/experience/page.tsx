import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getInstructorExperience } from '@/services/client/sdk.gen';
import Spinner from '@/components/ui/spinner';
import ProfessionalExperienceSettings from './_component/InstructorExperienceForm';
import { auth } from '@/services/auth';

async function getInstructorData() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const instructorUuid = session.user.uuid;

  if (!instructorUuid) {
    redirect('/dashboard');
  }

  const experienceResponse = await getInstructorExperience({
    path: { instructorUuid },
    throwOnError: false
  });

  const experience = experienceResponse.data?.data?.content || [];

  return {
    instructor: { uuid: instructorUuid },
    experience
  };
}

export default async function InstructorExperiencePage() {
  const { instructor, experience } = await getInstructorData();

  return (
    <Suspense fallback={
      <div className='flex items-center justify-center p-8'>
        <Spinner />
      </div>
    }>
      <ProfessionalExperienceSettings
        instructor={instructor}
        instructorExperience={experience}
      />
    </Suspense>
  );
}