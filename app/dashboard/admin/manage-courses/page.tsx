import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { CoursesTable } from './_components/CoursesTable';

export default function ManageCoursesPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Manage courses'
          description='Browse all courses on the platform, open one to review its full content and approve or reject it.'
        />
        <CoursesTable />
      </div>
    </main>
  );
}
