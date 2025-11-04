import CourseCreatorsPage from './_components/CreatorsPage';
import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap['course-creators']}>
      <CourseCreatorsPage />
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap['course-creators'].title} | Admin Dashboard`,
  description: adminRouteMap['course-creators'].description,
};
