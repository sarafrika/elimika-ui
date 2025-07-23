'use client';

import React, { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { StudentOnboardingForm } from './_components/student-onboarding-form';
import Loading from '@/components/Loading';
import { fetchClient } from '@/services/api/fetch-client';
import { useUserStore } from '@/store/use-user-store';
import { getAuthToken } from '@/services/auth/get-token';
import { schemas } from '@/services/api/zod-client';
import { z } from 'zod';
import { tanstackClient } from '@/services/api/tanstack-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/context/user-context';

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
  const user = useUser();

  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileType>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      user: {
        ...user,
        dob: new Date(user?.dob ?? Date.now()).toISOString(),
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
