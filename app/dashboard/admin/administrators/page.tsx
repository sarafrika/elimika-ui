import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { RoleMembersSection } from '../_components/RoleMembersSection';

export default function AdministratorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Administrators'
          description='Manage administrator accounts and platform access from a single roster.'
        />
        <RoleMembersSection role='admin' />
      </div>
    </main>
  );
}
