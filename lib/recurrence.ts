import { RecurrenceTypeEnum } from '@/services/client';
import type { ClassRecurrence } from '@/services/client';

/**
 * Shared, UI-agnostic model for a Google Calendar–style session recurrence rule, plus helpers
 * to convert to/from the generated {@link ClassRecurrence} API shape. Used by every class-creation
 * form (organisation, instructor, course-creator) so session repeating behaves identically.
 */

/** Week days in display order (Monday first), matching the backend day-name tokens. */
export const RECURRENCE_WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type RecurrenceDay = (typeof RECURRENCE_WEEK_DAYS)[number];

/** Short labels for the weekday chips, keyed by day token. */
export const RECURRENCE_DAY_SHORT: Record<RecurrenceDay, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

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

/** One resolved weekly session slot when each weekday has its own time. */
export interface WeeklyDaySpec {
  day: RecurrenceDay;
  /** yyyy-MM-dd of the first occurrence, aligned to `day` on/after the base date. */
  date: string;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  /** Single-weekday WEEKLY recurrence rule for this slot. */
  recurrence: ClassRecurrence;
}

const DAY_TO_JS_INDEX: Record<RecurrenceDay, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function applyEndCondition(recurrence: ClassRecurrence, value: RecurrenceValue): ClassRecurrence {
  if (value.end.mode === 'on' && value.end.date) {
    return { ...recurrence, end_date: new Date(value.end.date) };
  }
  if (value.end.mode === 'after' && value.end.count) {
    return { ...recurrence, occurrence_count: Math.max(1, Math.trunc(value.end.count)) };
  }
  return recurrence;
}

/**
 * Expand a WEEKLY value with per-day times into one slot per selected weekday. Each slot's date is
 * the first occurrence of that weekday on/after `baseDateISO`; its time falls back to the supplied
 * defaults when the weekday has no override. Returns [] for non-weekly or non-per-day values.
 */
export function buildWeeklyDaySpecs(
  value: RecurrenceValue,
  baseDateISO: string,
  defaultStart: string,
  defaultEnd: string
): WeeklyDaySpec[] {
  if (value.frequency !== 'WEEKLY' || !value.perDayTimes) return [];
  const base = new Date(baseDateISO);
  if (Number.isNaN(base.getTime())) return [];

  const ordered = RECURRENCE_WEEK_DAYS.filter(day => value.daysOfWeek.includes(day));
  return ordered.map(day => {
    const cursor = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    while (cursor.getDay() !== DAY_TO_JS_INDEX[day]) {
      cursor.setDate(cursor.getDate() + 1);
    }
    const override = value.dayTimes?.[day];
    const recurrence = applyEndCondition(
      {
        recurrence_type: RecurrenceTypeEnum.WEEKLY,
        interval_value: Math.max(1, Math.trunc(value.interval) || 1),
        days_of_week: day,
      },
      value
    );
    return {
      day,
      date: formatLocalDate(cursor),
      startTime: override?.start || defaultStart,
      endTime: override?.end || defaultEnd,
      recurrence,
    };
  });
}

const UNIT_LABEL: Record<Exclude<RecurrenceFrequency, 'NONE'>, string> = {
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
};

function isRecurrenceDay(value: string): value is RecurrenceDay {
  return (RECURRENCE_WEEK_DAYS as readonly string[]).includes(value);
}

/** yyyy-MM-dd string suitable for a <input type="date"> from a Date/ISO value. */
function toDateInputValue(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

/** A sensible starting value: does-not-repeat, with the monthly day derived from the start date. */
export function defaultRecurrenceValue(startISO?: string): RecurrenceValue {
  const start = startISO ? new Date(startISO) : undefined;
  const dayOfMonth = start && !Number.isNaN(start.getTime()) ? start.getDate() : undefined;
  return {
    frequency: 'NONE',
    interval: 1,
    daysOfWeek: [],
    perDayTimes: false,
    dayTimes: {},
    dayOfMonth,
    end: { mode: 'never' },
  };
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

/** Rebuild the editor value from a persisted API recurrence rule (for edit prefill). */
export function fromClassRecurrence(recurrence?: ClassRecurrence): RecurrenceValue {
  if (!recurrence?.recurrence_type) return defaultRecurrenceValue();

  const daysOfWeek =
    typeof recurrence.days_of_week === 'string'
      ? recurrence.days_of_week
          .split(',')
          .map(day => day.trim())
          .filter(isRecurrenceDay)
      : [];

  let end: RecurrenceValue['end'] = { mode: 'never' };
  if (recurrence.end_date) {
    end = { mode: 'on', date: toDateInputValue(recurrence.end_date) };
  } else if (recurrence.occurrence_count) {
    end = { mode: 'after', count: recurrence.occurrence_count };
  }

  return {
    frequency: recurrence.recurrence_type,
    interval: recurrence.interval_value ?? 1,
    daysOfWeek,
    dayOfMonth: recurrence.day_of_month,
    end,
  };
}

/**
 * Estimate how many sessions a rule produces. Best-effort: exact when the value uses an occurrence
 * count, otherwise falls back to 1 (open-ended / date-bounded rules can't be counted without a start).
 */
export function estimateOccurrences(value: RecurrenceValue): number {
  if (value.frequency === 'NONE') return 1;
  if (value.end.mode === 'after' && value.end.count) return Math.max(1, Math.trunc(value.end.count));
  return 1;
}

/** Human-readable one-line summary, e.g. "Weekly on Mon, Wed · 6 times". */
export function summarizeRecurrence(value: RecurrenceValue): string {
  if (value.frequency === 'NONE') return 'Does not repeat';

  const unit = UNIT_LABEL[value.frequency];
  const simpleLabel = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' } as const;
  const base =
    value.interval > 1 ? `Every ${value.interval} ${unit}s` : simpleLabel[value.frequency];

  const parts: string[] = [base];

  if (value.frequency === 'WEEKLY' && value.daysOfWeek.length > 0) {
    const ordered = RECURRENCE_WEEK_DAYS.filter(day => value.daysOfWeek.includes(day));
    parts[0] = `${base} on ${ordered.map(day => RECURRENCE_DAY_SHORT[day]).join(', ')}`;
  }
  if (value.frequency === 'MONTHLY' && value.dayOfMonth) {
    parts[0] = `${base} on day ${value.dayOfMonth}`;
  }

  if (value.end.mode === 'on' && value.end.date) {
    const label = toDateInputValue(value.end.date);
    if (label) parts.push(`until ${label}`);
  } else if (value.end.mode === 'after' && value.end.count) {
    parts.push(`${value.end.count} time${value.end.count > 1 ? 's' : ''}`);
  }

  return parts.join(' · ');
}
