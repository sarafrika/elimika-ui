import { dashboardUrl, toBareDashboardPath } from '@/src/features/dashboard/lib/dashboard-url';

/** Instructor Jobs area: Find work, My applications and Hired all live under /opportunities. */
const instructor = (path: string) => dashboardUrl('instructor', path);
const id = (value: string) => encodeURIComponent(value);

export const findWorkHref = () => instructor('opportunities');

export const jobPageHref = (jobUuid: string) => instructor(`opportunities/${id(jobUuid)}`);

export const myApplicationsHref = () => instructor('opportunities/my-applications');

export const applicationPageHref = (applicationUuid: string) =>
  instructor(`opportunities/my-applications/${id(applicationUuid)}`);

export const hiredJobsHref = () => instructor('opportunities/hired');

export const hiredJobHref = (jobUuid: string) => instructor(`opportunities/hired/${id(jobUuid)}`);

export type JobsSection = 'find-work' | 'applications' | 'hired';

const JOBS_ROOT = '/dashboard/opportunities';

/** Which Jobs tab a (role-scoped or bare) pathname belongs to, or null outside the Jobs area. */
export function jobsSectionFromPath(pathname: string | null | undefined): JobsSection | null {
  const bare = toBareDashboardPath(pathname);
  if (bare !== JOBS_ROOT && !bare.startsWith(`${JOBS_ROOT}/`)) return null;
  const [first, ...rest] = bare.slice(JOBS_ROOT.length).split('/').filter(Boolean);
  if (first === 'my-applications') return 'applications';
  if (first === 'hired') return 'hired';
  return rest.length === 0 ? 'find-work' : null;
}
