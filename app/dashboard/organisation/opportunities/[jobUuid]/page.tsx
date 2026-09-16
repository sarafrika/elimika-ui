import { redirect } from 'next/navigation';

import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export default async function OrganisationOpportunityRedirect({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;
  redirect(dashboardUrl('organisation', `jobs/${encodeURIComponent(jobUuid)}?tab=applicants`));
}
