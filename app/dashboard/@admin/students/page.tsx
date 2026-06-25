import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { RoleMembersSection } from '../_components/RoleMembersSection';

export default function StudentsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Students'
          description='Browse learner accounts and open any profile for a full 360° view.'
        />
        <RoleMembersSection role='student' />
      </div>
    </main>
  );
}
