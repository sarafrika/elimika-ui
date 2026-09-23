import { Suspense } from 'react';
import { CoursesPage } from '@/src/features/admin/pages/courses-page';
import AdminCoursesLoading from './loading';

export default function AdminCoursesRoute() {
  return (
    <Suspense fallback={<AdminCoursesLoading />}>
      <CoursesPage />
    </Suspense>
  );
}
