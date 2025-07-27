'use client';

import Loading from '@/components/Loading';
import { schemas } from '@/services/api/zod-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { StudentOnboardingForm } from './_components/student-onboarding-form';
import { useUserProfile } from '../../../context/profile-context';

const ProfileSchema = z.object({
  user: schemas.User,
  student: schemas.Student,
});

type ProfileType = z.infer<typeof ProfileSchema>;
type UserSchema = z.infer<typeof schemas.User>;

export default function StudentOnboardingPage() {
  const router = useRouter();
  // const { user, isLoading } = useUserStore()
  // const { data: session, status } = useSession()
  // const user = session?.user;
  const user = useUserProfile();

  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileType>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      user: {
        ...user,
        dob: new Date(user?.dob ?? Date.now()).toISOString(),
        created_date: new Date(user!.created_date ?? Date.now()).toISOString(),
        updated_date: new Date(user!.created_date ?? Date.now()).toISOString()
      },
      student: {
        user_uuid: user?.uuid,
      },
    },
  });

  if (!user?.uuid) {
    return <Loading />;
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <StudentOnboardingForm
      // userUuid={user.uuid}
      // isSubmitting={isPending}
      // onSubmit={handleSubmit}
      />
    </div>
  );
}
