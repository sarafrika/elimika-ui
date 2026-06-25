import { Suspense } from 'react';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { PeopleTableSection } from '../users/_components/PeopleTableSection';
import { UsersTableSkeleton } from '../users/_components/UsersTableSkeleton';

export default function StudentsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Students'
          description='Browse learner accounts and open any profile for a full 360° view.'
        />
        <Suspense fallback={<UsersTableSkeleton />}>
          <PeopleTableSection domain='student' />
        </Suspense>
      </div>
    </main>
  );
}
