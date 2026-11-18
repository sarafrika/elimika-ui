import { redirect } from 'next/navigation';

import { JobMatchesPage } from '@/src/features/organisation/jobs/components/job-matches-page';
import { jobsHref } from '@/src/features/organisation/jobs/lib/job-routes';

export default async function OrganisationJobMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string | string[] }>;
}) {
  const { job } = await searchParams;
  if (typeof job !== 'string' || !job.trim()) redirect(jobsHref());

  return <JobMatchesPage jobUuid={job} />;
}
