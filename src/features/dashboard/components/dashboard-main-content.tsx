'use client';

import { useDashboardView } from '@/src/features/dashboard/context/dashboard-view-context';
import DomainAccessGate from '@/src/features/profile/components/domain-access-gate';
import type { ReactNode } from 'react';
import DashboardTopBar from './dashboard-top-bar';

export default function DashboardMainContent({ children }: { children: ReactNode }) {
  useDashboardView();

  return (
    <div className='flex h-full flex-1 flex-col'>
      <div className='bg-background sticky top-0 z-20 shrink-0'>
        <DashboardTopBar />
      </div>

      <div className='flex-1 overflow-x-hidden overflow-y-auto'>
        <div className='flex w-full min-w-0 flex-col gap-5 self-start pr-3 pb-6 sm:gap-6 sm:pr-6'>
          <DomainAccessGate>{children}</DomainAccessGate>
        </div>
      </div>
    </div>
  );
}
