import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getInstructorByUuid, getUserByUuid } from '@/services/client/sdk.gen';
import Spinner from '@/components/ui/spinner';
import InstructorProfile from './_component/InstructorProfile';
import { auth } from '@/services/auth';

async function getProfileData() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const userUuid = session.user.id;
  const instructorUuid = session.user?.instructor?.uuid || session.user.id;

  if (!userUuid) {
    redirect('/dashboard');
  }

  const [userResponse, instructorResponse] = await Promise.all([
    getUserByUuid({
      path: { uuid: userUuid },
      throwOnError: false
    }),
    getInstructorByUuid({
      path: { uuid: instructorUuid },
      throwOnError: false
    })
  ]);

  const user = userResponse.data;
  const instructor = instructorResponse.data;

  if (!user) {
    redirect('/dashboard');
  }

  return {
    user: {
      ...user,
      dob: user.dob ? new Date(user.dob).toISOString() : new Date().toISOString(),
      created_date: user.created_date ? new Date(user.created_date).toISOString() : new Date().toISOString(),
      updated_date: user.updated_date ? new Date(user.updated_date).toISOString() : new Date().toISOString()
    },
    instructor
  };
}

export default async function InstructorProfilePage() {
  const { user, instructor } = await getProfileData();

  return (
    <Suspense fallback={
      <div className='flex items-center justify-center p-8'>
        <Spinner />
      </div>
    }>
      <InstructorProfile user={user} instructor={instructor} />
    </Suspense>
  );
}