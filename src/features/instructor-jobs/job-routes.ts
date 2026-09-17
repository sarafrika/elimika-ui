import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

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
