import { formatDateOnly } from '@/lib/date';
import { formatRate, formatRateAmount } from '@/lib/rate-card';
import type { ClassRecurrence } from '@/services/client';
import { isClassCreatedStatus } from './application-status';

type JobPayFields = { instructor_pay?: number | null; rate_basis?: string | null };

export function isHiredApplication(status?: string | null) {
  return status?.toLowerCase() === 'hired' || isClassCreatedStatus(status);
}

/** Generated options throw on HTTP errors; successful HTTP responses can still carry API errors. */
export function hiredJobData<T>(response: {
  data?: T;
  error?: unknown;
  success?: boolean;
  message?: string;
}): T | undefined {
  if (response.error || response.success === false) {
    throw new Error(response.message || 'Unable to load the requested information.');
  }
  return response.data;
}

export function jobLabel(value?: string | null) {
  if (!value) return 'Not provided';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

/** Works for a full job and for the job summary on an application. */
export function jobPay(job: JobPayFields) {
  if (typeof job.instructor_pay !== 'number') return 'Not set';
  return formatRate(job.instructor_pay, job.rate_basis);
}

/** "about KES 27,000", only when the pay is per session and the session count is known. */
export function estimatedJobTotal(job: JobPayFields & { session_count?: number | null }) {
  const count = job.session_count;
  if (job.rate_basis !== 'per_session' || typeof job.instructor_pay !== 'number') return null;
  if (typeof count !== 'number' || count < 1) return null;
  return `about ${formatRateAmount(job.instructor_pay * count)}`;
}

/** "6 sessions", "1 session", or a neutral fallback when the count is unknown. */
export function sessionsPhrase(count?: number | null, fallback = 'the sessions') {
  if (typeof count !== 'number' || count < 1) return fallback;
  return count === 1 ? '1 session' : `${count} sessions`;
}

export function recurrenceLabel(recurrence?: ClassRecurrence) {
  if (!recurrence) return 'One-time session';
  const unit = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month' }[
    recurrence.recurrence_type ?? 'WEEKLY'
  ];
  const interval = recurrence.interval_value ?? 1;
  const parts = [`Every ${interval} ${unit}${interval === 1 ? '' : 's'}`];
  if (recurrence.days_of_week)
    parts.push(`on ${jobLabel(recurrence.days_of_week).replace(/,/g, ', ')}`);
  if (recurrence.day_of_month) parts.push(`on day ${recurrence.day_of_month}`);
  if (recurrence.end_date) parts.push(`until ${formatDateOnly(recurrence.end_date)}`);
  if (recurrence.occurrence_count) parts.push(`${recurrence.occurrence_count} occurrences`);
  return parts.join(' · ');
}
