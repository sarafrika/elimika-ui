import { redirect } from 'next/navigation';
import { auth } from '@/services/auth';
import { getUserByUuid } from '@/services/client/sdk.gen';
import InstructorOnboardingForm from '@/app/onboarding/_components/instructor-onboarding-form';
import { User } from '@/services/client';

interface PageProps {
  searchParams: Promise<{
    step?: string;
    error?: string;
    success?: string;
  }>;
}

export default async function InstructorOnboardingPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.uuid) {
    redirect('/auth/signin');
  }

  const params = await searchParams;
  const currentStep = parseInt(params.step || '0');
  const error = params.error;
  const success = params.success;

  let userData: User | null = null;
  try {
    const response = await getUserByUuid({
      path: { uuid: session.user.uuid },
    });

    if (response.data?.data) {
      userData = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    userData = null;
  }

  if (!userData?.uuid) {
    redirect('/auth/signin');
  }

  return (
    <InstructorOnboardingForm
      userUuid={userData.uuid}
      initialStep={currentStep}
      error={error}
      success={success}
      initialUserData={userData}
    />
  );
}