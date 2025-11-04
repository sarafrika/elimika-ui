import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap.transactions}>
      <div className='flex min-h-[240px] items-center justify-center rounded-xl border border-dashed'>
        <p className='text-muted-foreground text-sm'>Transactions dashboard coming soon.</p>
      </div>
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.transactions.title} | Admin Dashboard`,
  description: adminRouteMap.transactions.description,
};
