import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { OrganizationOnboardingForm } from '@/src/features/onboarding/forms/OrganizationOnboardingForm';

export function OrganisationOnboardingPage({ initialStep = 1 }: { initialStep?: 1 | 2 | 3 }) {
  return (
    <OnboardingFormPageShell>
      <OrganizationOnboardingForm key={initialStep} initialStep={initialStep} />
    </OnboardingFormPageShell>
  );
}
