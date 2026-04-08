import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { InstructorOnboardingForm } from '@/src/features/onboarding/forms/InstructorOnboardingForm';

export function InstructorOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <InstructorOnboardingForm />
    </OnboardingFormPageShell>
  );
}
