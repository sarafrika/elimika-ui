import { RegistrationSteps } from '@/src/features/onboarding/components/RegistrationSteps';
import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { OrganizationOnboardingForm } from '@/src/features/onboarding/forms/OrganizationOnboardingForm';

export function OrganisationOnboardingPage({ initialStep = 1 }: { initialStep?: 1 | 2 | 3 }) {
  return (
    <OnboardingFormPageShell>
      <RegistrationSteps role='organisation'>
        <OrganizationOnboardingForm key={initialStep} initialStep={initialStep} />
      </RegistrationSteps>
    </OnboardingFormPageShell>
  );
}
