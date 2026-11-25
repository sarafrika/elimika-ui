import { redirect } from 'next/navigation';
import { ProfileProviders } from '@/context/profile-providers';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { getRequestSession } from '@/src/features/dashboard/server/entry-target';
import { ApplicationWaitingScreen } from '@/src/features/onboarding/components/ApplicationWaitingScreen';
import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';

export default async function AwaitingApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const session = await getRequestSession();
  if (!session?.user) redirect('/');
  const { domain } = await searchParams;
  return (
    <ProfileProviders>
      <OnboardingFormPageShell>
        <ApplicationWaitingScreen preferredDomain={normalizeStoredUserDomain(domain)} />
      </OnboardingFormPageShell>
    </ProfileProviders>
  );
}
