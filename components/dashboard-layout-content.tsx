'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { useDashboardView } from '@/components/dashboard-view-context';
import { UserDomain } from '@/lib/types';
import React, { ReactNode } from 'react';

export default function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { view } = useDashboardView();
  const activeDomain: UserDomain = view as UserDomain;
  // Only render the sidebar here
  return <AppSidebar activeDomain={activeDomain} />;
}
