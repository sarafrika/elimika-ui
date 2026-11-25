import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { ParentOnboardingForm } from '@/src/features/onboarding/forms/ParentOnboardingForm';

export function ParentOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <ParentOnboardingForm />
    </OnboardingFormPageShell>
  );
}
