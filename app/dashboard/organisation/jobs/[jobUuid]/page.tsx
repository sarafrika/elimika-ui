import { JobDetailsPage } from '@/src/features/organisation/jobs/components/job-details-page';

export default async function OrganisationJobPage({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;
  return <JobDetailsPage jobUuid={jobUuid} />;
}
