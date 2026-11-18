import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import {
  createClassHref as createClassModalHref,
  postJobHref as postJobModalHref,
  viewClassHref,
} from '@/src/features/organisation/class-builder/routes';

export type JobTab = 'overview' | 'applicants' | 'holds' | 'activity';

export const JOB_TABS: readonly JobTab[] = ['overview', 'applicants', 'holds', 'activity'];

const org = (path: string) => dashboardUrl('organisation', path);
const id = (value: string) => encodeURIComponent(value);

export const jobsHref = () => org('jobs');

export const jobMatchesHref = (jobUuid: string) => org(`job-matches?job=${id(jobUuid)}`);

export const jobMatchCandidateHref = (
  jobUuid: string,
  instructorUuid: string,
  applicationUuid: string
) => org(`job-matches/${id(instructorUuid)}?job=${id(jobUuid)}&application=${id(applicationUuid)}`);

export const postJobHref = (courseUuid?: string | null) => postJobModalHref({ courseUuid });

export const jobHref = (jobUuid: string, tab?: JobTab) =>
  org(`jobs/${id(jobUuid)}${tab && tab !== 'overview' ? `?tab=${tab}` : ''}`);

export const jobApplicantHref = (jobUuid: string, applicationUuid: string) =>
  org(`jobs/${id(jobUuid)}/applicants/${id(applicationUuid)}`);

export const editJobHref = (jobUuid: string) => postJobModalHref({ jobUuid });

export const repostJobHref = (jobUuid: string) => postJobModalHref({ repostFrom: jobUuid });

/** Create class, filled from the job's hire. */
export const createClassHref = (jobUuid: string) => createClassModalHref({ job: jobUuid });

export { viewClassHref };
