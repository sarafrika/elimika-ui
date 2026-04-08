import { redirect } from 'next/navigation';
import type { DashboardChildrenTypes } from '@/lib/types';
import { DashboardClientLayout } from '@/src/features/dashboard/layouts/DashboardClientLayout';
import { getServerActiveDashboardDomain } from '@/src/features/dashboard/server/active-domain';
import { resolveDashboardGuard } from '@/src/features/dashboard/server/entry-target';

export default async function DashboardLayout(dashboardProps: DashboardChildrenTypes) {
  const activeDomain = await getServerActiveDashboardDomain();
  const guard = await resolveDashboardGuard(activeDomain);

  if (guard.redirectTo) {
    redirect(guard.redirectTo);
  }

  return <DashboardClientLayout {...dashboardProps} />;
}
