import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { RubricsTable } from './_components/RubricsTable';

export default function RubricsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Assessment rubrics'
          description='Browse and manage grading rubrics across the platform.'
        />
        <RubricsTable />
      </div>
    </main>
  );
}
