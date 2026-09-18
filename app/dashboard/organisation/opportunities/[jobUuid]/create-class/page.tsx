import { redirect } from 'next/navigation';

import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export default async function OrganisationCreateClassRedirect({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;
  redirect(dashboardUrl('organisation', `classes/new?job=${encodeURIComponent(jobUuid)}`));
}
