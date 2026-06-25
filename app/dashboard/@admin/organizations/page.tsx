import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { OrganizationsTable } from './_components/OrganizationsTable';

export default function OrganizationsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Organisations'
          description='Review organisation accounts, verify them, and manage their branches and members.'
        />
        <OrganizationsTable />
      </div>
    </main>
  );
}
