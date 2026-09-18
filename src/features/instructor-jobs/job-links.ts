import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

import type { ReadinessCtaKind } from './job-readiness';
import { applicationPageHref, jobPageHref, myApplicationsHref } from './job-routes';

const contentKind = (job: ClassMarketplaceJob) => (job.program_uuid ? 'program' : 'course');

/** Deep link into the instructor's rate card, opened on this job's course or program and basis. */
export function rateCardHref(job: ClassMarketplaceJob) {
  const parent = job.program_uuid ?? job.course_uuid;
  if (!parent) return dashboardUrl('instructor', 'rate-card');
  const params = new URLSearchParams({ kind: contentKind(job), parent });
  if (job.rate_basis) params.set('basis', job.rate_basis);
  return dashboardUrl('instructor', `rate-card?${params.toString()}`);
}

/** The instructor's apply-to-train wizard for the job's course or program. */
export function applyToTrainHref(job: ClassMarketplaceJob) {
  const parent = job.program_uuid ?? job.course_uuid;
  if (!parent) return dashboardUrl('instructor', 'courses');
  const query = job.program_uuid ? '?kind=program' : '';
  return dashboardUrl('instructor', `courses/apply/${encodeURIComponent(parent)}${query}`);
}

export const verificationHref = () => dashboardUrl('instructor', 'profile');

/** The job page's Schedule tab, optionally narrowed to the clashing sessions. */
export const jobScheduleHref = (jobUuid: string, clashesOnly = false) =>
  `${jobPageHref(jobUuid)}?tab=schedule${clashesOnly ? '&clashes=1' : ''}`;

/** Where a readiness CTA goes; null for `apply`, which opens the apply dialog instead. */
export function readinessCtaHref(
  kind: ReadinessCtaKind,
  job: ClassMarketplaceJob,
  applicationUuid?: string | null
): string | null {
  const jobUuid = job.uuid ?? '';
  switch (kind) {
    case 'apply':
      return null;
    case 'add-rate':
      return rateCardHref(job);
    case 'apply-to-train':
      return applyToTrainHref(job);
    case 'see-clashes':
      return jobScheduleHref(jobUuid, true);
    case 'verify':
      return verificationHref();
    case 'track':
      return applicationUuid ? applicationPageHref(applicationUuid) : myApplicationsHref();
    case 'view':
      return jobPageHref(jobUuid);
  }
}
