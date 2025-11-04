import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap.support}>
      <div className='flex min-h-[240px] items-center justify-center rounded-xl border border-dashed'>
        <p className='text-muted-foreground text-sm'>Support tooling will appear here soon.</p>
      </div>
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.support.title} | Admin Dashboard`,
  description: adminRouteMap.support.description,
};
