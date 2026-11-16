import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

/** The modal a page shows, named in its `?modal=` parameter. */
export const MODAL_PARAM = 'modal';
export const CREATE_CLASS_MODAL = 'create-class';
export const POST_JOB_MODAL = 'post-job';

/** Every parameter the two modals read; closing a modal drops them all. */
export const MODAL_PARAMS = [
  MODAL_PARAM,
  'job',
  'instructorUuid',
  'courseUuid',
  'programUuid',
  'date',
  'startTime',
  'endTime',
  'jobUuid',
  'repostFrom',
] as const;

type CreateClassPrefill = {
  job?: string | null;
  instructorUuid?: string | null;
  courseUuid?: string | null;
  programUuid?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

type PostJobPrefill = {
  jobUuid?: string | null;
  repostFrom?: string | null;
  courseUuid?: string | null;
  programUuid?: string | null;
};

const withParams = (path: string, modal: string, values: Record<string, string | null | undefined>) => {
  const params = new URLSearchParams({ [MODAL_PARAM]: modal });
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return dashboardUrl('organisation', `${path}?${params.toString()}`);
};

/** The classes list with Create class open, optionally prefilled. */
export const createClassHref = (prefill: CreateClassPrefill = {}) =>
  withParams('classes', CREATE_CLASS_MODAL, prefill);

/** The jobs list (or the job being edited) with Post job open. */
export const postJobHref = (prefill: PostJobPrefill = {}) =>
  withParams(
    prefill.jobUuid ? `jobs/${encodeURIComponent(prefill.jobUuid)}` : 'jobs',
    POST_JOB_MODAL,
    prefill
  );

export const viewClassHref = (classUuid?: string | null) =>
  dashboardUrl(
    'organisation',
    classUuid ? `classes?highlight=${encodeURIComponent(classUuid)}` : 'classes'
  );
