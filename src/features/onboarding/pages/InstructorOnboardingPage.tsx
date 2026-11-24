import { RegistrationSteps } from '@/src/features/onboarding/components/RegistrationSteps';
import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { InstructorOnboardingForm } from '@/src/features/onboarding/forms/InstructorOnboardingForm';

export function InstructorOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <RegistrationSteps role='instructor'>
        <InstructorOnboardingForm />
      </RegistrationSteps>
    </OnboardingFormPageShell>
  );
}
