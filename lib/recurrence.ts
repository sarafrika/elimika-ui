import { RecurrenceTypeEnum } from '@/services/client';
import type { ClassRecurrence } from '@/services/client';

/**
 * Shared, UI-agnostic model for a Google Calendar–style session recurrence rule, plus helpers
 * to convert to/from the generated {@link ClassRecurrence} API shape. Used by every class-creation
 * form (organisation, instructor, course-creator) so session repeating behaves identically.
 */

/** Week days in display order (Monday first), matching the backend day-name tokens. */
const RECURRENCE_WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type RecurrenceDay = (typeof RECURRENCE_WEEK_DAYS)[number];
/** 'NONE' means "Does not repeat" — a single session with no recurrence rule. */
export type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type RecurrenceEndMode = 'never' | 'on' | 'after';

export interface RecurrenceValue {
  frequency: RecurrenceFrequency;
  /** "Repeat every N" — always >= 1. */
  interval: number;
  /** Selected weekdays (WEEKLY only). */
  daysOfWeek: RecurrenceDay[];
  /** WEEKLY only: when true, each selected weekday carries its own start/end time. */
  perDayTimes?: boolean;
  /** WEEKLY per-day mode: HH:mm times keyed by weekday. */
  dayTimes?: Partial<Record<RecurrenceDay, { start: string; end: string }>>;
  /** Day of month to repeat on (MONTHLY only), 1-31. */
  dayOfMonth?: number;
  end: { mode: RecurrenceEndMode; date?: string; count?: number };
}

/**
 * Convert the editor value to the API recurrence rule. Returns `undefined` for a non-repeating
 * value so the host can emit a single session template with no `recurrence`.
 */
export function toClassRecurrence(value: RecurrenceValue): ClassRecurrence | undefined {
  if (value.frequency === 'NONE') return undefined;

  const recurrence: ClassRecurrence = {
    recurrence_type: RecurrenceTypeEnum[value.frequency],
    interval_value: Math.max(1, Math.trunc(value.interval) || 1),
  };

  if (value.frequency === 'WEEKLY' && value.daysOfWeek.length > 0) {
    recurrence.days_of_week = value.daysOfWeek.join(',');
  }
  if (value.frequency === 'MONTHLY' && value.dayOfMonth) {
    recurrence.day_of_month = value.dayOfMonth;
  }
  if (value.end.mode === 'on' && value.end.date) {
    recurrence.end_date = new Date(value.end.date);
  }
  if (value.end.mode === 'after' && value.end.count) {
    recurrence.occurrence_count = Math.max(1, Math.trunc(value.end.count));
  }

  return recurrence;
}
