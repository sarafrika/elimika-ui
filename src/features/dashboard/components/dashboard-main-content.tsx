'use client';
import type { ReactNode } from 'react';
import { useDashboardView } from '@/components/dashboard-view-context';
import DomainAccessGate from '@/components/profile/domain-access-gate';
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
