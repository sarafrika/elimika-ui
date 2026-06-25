import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { RoleMembersSection } from '../_components/RoleMembersSection';

export default function InstructorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Instructors'
          description='Manage instructor accounts and verify their credentials from the 360° profile.'
        />
        <RoleMembersSection role='instructor' />
      </div>
    </main>
  );
}
