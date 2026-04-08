import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { StudentOnboardingForm } from '@/src/features/onboarding/forms/StudentOnboardingForm';

export function StudentOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <StudentOnboardingForm />
    </OnboardingFormPageShell>
  );
}
