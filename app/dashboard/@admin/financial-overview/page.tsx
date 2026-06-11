'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AdminFinancialOverview = dynamic(() => import('./_component/admin-financial-overview'), {
  ssr: false,
  loading: () => <Skeleton className='h-96 w-full' />,
});

const Page = () => {
  return (
    <div>
      <AdminFinancialOverview />
    </div>
  );
};

export default Page;
