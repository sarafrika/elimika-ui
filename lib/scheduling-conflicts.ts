import { dayjs, parseApiDate, resolveDisplayZone } from '@/lib/date';
import { asRecord } from '@/lib/error-utils';

/** One refused occurrence: its window as instants and every reason it clashed. */
export type SchedulingConflict = {
  start: Date | null;
  end: Date | null;
  reasons: string[];
};

export type SchedulingConflictReport = {
  message: string;
  conflicts: SchedulingConflict[];
};

// The API sends LocalDateTime in UTC without a zone suffix; parseApiDate reads it as UTC.
function instantOf(value: unknown) {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  return parseApiDate(value)?.toDate() ?? null;
}

/** Scheduling conflicts carry `reasons`; resource-booking conflicts carry `description`. */
export function toSchedulingConflict(entry: unknown): SchedulingConflict | null {
  const record = asRecord(entry);
  if (!record || Array.isArray(entry)) return null;

  const reasons = Array.isArray(record.reasons)
    ? record.reasons.filter((reason): reason is string => typeof reason === 'string')
    : [];
  if (typeof record.description === 'string') reasons.push(record.description);
  if (reasons.length === 0 && typeof record.conflict_type === 'string') {
    reasons.push(record.conflict_type.replaceAll('_', ' ').toLowerCase());
  }

  const start = instantOf(record.requested_start);
  const end = instantOf(record.requested_end);
  if (!start && !end && reasons.length === 0) return null;
  return { start, end, reasons };
}

export function toSchedulingConflicts(entries: unknown): SchedulingConflict[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .map(toSchedulingConflict)
    .filter((conflict): conflict is SchedulingConflict => conflict !== null);
}

/** A 409 `{ message, error: [conflicts] }` body as a report; null for any other error shape. */
export function parseSchedulingConflicts(error: unknown): SchedulingConflictReport | null {
  const body = asRecord(error);
  if (!body) return null;
  const conflicts = toSchedulingConflicts(body.error);
  if (conflicts.length === 0) return null;
  return {
    message: typeof body.message === 'string' ? body.message : 'Schedule conflicts detected',
    conflicts,
  };
}

/** "Sat 2 May 2026 · 12:00 PM – 2:00 PM", read in the zone the surrounding sessions use. */
export function conflictWindowLabel(conflict: SchedulingConflict, timeZone?: string | null) {
  const zone = resolveDisplayZone(timeZone);
  const start = conflict.start ? dayjs(conflict.start).tz(zone) : null;
  const end = conflict.end ? dayjs(conflict.end).tz(zone) : null;
  if (!start) return end ? `Until ${end.format('ddd D MMM YYYY · h:mm A')}` : null;

  const day = start.format('ddd D MMM YYYY');
  if (!end) return `${day} · ${start.format('h:mm A')}`;
  const until = end.isSame(start, 'day') ? end.format('h:mm A') : end.format('ddd D MMM · h:mm A');
  return `${day} · ${start.format('h:mm A')} – ${until}`;
}
