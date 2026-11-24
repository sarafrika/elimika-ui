import { RegistrationSteps } from '@/src/features/onboarding/components/RegistrationSteps';
import { AddProfilePageShell } from '@/src/features/profile/add-profile/components/AddProfilePageShell';
import AddInstructorProfileForm from '@/src/features/profile/add-profile/forms/AddInstructorProfileForm';

export function AddInstructorProfilePage() {
  return (
    <AddProfilePageShell>
      <RegistrationSteps role='instructor' backHref='/dashboard/add-profile'>
        <AddInstructorProfileForm />
      </RegistrationSteps>
    </AddProfilePageShell>
  );
}
