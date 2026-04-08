import { AddProfilePageShell } from '@/src/features/profile/add-profile/components/AddProfilePageShell';
import AddInstructorProfileForm from '@/src/features/profile/add-profile/forms/AddInstructorProfileForm';

export function AddInstructorProfilePage() {
  return (
    <AddProfilePageShell>
      <AddInstructorProfileForm />
    </AddProfilePageShell>
  );
}
