import { jobPlaceLabel } from '@/components/profile-job-marketplace/job-place';
import { dayjs } from '@/lib/date';
import { formatRateAmount, getRateBasis } from '@/lib/rate-card';
import type { SchedulingConflict } from '@/lib/scheduling-conflicts';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import {
  deliveryLabel,
  type JobSessionWindow,
  jobSessionWindows,
  sessionTimeRange,
} from '@/src/features/organisation/jobs/lib/job-stage';

/** Open-ended series stop here, matching the organisation's own job pages. */
export const SESSION_CAP = 200;

const DAY_MS = 24 * 60 * 60 * 1000;

export type JobFacts = {
  windows: JobSessionWindow[];
  sessionCount: number;
  /** The series reached SESSION_CAP, so counts and totals are lower bounds. */
  capped: boolean;
  totalHours: number;
  classDays: number;
  first: JobSessionWindow | null;
  last: JobSessionWindow | null;
  /** Applications close when the first session starts. */
  closesAt: Date | null;
  /** Sessions, hours or class days, whichever the job is billed on. */
  billedUnits: number;
  estimatedTotal: number | null;
};

const localDay = (window: JobSessionWindow) =>
  dayjs(window.start).tz(window.timezone).format('YYYY-MM-DD');

export function jobFacts(job: ClassMarketplaceJob): JobFacts {
  const windows = jobSessionWindows(job, SESSION_CAP);
  const first = windows[0] ?? null;
  const last = windows[windows.length - 1] ?? null;
  const totalHours = windows.reduce(
    (sum, window) => sum + (window.end.getTime() - window.start.getTime()) / 3_600_000,
    0
  );
  const classDays = new Set(windows.map(localDay)).size;
  const billedUnits =
    job.rate_basis === 'per_hour'
      ? totalHours
      : job.rate_basis === 'per_day'
        ? classDays
        : windows.length;
  const pay = typeof job.instructor_pay === 'number' ? job.instructor_pay : null;
  const stated = job.default_start_time ? new Date(job.default_start_time) : null;
  const starts = [first?.start, stated].filter(
    (value): value is Date => value instanceof Date && Number.isFinite(value.getTime())
  );

  return {
    windows,
    sessionCount: windows.length,
    capped: windows.length >= SESSION_CAP,
    totalHours,
    classDays,
    first,
    last,
    closesAt: starts.length
      ? new Date(Math.min(...starts.map(value => value.getTime())))
      : null,
    billedUnits,
    estimatedTotal: pay === null || windows.length === 0 ? null : pay * billedUnits,
  };
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** "2 hrs", "1.5 hrs", "1 hr". */
export function hoursLabel(hours: number) {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hr${rounded === 1 ? '' : 's'}`;
}

/** "12 sessions", "24 hours", "3 days": the units the estimated total multiplies. */
export function billedUnitsLabel(job: ClassMarketplaceJob, facts: JobFacts) {
  const suffix = facts.capped ? '+' : '';
  if (job.rate_basis === 'per_hour') {
    const hours = Math.round(facts.totalHours * 10) / 10;
    return `${hours}${suffix} hour${hours === 1 ? '' : 's'}`;
  }
  if (job.rate_basis === 'per_day') return `${facts.classDays}${suffix} day${facts.classDays === 1 ? '' : 's'}`;
  return `${facts.sessionCount}${suffix} session${facts.sessionCount === 1 ? '' : 's'}`;
}

export function payLabel(job: ClassMarketplaceJob) {
  if (typeof job.instructor_pay !== 'number') return 'Pay shown to verified instructors';
  return `${formatRateAmount(job.instructor_pay)} / ${getRateBasis(job.rate_basis).unit}`;
}

/** "About KES 72,000 for 12 sessions". */
export function estimatedTotalLabel(job: ClassMarketplaceJob, facts: JobFacts) {
  if (facts.estimatedTotal === null) return 'Estimated total not available';
  return `About ${formatRateAmount(facts.estimatedTotal)} for ${billedUnitsLabel(job, facts)}`;
}

/** "Group · up to 25", "Private · 1 learner". */
export function classFormatLabel(job: ClassMarketplaceJob) {
  if (job.session_format === 'INDIVIDUAL') return 'Private · 1 learner';
  return typeof job.max_participants === 'number'
    ? `Group · up to ${job.max_participants}`
    : 'Group';
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LONG_DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

/** "Mon & Wed", "Saturdays", or null once the sessions spread over more than three weekdays. */
export function weekdaysLabel(windows: JobSessionWindow[]) {
  if (windows.length < 2) return null;
  const days = Array.from(
    new Set(windows.map(window => dayjs(window.start).tz(window.timezone).day()))
  ).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (days.length === 1) return LONG_DAYS[days[0] ?? 0] ?? null;
  if (days.length > 3) return null;
  const names = days.map(day => SHORT_DAYS[day]);
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/** "12 sessions · Mon & Wed". */
export function sessionsLabel(facts: JobFacts) {
  const count = `${facts.sessionCount}${facts.capped ? '+' : ''} session${facts.sessionCount === 1 ? '' : 's'}`;
  const days = weekdaysLabel(facts.windows);
  return days ? `${count} · ${days}` : count;
}

/** One time range when every session shares it. */
export function timesLabel(facts: JobFacts) {
  if (!facts.first) return 'No sessions scheduled';
  const ranges = new Set(facts.windows.map(sessionTimeRange));
  return ranges.size === 1 ? sessionTimeRange(facts.first) : 'Times vary by session';
}

/** "Mon 5 Oct" in the class's own zone. */
export function sessionDate(window: JobSessionWindow | null, format = 'ddd D MMM') {
  return window ? dayjs(window.start).tz(window.timezone).format(format) : '—';
}

export function daysUntil(at: Date | null, now: number) {
  if (!at) return null;
  return Math.ceil((at.getTime() - now) / DAY_MS);
}

/** "Closes in 18 days"; "Closed" once the first session has started. */
export function closesLabel(facts: JobFacts, now: number) {
  const days = daysUntil(facts.closesAt, now);
  if (days === null) return null;
  if (facts.closesAt && facts.closesAt.getTime() <= now) return 'Closed';
  if (days <= 1) {
    const sameDay = dayjs(facts.closesAt).isSame(dayjs(now), 'day');
    return sameDay ? 'Closes today' : 'Closes tomorrow';
  }
  return `Closes in ${days} days`;
}

/** "in 18 days", "today", "tomorrow". */
export function inDaysLabel(facts: JobFacts, now: number) {
  const days = daysUntil(facts.closesAt, now);
  if (days === null) return '';
  if (days <= 1) return dayjs(facts.closesAt).isSame(dayjs(now), 'day') ? 'today' : 'tomorrow';
  return `in ${plural(days, 'day')}`;
}

export function venueName(job: ClassMarketplaceJob) {
  return (
    job.resources?.find(resource => resource.resource_type === 'VENUE' && resource.resource_name)
      ?.resource_name ?? null
  );
}

/** "Main Campus · Kasarani · Lab 2", or the online meeting note. */
export function jobWhereLabel(job: ClassMarketplaceJob) {
  if (job.location_type === 'ONLINE') return 'Online · link shared when the class is created';
  const place = jobPlaceLabel(job, deliveryLabel(job.location_type));
  const venue = venueName(job);
  return venue ? `${place} · ${venue}` : place;
}

const MINUTE_MS = 60_000;

/** Which sessions a conflict report refers to: the same start, else any overlap. */
export function clashesBySession(windows: JobSessionWindow[], conflicts: SchedulingConflict[]) {
  const clashes = new Map<number, SchedulingConflict>();
  for (const conflict of conflicts) {
    const start = conflict.start?.getTime();
    const end = conflict.end?.getTime() ?? start;
    if (start === undefined || end === undefined) continue;
    let index = windows.findIndex(window => Math.abs(window.start.getTime() - start) < MINUTE_MS);
    if (index < 0) {
      index = windows.findIndex(
        window => window.start.getTime() < end && start < window.end.getTime()
      );
    }
    if (index >= 0 && !clashes.has(index)) clashes.set(index, conflict);
  }
  return clashes;
}

export const clashReason = (conflict: SchedulingConflict) =>
  conflict.reasons[0] ?? 'Clashes with your calendar';

export function initialsOf(name: string | null | undefined) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map(word => word[0]?.toUpperCase())
      .join('') || '?'
  );
}
