import { Suspense } from 'react';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { PeopleTableSection } from '../users/_components/PeopleTableSection';
import { UsersTableSkeleton } from '../users/_components/UsersTableSkeleton';

export default function InstructorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Instructors'
          description='Manage instructor accounts and verify their credentials from the 360° profile.'
        />
        <Suspense fallback={<UsersTableSkeleton />}>
          <PeopleTableSection domain='instructor' />
        </Suspense>
      </div>
    </main>
  );
}
