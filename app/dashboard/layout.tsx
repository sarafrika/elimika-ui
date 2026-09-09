import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardUnavailable } from '@/src/features/dashboard/components/dashboard-unavailable';
import { DashboardClientLayout } from '@/src/features/dashboard/layouts/DashboardClientLayout';
import { getServerActiveDashboardDomain } from '@/src/features/dashboard/server/active-domain';
import { resolveDashboardGuard } from '@/src/features/dashboard/server/entry-target';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const activeDomain = await getServerActiveDashboardDomain();
  const guard = await resolveDashboardGuard(activeDomain);

  if (guard.redirectTo) {
    redirect(guard.redirectTo);
  }

  // Identity could not be read this render. Offer a retry instead of redirecting:
  // treating a timed-out `/me` as "signed out" is what logged people out at random.
  if (guard.unavailable) {
    return <DashboardUnavailable />;
  }

  // `activeDomain` is resolved here on the server, so the brand theme it selects
  // (see the [data-dashboard-domain] blocks in app/globals.css) is present in the
  // first painted HTML — no theme flash on load.
  return <DashboardClientLayout initialDomain={activeDomain}>{children}</DashboardClientLayout>;
}
