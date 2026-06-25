import { Suspense } from 'react';
import { getAdminUsers } from '@/services/client';
import type { User } from '@/services/client';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { RoleMembersTable, type RoleMember } from '../_components/RoleMembersTable';

async function AdministratorsSection() {
  const { data } = await getAdminUsers({
    query: { filters: {}, pageable: { page: 0, size: 500, sort: ['created_date,desc'] } },
  }).catch(() => ({ data: undefined }));

  const members: RoleMember[] = ((data?.data?.content ?? []) as User[]).map(user => ({
    userUuid: user.uuid,
    name: user.full_name || `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Administrator',
    subtitle: user.email || undefined,
    joined: user.created_date ? String(user.created_date) : undefined,
  }));

  return (
    <RoleMembersTable
      members={members}
      searchPlaceholder='Search administrators…'
      emptyTitle='No administrators found'
      emptyDescription='No administrator accounts are available yet.'
    />
  );
}

export default function AdministratorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Administrators'
          description='Manage administrator accounts and platform access from a single roster.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <AdministratorsSection />
        </Suspense>
      </div>
    </main>
  );
}
