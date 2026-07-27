import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { ProgramsTable } from './_components/ProgramsTable';

export default function ManageProgramsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Manage programs'
          description='Browse all training programs and review their publication status.'
        />
        <ProgramsTable />
      </div>
    </main>
  );
}
