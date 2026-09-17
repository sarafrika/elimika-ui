import { formatRate } from '@/lib/rate-card';
import type { ClassMarketplaceJob, ClassRecurrence } from '@/services/client';
import { formatDateOnly } from '@/lib/date';
import { isClassCreatedStatus } from './application-status';

export const JOB_HIRES_PATH = '/dashboard/instructor/job-hires';

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

export function jobPay(job: ClassMarketplaceJob) {
  if (typeof job.instructor_pay !== 'number') return 'Not set';
  return formatRate(job.instructor_pay, job.rate_basis);
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
