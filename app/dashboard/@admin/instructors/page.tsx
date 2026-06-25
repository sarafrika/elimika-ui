import { Suspense } from 'react';
import { getAllInstructors } from '@/services/client';
import type { Instructor } from '@/services/client';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { RoleMembersTable, type RoleMember } from '../_components/RoleMembersTable';

async function InstructorsSection() {
  const { data } = await getAllInstructors({
    query: { pageable: { page: 0, size: 500, sort: ['created_date,desc'] } },
  }).catch(() => ({ data: undefined }));

  const members: RoleMember[] = ((data?.data?.content ?? []) as Instructor[]).map(instructor => ({
    userUuid: instructor.user_uuid,
    name: instructor.full_name || 'Instructor',
    subtitle: instructor.professional_headline || instructor.formatted_location || undefined,
    joined: instructor.created_date ? String(instructor.created_date) : undefined,
  }));

  return (
    <RoleMembersTable
      members={members}
      searchPlaceholder='Search instructors…'
      emptyTitle='No instructors found'
      emptyDescription='No instructor accounts are available yet.'
    />
  );
}

export default function InstructorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Instructors'
          description='Manage instructor accounts and verify their credentials from the 360° profile.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <InstructorsSection />
        </Suspense>
      </div>
    </main>
  );
}
