import { redirect } from 'next/navigation';

import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export default async function OrganisationApplicantRedirect({
  params,
}: {
  params: Promise<{ jobUuid: string; applicationUuid: string }>;
}) {
  const { jobUuid, applicationUuid } = await params;
  redirect(
    dashboardUrl(
      'organisation',
      `jobs/${encodeURIComponent(jobUuid)}/applicants/${encodeURIComponent(applicationUuid)}`
    )
  );
}
