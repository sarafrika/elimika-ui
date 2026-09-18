import { redirect } from 'next/navigation';

import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

/** Application details moved to Approvals; kept so older links still resolve. */
export default async function MyApplicationRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(dashboardUrl('organisation', `approvals/${encodeURIComponent(id)}`));
}
