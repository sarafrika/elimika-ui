import { redirect } from 'next/navigation';

import { hiredJobHref } from '@/src/features/instructor-jobs/job-routes';

/** Hired job details moved into the Jobs area; kept so older links still resolve. */
export default async function InstructorJobHireRedirect({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;
  redirect(hiredJobHref(jobUuid));
}
