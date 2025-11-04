import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap.notifications}>
      <div className='flex min-h-[240px] items-center justify-center rounded-xl border border-dashed'>
        <p className='text-muted-foreground text-sm'>Notifications management is in progress.</p>
      </div>
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.notifications.title} | Admin Dashboard`,
  description: adminRouteMap.notifications.description,
};
