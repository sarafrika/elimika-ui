import { RegistrationSteps } from '@/src/features/onboarding/components/RegistrationSteps';
import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { OrganizationOnboardingForm } from '@/src/features/onboarding/forms/OrganizationOnboardingForm';

export function OrganisationOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <RegistrationSteps role='organisation'>
        <OrganizationOnboardingForm />
      </RegistrationSteps>
    </OnboardingFormPageShell>
  );
}
