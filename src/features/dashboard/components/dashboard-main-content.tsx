'use client';
import type { ReactNode } from 'react';
import { useDashboardView } from '@/src/features/dashboard/context/dashboard-view-context';
import DomainAccessGate from '@/src/features/profile/components/domain-access-gate';
import DashboardTopBar from './dashboard-top-bar';

export default function DashboardMainContent({ children }: { children: ReactNode }) {
  useDashboardView();
  return (
    <>
      <DashboardTopBar />
      <div className='flex min-w-0 flex-1 flex-col gap-4 overflow-x-auto px-3 pt-0 sm:px-6 lg:pl-4'>
        <DomainAccessGate>{children}</DomainAccessGate>
      </div>
    </>
  );
}
