import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);

export { dayjs };

/**
 * Format a value as the `YYYY-MM-DD` string that the API's LocalDate
 * parameters require (e.g. timetable start/end). The generated client types
 * these as `Date`, but serializing a real Date produces a full ISO datetime,
 * which the backend rejects as a type mismatch.
 */
export function localDate(value: Date | string): Date {
  return dayjs(value).format('YYYY-MM-DD') as unknown as Date;
}

type ApiDateInput = string | number | Date | null | undefined;

// Matches an explicit UTC ("Z") or numeric offset ("+03:00", "-0500") suffix.
const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Parse a timestamp returned by the API into a `dayjs` instant.
 *
 * The backend serializes Java `LocalDateTime` values, which are UTC instants
 * emitted WITHOUT a timezone designator (e.g. `2026-07-09T09:00:00`). A plain
 * `new Date(...)`/`dayjs(...)` reads those as browser-local time and is wrong
 * by the viewer's UTC offset, so zone-less strings are interpreted as UTC.
 * Strings that already carry a `Z` or numeric offset are parsed as-is.
 *
 * Returns `null` for empty or unparseable input so callers can fall back.
 */
export function parseApiDate(value: ApiDateInput) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed =
    typeof value === 'string' && !HAS_TIMEZONE.test(value.trim())
      ? dayjs.utc(value)
      : dayjs(value);

  return parsed.isValid() ? parsed : null;
}

/**
 * Human-friendly "time ago" label that stays correct across time zones and is
 * granular down to seconds for very recent instants (e.g. "just now",
 * "12 seconds ago") instead of the coarse "less than a minute ago".
 */
export function relativeTimeFromNow(value: ApiDateInput, fallback = ''): string {
  const date = parseApiDate(value);
  if (!date) {
    return fallback;
  }

  const diffSeconds = dayjs().diff(date, 'second');

  if (diffSeconds >= 0 && diffSeconds < 60) {
    if (diffSeconds < 5) {
      return 'just now';
    }
    return `${diffSeconds} seconds ago`;
  }

  return date.fromNow();
}

/**
 * Absolute timestamp rendered in the viewer's local time zone, with the UTC
 * offset appended so the zone is unambiguous. Suited for tooltips/hover titles.
 */
export function absoluteDateTime(value: ApiDateInput, fallback = ''): string {
  const date = parseApiDate(value);
  return date ? date.local().format('MMM D, YYYY h:mm A [GMT]Z') : fallback;
}
