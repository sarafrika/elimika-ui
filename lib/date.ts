import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };

export type ApiDateInput = string | number | Date | null | undefined;

/** Fallback zone used when the viewer's zone cannot be resolved. */
export const UTC_ZONE = 'UTC';

/** Default zone for class schedules shown as East Africa Time in the class forms. */
export const DEFAULT_CLASS_TIME_ZONE = 'Africa/Nairobi';

const SCHEDULE_TIME_ZONE_ALIASES: Record<string, string> = {
  'Africa/Nairobi': DEFAULT_CLASS_TIME_ZONE,
  EAT: DEFAULT_CLASS_TIME_ZONE,
  'EAT East Africa Time': DEFAULT_CLASS_TIME_ZONE,
  UTC: UTC_ZONE,
  'UTC Coordinated Universal Time': UTC_ZONE,
  GMT: UTC_ZONE,
  'Etc/UTC': UTC_ZONE,
  CAT: 'Africa/Maputo',
  'CAT Central Africa Time': 'Africa/Maputo',
  WAT: 'Africa/Lagos',
  'WAT West Africa Time': 'Africa/Lagos',
};

const COMMON_SCHEDULE_TIME_ZONES = [
  DEFAULT_CLASS_TIME_ZONE,
  UTC_ZONE,
  'Africa/Lagos',
  'Africa/Maputo',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

/** Normalize a saved or detected timezone into a valid IANA zone. */
export function normalizeTimeZone(zone?: string | null, fallback = UTC_ZONE): string {
  const trimmed = zone?.trim();
  if (!trimmed) {
    return fallback;
  }
  const alias = SCHEDULE_TIME_ZONE_ALIASES[trimmed];
  if (alias) {
    return alias;
  }
  return isValidTimeZone(trimmed) ? trimmed : fallback;
}

/**
 * Normalize labels from legacy timezone selects into IANA zones that can be used
 * for actual instant conversion.
 */
export function normalizeScheduleTimeZone(zone?: string | null): string {
  return normalizeTimeZone(zone, DEFAULT_CLASS_TIME_ZONE);
}

export function scheduleTimeZoneOptions(activeZone?: string | null): string[] {
  const active = activeZone ? normalizeScheduleTimeZone(activeZone) : undefined;
  const options = [...COMMON_SCHEDULE_TIME_ZONES];
  return active && !options.includes(active as (typeof COMMON_SCHEDULE_TIME_ZONES)[number])
    ? [active, ...options]
    : options;
}

export function scheduleTimeZoneLabel(zone?: string | null): string {
  const normalized = normalizeScheduleTimeZone(zone);
  const city = normalized.split('/').at(-1)?.replace(/_/g, ' ') ?? normalized;
  const abbreviation = zoneAbbreviation(new Date(), normalized);

  if (normalized === DEFAULT_CLASS_TIME_ZONE) {
    return `East Africa Time (${normalized})`;
  }
  if (normalized === UTC_ZONE) {
    return 'Coordinated Universal Time (UTC)';
  }

  return abbreviation ? `${city} (${abbreviation}, ${normalized})` : normalized;
}

/**
 * Convert a class form's local wall-clock date/time into the UTC ISO instant the
 * backend stores. For example, 2026-09-01 09:00 in Africa/Nairobi becomes
 * 2026-09-01T06:00:00.000Z.
 */
export function toUtcIsoDateTime(dateISO?: string, time?: string, zone?: string | null): string {
  if (!dateISO) throw new Error('Missing date');
  if (!time) throw new Error(`Missing time for date: ${dateISO}`);

  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const zoneName = normalizeScheduleTimeZone(zone);
  const parsed = dayjs.tz(`${dateISO}T${normalizedTime}`, zoneName);

  if (!parsed.isValid()) {
    throw new Error(`Invalid datetime: ${dateISO}T${normalizedTime}`);
  }

  return parsed.utc().toISOString();
}

export function formatScheduleClockTime(
  value: ApiDateInput,
  zone?: string | null,
  fallback = ''
): string {
  const parsed = parseApiDate(value);
  if (!parsed) {
    return fallback;
  }
  return parsed.tz(normalizeScheduleTimeZone(zone)).format('h:mm A');
}

/**
 * Format a value as the `YYYY-MM-DD` string that the API's LocalDate
 * parameters require (e.g. timetable start/end). The generated client types
 * these as `Date`, but serializing a real Date produces a full ISO datetime,
 * which the backend rejects as a type mismatch.
 */
export function localDate(value: Date | string): Date {
  return dayjs(value).format('YYYY-MM-DD') as unknown as Date;
}

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
    typeof value === 'string' && !HAS_TIMEZONE.test(value.trim()) ? dayjs.utc(value) : dayjs(value);

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

/**
 * Resolve the IANA time zone to display timestamps in. Prefers an explicit zone
 * (a user preference, or an entity's own zone such as a scheduled class), then
 * the viewer's detected browser zone, falling back to UTC. Detection is only
 * meaningful on the client; on the server it returns UTC so SSR stays stable.
 */
export function resolveDisplayZone(zone?: string | null): string {
  if (zone) {
    return normalizeTimeZone(zone);
  }
  try {
    return normalizeTimeZone(dayjs.tz.guess(), UTC_ZONE);
  } catch {
    return UTC_ZONE;
  }
}

interface FormatOptions {
  /** Target IANA zone. Defaults to the viewer's local zone when omitted. */
  zone?: string | null;
  /** Text returned for null/invalid input. */
  fallback?: string;
}

/** Parse an API instant and move it into the requested (or viewer-local) zone. */
function inZone(value: ApiDateInput, zone?: string | null) {
  const date = parseApiDate(value);
  if (!date) {
    return null;
  }
  return zone ? date.tz(resolveDisplayZone(zone)) : date.local();
}

/** Short zone abbreviation (e.g. "EAT", "GMT+3") for the given instant/zone. */
function zoneAbbreviation(date: Date, zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'short',
    }).formatToParts(date);
    return parts.find(part => part.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

/** Absolute date + time, e.g. "Sep 5, 2024, 9:00 AM", in the target zone. */
export function formatDateTime(value: ApiDateInput, options: FormatOptions = {}): string {
  const date = inZone(value, options.zone);
  return date ? date.format('MMM D, YYYY, h:mm A') : (options.fallback ?? '—');
}

/** Absolute date only, e.g. "Sep 5, 2024", in the target zone. */
export function formatDate(value: ApiDateInput, options: FormatOptions = {}): string {
  const date = inZone(value, options.zone);
  return date ? date.format('MMM D, YYYY') : (options.fallback ?? '—');
}

/** Time only, e.g. "9:00 AM", in the target zone. */
export function formatTime(value: ApiDateInput, options: FormatOptions = {}): string {
  const date = inZone(value, options.zone);
  return date ? date.format('h:mm A') : (options.fallback ?? '—');
}

/**
 * Date + time with the zone abbreviation appended, e.g. "Sep 5, 2024, 9:00 AM
 * EAT". Use for scheduled sessions where the operative zone must be explicit.
 */
export function formatDateTimeWithZone(value: ApiDateInput, options: FormatOptions = {}): string {
  const date = inZone(value, options.zone);
  if (!date) {
    return options.fallback ?? '—';
  }
  const abbreviation = zoneAbbreviation(date.toDate(), resolveDisplayZone(options.zone));
  const formatted = date.format('MMM D, YYYY, h:mm A');
  return abbreviation ? `${formatted} ${abbreviation}` : formatted;
}

/**
 * Format a calendar date that is NOT an instant — dates of birth, document
 * expiry, course start/end days. These carry no time-of-day and must never be
 * shifted across zones (doing so causes off-by-one-day errors), so they are
 * always read and rendered in UTC.
 */
export function formatDateOnly(value: ApiDateInput, fallback = '—'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const date = dayjs.utc(value);
  return date.isValid() ? date.format('MMM D, YYYY') : fallback;
}
