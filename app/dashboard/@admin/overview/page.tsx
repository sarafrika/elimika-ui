import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import StatisticsContent from './_components/StatisticsContent';
import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

function StatisticsLoading() {
  return (
    <div className='flex min-h-[360px] items-center justify-center rounded-lg border border-dashed'>
      <div className='text-center'>
        <Loader2 className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
        <p className='text-muted-foreground text-sm'>Loading statistics…</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.overview.title} | Admin Dashboard`,
  description: adminRouteMap.overview.description,
};

export default function Page() {
  return (
    <AdminPage meta={adminRouteMap.overview}>
      <Suspense fallback={<StatisticsLoading />}>
        <StatisticsContent />
      </Suspense>
    </AdminPage>
  );
}
