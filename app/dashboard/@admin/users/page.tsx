import { Suspense } from 'react';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { PeopleTableSection } from './_components/PeopleTableSection';
import { UsersTableSkeleton } from './_components/UsersTableSkeleton';

export default function UsersPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Users'
          description='Manage accounts, review credentials, and verify users from a single 360° view.'
        />
        <Suspense fallback={<UsersTableSkeleton />}>
          <PeopleTableSection />
        </Suspense>
      </div>
    </main>
  );
}
