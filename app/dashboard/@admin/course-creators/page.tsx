import { Suspense } from 'react';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { PeopleTableSection } from '../users/_components/PeopleTableSection';
import { UsersTableSkeleton } from '../users/_components/UsersTableSkeleton';

export default function CourseCreatorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Course creators'
          description='Manage course creator accounts and verify their credentials from the 360° profile.'
        />
        <Suspense fallback={<UsersTableSkeleton />}>
          <PeopleTableSection domain='course_creator' />
        </Suspense>
      </div>
    </main>
  );
}
