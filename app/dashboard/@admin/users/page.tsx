import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';
import AdminUsersPage from './users-page';

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap.users}>
      <AdminUsersPage />
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.users.title} | Admin Dashboard`,
  description: adminRouteMap.users.description,
};
