import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { OrganizationOnboardingForm } from '@/src/features/onboarding/forms/OrganizationOnboardingForm';

export function OrganisationOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <OrganizationOnboardingForm />
    </OnboardingFormPageShell>
  );
}
