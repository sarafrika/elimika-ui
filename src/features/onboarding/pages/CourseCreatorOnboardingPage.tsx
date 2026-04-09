import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { CourseCreatorOnboardingForm } from '@/src/features/onboarding/forms/CourseCreatorOnboardingForm';

export function CourseCreatorOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <CourseCreatorOnboardingForm />
    </OnboardingFormPageShell>
  );
}
