import { Suspense } from 'react';
import { fetchAdminCourses, type AdminCourse } from '@/services/admin';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { CoursesTable } from './_components/CoursesTable';

async function CoursesSection() {
  const result = await fetchAdminCourses({ size: 200 }).catch(() => ({ items: [] }));
  const courses = (result.items ?? []) as AdminCourse[];
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
