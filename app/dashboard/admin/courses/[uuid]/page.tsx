import { Suspense } from 'react';
import { AdminCoursePage } from '@/src/features/admin/pages/course-page';
import AdminCourseLoading from './loading';

export default async function AdminCourseRoute({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  return (
    <Suspense fallback={<AdminCourseLoading />}>
      <AdminCoursePage uuid={uuid} />
    </Suspense>
  );
}
