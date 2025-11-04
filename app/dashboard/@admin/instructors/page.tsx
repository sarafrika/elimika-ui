import InstructorsPage from './_components/InstructorsPage';
import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap.instructors}>
      <InstructorsPage />
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.instructors.title} | Admin Dashboard`,
  description: adminRouteMap.instructors.description,
};
