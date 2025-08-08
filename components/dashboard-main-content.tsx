'use client';
import DashboardTopBar from '@/components/dashboard-top-bar';
import { useDashboardView } from '@/components/dashboard-view-context';
import { ReactNode } from 'react';

export default function DashboardMainContent({ children }: { children: ReactNode }) {
  const { view } = useDashboardView();
  return (
    <>
      <DashboardTopBar />
      <div className='flex flex-1 flex-col gap-4 space-y-4 px-3 pt-0 sm:px-6'>
        {children}
      </div>
    </>
  );
}
