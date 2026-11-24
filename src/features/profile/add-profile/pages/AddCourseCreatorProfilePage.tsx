import { RegistrationSteps } from '@/src/features/onboarding/components/RegistrationSteps';
import { AddProfilePageShell } from '@/src/features/profile/add-profile/components/AddProfilePageShell';
import AddCourseCreatorProfileForm from '@/src/features/profile/add-profile/forms/AddCourseCreatorProfileForm';

export function AddCourseCreatorProfilePage() {
  return (
    <AddProfilePageShell>
      <RegistrationSteps role='course-creator' backHref='/dashboard/add-profile'>
        <AddCourseCreatorProfileForm />
      </RegistrationSteps>
    </AddProfilePageShell>
  );
}
