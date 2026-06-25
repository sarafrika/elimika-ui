import { Suspense } from 'react';
import { getAllCourseCreators } from '@/services/client';
import type { CourseCreator } from '@/services/client';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { RoleMembersTable, type RoleMember } from '../_components/RoleMembersTable';

async function CourseCreatorsSection() {
  const { data } = await getAllCourseCreators({
    query: { pageable: { page: 0, size: 500, sort: ['created_date,desc'] } },
  }).catch(() => ({ data: undefined }));

  const members: RoleMember[] = ((data?.data?.content ?? []) as CourseCreator[]).map(creator => ({
    userUuid: creator.user_uuid,
    name: creator.full_name || 'Course creator',
    subtitle: creator.professional_headline || undefined,
    joined: creator.created_date ? String(creator.created_date) : undefined,
  }));

  return (
    <RoleMembersTable
      members={members}
      searchPlaceholder='Search course creators…'
      emptyTitle='No course creators found'
      emptyDescription='No course creator accounts are available yet.'
    />
  );
}

export default function CourseCreatorsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Course creators'
          description='Manage course creator accounts and verify their credentials from the 360° profile.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <CourseCreatorsSection />
        </Suspense>
      </div>
    </main>
  );
}
