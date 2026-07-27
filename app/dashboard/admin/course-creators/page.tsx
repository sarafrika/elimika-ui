import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { RoleMembersSection } from '../_components/RoleMembersSection';

export default function CourseCreatorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Course creators'
          description='Manage course creator accounts and verify their credentials from the 360° profile.'
        />
        <RoleMembersSection role='course_creator' />
      </div>
    </main>
  );
}
