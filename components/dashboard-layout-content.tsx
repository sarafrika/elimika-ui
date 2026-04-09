'use client';
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import type { UserDomain } from '@/lib/types';
import { useDashboardView } from '@/src/features/dashboard/context/dashboard-view-context';

export default function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { view } = useDashboardView();
  const activeDomain: UserDomain =
    view === 'organization' ? ('organisation' as UserDomain) : (view as UserDomain);
  // Only render the sidebar here
  return <AppSidebar activeDomain={activeDomain} />;
}
