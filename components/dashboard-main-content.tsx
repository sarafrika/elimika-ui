'use client';
import DashboardTopBar from '@/components/dashboard-top-bar';
import { useDashboardView } from '@/components/dashboard-view-context';
import DomainAccessGate from '@/components/profile/domain-access-gate';
import type { ReactNode } from 'react';

export default function DashboardMainContent({ children }: { children: ReactNode }) {
  useDashboardView();
  return (
    <>
      <DashboardTopBar />
      <div className='flex flex-1 flex-col gap-4 px-3 pt-0 sm:px-6'>
        <DomainAccessGate>{children}</DomainAccessGate>
      </div>
    </>
  );
}
