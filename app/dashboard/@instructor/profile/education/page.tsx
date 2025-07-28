import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getInstructorEducation } from '@/services/client/sdk.gen';
import Spinner from '@/components/ui/spinner';
import EducationSettings from './_component/EducationForm';
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

  const educationResponse = await getInstructorEducation({
    path: { instructorUuid },
    throwOnError: false
  });

  const education = educationResponse.data?.data || [];

  return {
    instructor: { uuid: instructorUuid },
    education
  };
}

export default async function InstructorEducationPage() {
  const { instructor, education } = await getInstructorData();

  return (
    <Suspense fallback={
      <div className='flex items-center justify-center p-8'>
        <Spinner />
      </div>
    }>
      <EducationSettings
        instructor={instructor}
        instructorEducation={education}
      />
    </Suspense>
  );
}