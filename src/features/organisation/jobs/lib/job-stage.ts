import { getEffectiveJobStatus } from '@/components/profile-job-marketplace/job-expiration';
import { type ApiDateInput, dayjs, DEFAULT_CLASS_TIME_ZONE, parseApiDate } from '@/lib/date';
import { townFromAddress } from '@/lib/geocoding';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  ClassSessionTemplate,
} from '@/services/client';
import { createClassHref, jobHref, repostJobHref, viewClassHref } from './job-routes';

export type JobStage = 'open' | 'awaiting_class' | 'class_created' | 'closed';

type StageTone = 'info' | 'warning' | 'success' | 'neutral';

export const JOB_STAGE_META: Record<JobStage, { label: string; tone: StageTone }> = {
  open: { label: 'Open', tone: 'info' },
  awaiting_class: { label: 'Awaiting class', tone: 'warning' },
  class_created: { label: 'Class created', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

/** The four places a job can be in the hire-to-class journey; filled means its class exists. */
export function jobStage(job: ClassMarketplaceJob, now = Date.now()): JobStage {
  switch (getEffectiveJobStatus(job, now)) {
    case 'open':
      return 'open';
    case 'awaiting_class':
      return 'awaiting_class';
    case 'filled':
      return 'class_created';
    default:
      return 'closed';
  }
}

/** Closed jobs say how they closed; every other stage uses its own label. */
export function jobStatusLabel(job: ClassMarketplaceJob, now = Date.now()) {
  const stage = jobStage(job, now);
  if (stage !== 'closed') return JOB_STAGE_META[stage].label;
  return getEffectiveJobStatus(job, now) === 'cancelled' ? 'Cancelled' : 'Expired';
}

export function hiredInstructorUuid(job: ClassMarketplaceJob) {
  return job.hired_instructor_uuid ?? job.assigned_instructor_uuid ?? null;
}

/** The application the job stamped at hire time, else whichever one reached hired. */
export function hiredApplicationFor(
  job: ClassMarketplaceJob | null | undefined,
  applications: ClassMarketplaceJobApplication[]
) {
  const hired = (status?: string | null) =>
    ['hired', 'assigned'].includes(String(status ?? '').toLowerCase());
  return (
    applications.find(application => application.uuid === job?.assigned_application_uuid) ??
    applications.find(application => hired(application.status)) ??
    null
  );
}

export type HoldState = {
  key: 'held' | 'confirmed' | 'released' | 'online';
  label: string;
  note: string;
};

/** Pass `sessions` for per-session badges: an online job still holds the instructor's time. */
export function holdStateFor(
  job: ClassMarketplaceJob,
  now = Date.now(),
  { sessions = false }: { sessions?: boolean } = {}
): HoldState {
  if (!sessions && job.location_type === 'ONLINE' && !job.resources?.length) {
    return { key: 'online', label: 'Online', note: 'Online — nothing to book' };
  }
  switch (jobStage(job, now)) {
    case 'class_created':
      return { key: 'confirmed', label: 'Confirmed', note: 'Confirmed for the class' };
    case 'closed':
      return { key: 'released', label: 'Holds released', note: 'Holds released' };
    default:
      return { key: 'held', label: 'On hold', note: 'On hold for these sessions' };
  }
}

export type JobSessionWindow = { start: Date; end: Date; timezone: string };

const WEEKDAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** A date-only value (string or UTC-midnight Date) is a calendar day, not an instant. */
function seriesEnd(value: ApiDateInput, zone: string) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return dayjs.tz(value, zone).endOf('day');
  }
  const parsed = parseApiDate(value);
  if (!parsed) return null;
  const utc = parsed.utc();
  if (utc.hour() === 0 && utc.minute() === 0 && utc.second() === 0) {
    return dayjs.tz(utc.format('YYYY-MM-DD'), zone).endOf('day');
  }
  return parsed.tz(zone).endOf('day');
}

function expandTemplate(template: ClassSessionTemplate, cap: number): JobSessionWindow[] {
  const zone = template.timezone || DEFAULT_CLASS_TIME_ZONE;
  const startInstant = parseApiDate(template.start_time);
  const endInstant = parseApiDate(template.end_time);
  if (!startInstant || !endInstant) return [];
  const start = startInstant.tz(zone);
  const durationMs = Math.max(0, endInstant.valueOf() - startInstant.valueOf());
  const window = (at: dayjs.Dayjs) => ({
    start: at.toDate(),
    end: new Date(at.valueOf() + durationMs),
    timezone: zone,
  });

  const recurrence = template.recurrence;
  const type = recurrence?.recurrence_type;
  if (!type) return [window(start)];

  const interval = Math.max(1, Math.trunc(recurrence.interval_value ?? 1));
  const limit = Math.min(cap, recurrence.occurrence_count || cap);
  const until = seriesEnd(recurrence.end_date, zone);
  const out: JobSessionWindow[] = [];
  const accept = (at: dayjs.Dayjs) => {
    if (until && at.isAfter(until)) return false;
    out.push(window(at));
    return out.length < limit;
  };

  if (type === 'WEEKLY') {
    const days = (recurrence.days_of_week ?? '')
      .split(',')
      .map(token => WEEKDAY_INDEX[token.trim().toUpperCase()])
      .filter((day): day is number => day !== undefined)
      .sort((a, b) => a - b);
    const weekdays = days.length ? days : [start.day()];
    const weekStart = start.subtract(start.day(), 'day');
    for (let week = 0; out.length < limit && week < cap * interval; week += interval) {
      for (const day of weekdays) {
        const at = weekStart.add(week * 7 + day, 'day');
        if (at.isBefore(start)) continue;
        if (!accept(at)) return out;
      }
      if (until && weekStart.add(week * 7, 'day').isAfter(until)) break;
    }
    return out;
  }

  const unit = type === 'MONTHLY' ? 'month' : 'day';
  for (let step = 0; step < cap; step += 1) {
    if (!accept(start.add(step * interval, unit))) break;
  }
  return out;
}

/** Every session a job's templates produce, soonest first, capped so an open-ended series stops. */
export function jobSessionWindows(job: ClassMarketplaceJob, cap = 200): JobSessionWindow[] {
  const templates: ClassSessionTemplate[] = job.session_templates?.length
    ? job.session_templates
    : job.default_start_time && job.default_end_time
      ? [{ start_time: job.default_start_time, end_time: job.default_end_time }]
      : [];
  return templates
    .flatMap(template => expandTemplate(template, cap))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, cap);
}

export function firstSession(job: ClassMarketplaceJob) {
  return jobSessionWindows(job, 200)[0] ?? null;
}

export function sessionCount(job: ClassMarketplaceJob) {
  return jobSessionWindows(job).length;
}

export function sessionCountLabel(count: number, cap = 200) {
  if (count >= cap) return `${cap}+ sessions`;
  return `${count} session${count === 1 ? '' : 's'}`;
}

export function nextStepCta(job: ClassMarketplaceJob, now = Date.now()) {
  const jobUuid = job.uuid ?? '';
  switch (jobStage(job, now)) {
    case 'open':
      return { label: 'Review applicants', href: jobHref(jobUuid, 'applicants') };
    case 'awaiting_class':
      return { label: 'Create class', href: createClassHref(jobUuid) };
    case 'class_created':
      return { label: 'View class', href: viewClassHref(job.assigned_class_definition_uuid) };
    default:
      return { label: 'Repost', href: repostJobHref(jobUuid) };
  }
}

const DELIVERY_LABELS: Record<string, string> = {
  IN_PERSON: 'In person',
  HYBRID: 'Hybrid',
  ONLINE: 'Online',
};

const SERVICE_LABELS: Record<string, string> = {
  ONE_ON_ONE: '1-on-1 session',
  GROUP: 'Group session',
  ONLINE: 'Online course',
  PRIVATE_ONLINE: 'Private online class',
};

export const deliveryLabel = (value?: string | null) =>
  (value && DELIVERY_LABELS[value]) || 'Delivery not set';

export const serviceLabel = (value?: string | null, sessionFormat?: string | null) =>
  (value && SERVICE_LABELS[value]) ||
  (sessionFormat === 'INDIVIDUAL' ? '1-on-1 session' : 'Group session');

/** Branch jobs store "Branch · address"; the address alone is what the map card wants. */
export function jobAddress(job: ClassMarketplaceJob) {
  const location = job.location_name?.trim();
  if (!location) return null;
  const prefix = job.branch_name ? `${job.branch_name} · ` : '';
  return prefix && location.startsWith(prefix) ? location.slice(prefix.length) : location;
}

export function jobTown(job: ClassMarketplaceJob) {
  return townFromAddress(jobAddress(job));
}

export function jobHasPin(job: ClassMarketplaceJob) {
  return (
    typeof job.location_latitude === 'number' &&
    Number.isFinite(job.location_latitude) &&
    typeof job.location_longitude === 'number' &&
    Number.isFinite(job.location_longitude)
  );
}

const pluralDay = (index: number) =>
  `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}s`;

const joinWords = (words: string[]) =>
  words.length <= 1
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

export function sessionTimeRange(window: JobSessionWindow) {
  const start = dayjs(window.start).tz(window.timezone);
  const end = dayjs(window.end).tz(window.timezone);
  const sameMeridiem = start.format('A') === end.format('A');
  return `${start.format(sameMeridiem ? 'h:mm' : 'h:mm A')} – ${end.format('h:mm A')}`;
}

export function sessionDayLabel(window: JobSessionWindow) {
  return dayjs(window.start).tz(window.timezone).format('ddd D MMM YYYY');
}

/** "12 sessions · Mondays and Wednesdays · 9:00 – 11:00 AM · 5 Oct – 11 Nov 2026". */
export function scheduleSummary(windows: JobSessionWindow[]) {
  const first = windows[0];
  const last = windows[windows.length - 1];
  if (!first || !last) return 'No sessions scheduled';
  const parts = [sessionCountLabel(windows.length)];
  const local = windows.map(window => dayjs(window.start).tz(window.timezone));
  const weekdays = Array.from(new Set(local.map(day => day.day())));
  if (windows.length > 1 && weekdays.length <= 3) {
    parts.push(
      joinWords([...weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(pluralDay))
    );
  }
  const ranges = new Set(windows.map(sessionTimeRange));
  if (ranges.size === 1) parts.push(sessionTimeRange(first));
  const from = dayjs(first.start).tz(first.timezone);
  const to = dayjs(last.start).tz(last.timezone);
  parts.push(
    windows.length === 1
      ? from.format('D MMM YYYY')
      : `${from.format(from.year() === to.year() ? 'D MMM' : 'D MMM YYYY')} – ${to.format('D MMM YYYY')}`
  );
  return parts.join(' · ');
}

export function reminderSummary(job: ClassMarketplaceJob) {
  const who = joinWords(
    [job.remind_students ? 'Students' : null, job.remind_instructor ? 'instructor' : null].filter(
      (part): part is string => Boolean(part)
    )
  );
  if (!who) return 'No reminders';
  const channels = [
    job.remind_via_email ? 'email' : null,
    job.remind_via_sms ? 'SMS' : null,
    job.remind_via_push ? 'push' : null,
  ].filter(Boolean);
  const minutes = job.class_reminder_minutes;
  const lead =
    typeof minutes === 'number' && minutes > 0
      ? minutes % 60 === 0
        ? `${minutes / 60} hour${minutes === 60 ? '' : 's'} before`
        : `${minutes} minutes before`
      : null;
  const subject = who.charAt(0).toUpperCase() + who.slice(1);
  return [subject, channels.join(', '), lead].filter(Boolean).join(' · ');
}
