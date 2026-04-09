import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerActiveDashboardDomain } from '@/src/features/dashboard/server/active-domain';
import { resolveDashboardEntryTarget } from '@/src/features/dashboard/server/entry-target';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardEntryPage() {
  const activeDomain = await getServerActiveDashboardDomain();
  const target = await resolveDashboardEntryTarget(activeDomain);

  redirect(target.redirectTo);
}
