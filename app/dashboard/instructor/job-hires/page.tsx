import { redirect } from 'next/navigation';

import { hiredJobsHref } from '@/src/features/instructor-jobs/job-routes';

/** Hired jobs moved into the Jobs area; kept so older links still resolve. */
export default function InstructorJobHiresRedirect() {
  redirect(hiredJobsHref());
}
