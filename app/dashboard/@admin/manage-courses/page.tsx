import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { CoursesTable } from './_components/CoursesTable';

export default function ManageCoursesPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Manage courses'
          description='Browse all courses on the platform and review their publication status.'
        />
        <CoursesTable />
      </div>
    </main>
  );
}
