import { RegistrationSteps } from '@/src/features/onboarding/components/RegistrationSteps';
import { OnboardingFormPageShell } from '@/src/features/onboarding/components/OnboardingFormPageShell';
import { CourseCreatorOnboardingForm } from '@/src/features/onboarding/forms/CourseCreatorOnboardingForm';

export function CourseCreatorOnboardingPage() {
  return (
    <OnboardingFormPageShell>
      <RegistrationSteps role='course-creator'>
        <CourseCreatorOnboardingForm />
      </RegistrationSteps>
    </OnboardingFormPageShell>
  );
}
