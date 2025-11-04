import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';
import AdminOrganisationsPage from './organizations-page';

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap.organizations}>
      <AdminOrganisationsPage />
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.organizations.title} | Admin Dashboard`,
  description: adminRouteMap.organizations.description,
};
