import { AddProfilePageShell } from '@/src/features/profile/add-profile/components/AddProfilePageShell';
import AddCourseCreatorProfileForm from '@/src/features/profile/add-profile/forms/AddCourseCreatorProfileForm';

export function AddCourseCreatorProfilePage() {
  return (
    <AddProfilePageShell>
      <AddCourseCreatorProfileForm />
    </AddProfilePageShell>
  );
}
