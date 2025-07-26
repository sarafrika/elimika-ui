'use client';

import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { useUser } from '@/context/user-context';
import InstructorProfile from './_component/InstructorProfile';

export default function InstructorProfilePage() {
  const user = useUser();
  const instructor = useInstructor();

  return (
    <>
      {user && instructor ? (
        <InstructorProfile {...{ user, instructor }} />
      ) : (
        <div className='flex items-center justify-center'>
          <Spinner />
        </div>
      )}
    </>
  );
}
