import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { PeopleTableSection } from './_components/PeopleTableSection';

export default function UsersPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Users'
          description='Manage accounts, review credentials, and verify users from a single 360° view.'
        />
        <PeopleTableSection />
      </div>
    </main>
  );
}
