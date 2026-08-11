import { redirectLegacyDashboardPath } from '@/src/features/dashboard/server/legacy-dashboard-route';

type LegacyDashboardPageProps = {
  params: Promise<{ path?: string[] }>;
};

export default async function LegacyDashboardProfilePage({ params }: LegacyDashboardPageProps) {
  const { path } = await params;
  return redirectLegacyDashboardPath('profile', path);
}
