import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { getServerActiveDashboardDomain } from '@/src/features/dashboard/server/active-domain';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardEntryPage() {
  const activeDomain = await getServerActiveDashboardDomain();

  redirect(activeDomain ? buildDashboardSwitchPath(activeDomain) : '/dashboard/overview');
}
