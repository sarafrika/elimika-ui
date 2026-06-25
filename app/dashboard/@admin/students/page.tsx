import { Suspense } from 'react';
import { getAllStudents } from '@/services/client';
import type { Student } from '@/services/client';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { RoleMembersTable, type RoleMember } from '../_components/RoleMembersTable';

async function StudentsSection() {
  const { data } = await getAllStudents({
    query: { pageable: { page: 0, size: 500, sort: ['created_date,desc'] } },
  }).catch(() => ({ data: undefined }));

  const members: RoleMember[] = ((data?.data?.content ?? []) as Student[]).map(student => ({
    userUuid: student.user_uuid,
    name: student.full_name || 'Student',
    subtitle: student.demographic_tag || undefined,
    joined: student.created_date ? String(student.created_date) : undefined,
  }));

  return (
    <RoleMembersTable
      members={members}
      searchPlaceholder='Search students…'
      emptyTitle='No students found'
      emptyDescription='No learner accounts are available yet.'
    />
  );
}

export default function StudentsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Students'
          description='Browse learner accounts and open any profile for a full 360° view.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <StudentsSection />
        </Suspense>
      </div>
    </main>
  );
}
