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
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <div className='sticky top-0 z-20 bg-background'>
        <DashboardTopBar />
      </div>

      <div className='flex min-h-0 flex-1 overflow-x-hidden overflow-y-auto'>
        <div className='flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 px-3 pt-0 sm:px-6 lg:pl-4'>
          <DomainAccessGate>{children}</DomainAccessGate>
        </div>
      </div>
    </div>
  );
}
