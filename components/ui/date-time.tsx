'use client';

import { useTimeZone } from '@/context/timezone-context';
import {
  type ApiDateInput,
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatDateTimeWithZone,
  formatTime,
  relativeTimeFromNow,
} from '@/lib/date';
import { cn } from '@/lib/utils';

type DateTimeVariant =
  | 'datetime' // Sep 5, 2024, 9:00 AM
  | 'datetime-zone' // Sep 5, 2024, 9:00 AM EAT
  | 'date' // Sep 5, 2024
  | 'time' // 9:00 AM
  | 'relative' // 3 hours ago
  | 'calendar-date'; // Sep 5, 2024 (never zone-shifted; for DOB/expiry/course days)

interface DateTimeProps {
  /** UTC instant from the API (ISO string, epoch, or Date). */
  value: ApiDateInput;
  /** Which representation to render. */
  variant?: DateTimeVariant;
  /**
   * Explicit IANA zone override. Use for values that have their own operative
   * zone (e.g. a scheduled class); omit to use the viewer's zone.
   */
  zone?: string;
  /** Text to show for null/invalid values. */
  fallback?: string;
  className?: string;
}

/**
 * Renders an API timestamp in the viewer's time zone (or an explicit `zone`),
 * with the full local date-time on hover. Every timestamp in the UI — audit
 * fields included — should go through this component or the `lib/date`
 * formatters rather than `new Date(...).toLocaleString()`.
 */
export function DateTime({
  value,
  variant = 'datetime',
  zone,
  fallback = '—',
  className,
}: DateTimeProps) {
  const { zone: viewerZone } = useTimeZone();
  const targetZone = zone ?? viewerZone;
  const options = { zone: targetZone, fallback };

  let text: string;
  switch (variant) {
    case 'date':
      text = formatDate(value, options);
      break;
    case 'time':
      text = formatTime(value, options);
      break;
    case 'relative':
      text = relativeTimeFromNow(value, fallback);
      break;
    case 'datetime-zone':
      text = formatDateTimeWithZone(value, options);
      break;
    case 'calendar-date':
      text = formatDateOnly(value, fallback);
      break;
    default:
      text = formatDateTime(value, options);
  }

  const iso =
    typeof value === 'string'
      ? value
      : value instanceof Date
        ? value.toISOString()
        : undefined;

  // Tooltip always shows the unambiguous zoned date-time.
  const title =
    variant === 'relative' || variant === 'calendar-date'
      ? undefined
      : formatDateTimeWithZone(value, { zone: targetZone, fallback: '' }) || undefined;

  return (
    <time
      dateTime={iso}
      title={title}
      className={cn(className)}
      suppressHydrationWarning
    >
      {text}
    </time>
  );
}
