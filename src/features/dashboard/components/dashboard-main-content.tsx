'use client';

import { useDashboardView } from '@/src/features/dashboard/context/dashboard-view-context';
import DomainAccessGate from '@/src/features/profile/components/domain-access-gate';
import type { ReactNode } from 'react';
import DashboardTopBar from './dashboard-top-bar';

export default function DashboardMainContent({
  children,
}: {
  children: ReactNode;
}) {
  useDashboardView();

  return (
    <div className='flex h-full flex-1 flex-col'>
      <div className='sticky top-0 z-20 shrink-0 border-b bg-background'>
        <DashboardTopBar />
      </div>

      <div className='flex-1 overflow-y-auto overflow-x-hidden'>
        <div className='flex w-full min-w-0 flex-col gap-4 px-3 sm:px-5 lg:pl-4'>
          <DomainAccessGate>{children}</DomainAccessGate>
        </div>
      </div>
    </div>
  );
}