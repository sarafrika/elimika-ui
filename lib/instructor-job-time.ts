import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

/** Time an instructor was hired for while the job's class does not exist yet. Blocks booking. */
export const JOB_HOLD_ENTRY = 'JOB_HOLD';
/** Time an instructor applied for. Advisory only, and only ever shown to the instructor. */
export const JOB_APPLICATION_ENTRY = 'JOB_APPLICATION';

export type JobTimeKind = 'hold' | 'application';

export function jobTimeKind(entryType?: string | null): JobTimeKind | null {
  if (entryType === JOB_HOLD_ENTRY) return 'hold';
  if (entryType === JOB_APPLICATION_ENTRY) return 'application';
  return null;
}

export const JOB_TIME_LABELS: Record<JobTimeKind, { legend: string; status: string }> = {
  hold: { legend: 'Held for a job you were hired for', status: 'On hold' },
  application: { legend: 'Applied for a job, not blocking', status: 'Applied' },
};

export const UNAVAILABLE_LABEL = 'Unavailable';

export const JOB_HOLD_BLOCK_REASON =
  'This time is held for a class job you were hired for, so nothing else can be booked into it.';

/** Other viewers get holds redacted, so a hold without a title reads as plain unavailability. */
export function jobTimeTitle(kind: JobTimeKind, title?: string | null) {
  if (title?.trim()) return title;
  return kind === 'hold' ? UNAVAILABLE_LABEL : JOB_TIME_LABELS.application.status;
}

export function jobTimeHref(kind: JobTimeKind, jobUuid?: string | null) {
  if (kind === 'hold' && jobUuid) return dashboardUrl('instructor', `job-hires/${jobUuid}`);
  return dashboardUrl('instructor', 'opportunities/my-applications');
}

type TimeWindow = { start: Date | number | string; end: Date | number | string };

const instant = (value: Date | number | string) => new Date(value).getTime();

export function windowsOverlap(left: TimeWindow, right: TimeWindow) {
  return instant(left.start) < instant(right.end) && instant(right.start) < instant(left.end);
}

export function findOverlappingWindow<T extends TimeWindow>(windows: T[], target: TimeWindow) {
  return windows.find(window => windowsOverlap(window, target)) ?? null;
}
