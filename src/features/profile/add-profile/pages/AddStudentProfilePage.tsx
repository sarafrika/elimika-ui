import { RegistrationSteps } from '@/src/features/onboarding/components/RegistrationSteps';
import { AddProfilePageShell } from '@/src/features/profile/add-profile/components/AddProfilePageShell';
import AddStudentProfileForm from '@/src/features/profile/add-profile/forms/AddStudentProfileForm';

export function AddStudentProfilePage() {
  return (
    <AddProfilePageShell>
      <RegistrationSteps role='student' backHref='/dashboard/add-profile'>
        <AddStudentProfileForm />
      </RegistrationSteps>
    </AddProfilePageShell>
  );
}
