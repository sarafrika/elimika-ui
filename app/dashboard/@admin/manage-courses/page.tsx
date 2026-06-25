import { Suspense } from 'react';
import { getAllCourses } from '@/services/client';
import type { AdminCourse } from '@/services/admin';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { CoursesTable } from './_components/CoursesTable';

async function CoursesSection() {
  const { data } = await getAllCourses({
    query: { pageable: { page: 0, size: 200 } },
  }).catch(() => ({ data: undefined }));

  const courses = (data?.data?.content ?? []) as unknown as AdminCourse[];
  return <CoursesTable courses={courses} />;
}

export default function ManageCoursesPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Manage courses'
          description='Browse all courses on the platform and review their publication status.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <CoursesSection />
        </Suspense>
      </div>
    </main>
  );
}
