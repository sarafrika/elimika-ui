import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export type JobTab = 'overview' | 'applicants' | 'holds' | 'activity';

export const JOB_TABS: readonly JobTab[] = ['overview', 'applicants', 'holds', 'activity'];

const org = (path: string) => dashboardUrl('organisation', path);
const id = (value: string) => encodeURIComponent(value);

export const jobsHref = () => org('jobs');

export const postJobHref = (courseUuid?: string | null) =>
  org(courseUuid ? `jobs/new?courseUuid=${id(courseUuid)}` : 'jobs/new');

export const jobHref = (jobUuid: string, tab?: JobTab) =>
  org(`jobs/${id(jobUuid)}${tab && tab !== 'overview' ? `?tab=${tab}` : ''}`);

export const jobApplicantHref = (jobUuid: string, applicationUuid: string) =>
  org(`jobs/${id(jobUuid)}/applicants/${id(applicationUuid)}`);

export const editJobHref = (jobUuid: string) => org(`jobs/new?jobUuid=${id(jobUuid)}`);

export const repostJobHref = (jobUuid: string) => org(`jobs/new?repostFrom=${id(jobUuid)}`);

export const createClassHref = (jobUuid: string) => org(`classes/new?job=${id(jobUuid)}`);

export const viewClassHref = (classUuid?: string | null) =>
  org(classUuid ? `classes?highlight=${id(classUuid)}` : 'classes');
