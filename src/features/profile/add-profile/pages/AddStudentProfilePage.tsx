import { AddProfilePageShell } from '@/src/features/profile/add-profile/components/AddProfilePageShell';
import AddStudentProfileForm from '@/src/features/profile/add-profile/forms/AddStudentProfileForm';

export function AddStudentProfilePage() {
  return (
    <AddProfilePageShell>
      <AddStudentProfileForm />
    </AddProfilePageShell>
  );
}
