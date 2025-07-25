'use client';

import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { useUser } from '@/context/user-context';
import InstructorProfile from './_component/InstructorProfile';

export default function InstructorProfilePage() {
  const user = useUser();
  const instructor = useInstructor();
  return <>{user && instructor ? <InstructorProfile {...{
    user: {
      ...user,
      dob: new Date(user.dob ?? Date.now()).toISOString(),
      created_date: new Date(user.created_date ?? Date.now()).toISOString(),
      updated_date: new Date(user.created_date ?? Date.now()).toISOString()
    },
    instructor
  }} /> : <Spinner />}</>;
}
