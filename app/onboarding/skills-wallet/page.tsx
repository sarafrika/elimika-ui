import { ApplicationSkillsWallet } from '@/src/features/onboarding/components/ApplicationSkillsWallet';
import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

export default async function ApplicationSkillsWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;

  return (
    <OnboardingFormPageShell>
      <ApplicationSkillsWallet domain={normalizeStoredUserDomain(domain) ?? undefined} />
    </OnboardingFormPageShell>
  );
}
