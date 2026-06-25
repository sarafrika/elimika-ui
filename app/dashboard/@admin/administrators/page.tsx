import { Suspense } from 'react';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { PeopleTableSection } from '../users/_components/PeopleTableSection';
import { UsersTableSkeleton } from '../users/_components/UsersTableSkeleton';

export default function AdministratorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Administrators'
          description='Manage administrator accounts and platform access from a single roster.'
        />
        <Suspense fallback={<UsersTableSkeleton />}>
          <PeopleTableSection domain='admin' />
        </Suspense>
      </div>
    </main>
  );
}
