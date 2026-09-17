// Shared types, catalogues, and pure helpers for the organisation create-class form.
// Kept UI-free so every section component and the container page import from one place.
import { scheduleTimeZoneOptions, toUtcIsoDateTime } from '@/lib/date';
import {
  type DeliveryMode,
  formatRateAmount,
  formatRateBasis,
  getRateBasis,
  type RateBasis,
  type RateCard,
  type RateCardInput,
  rateFor,
  type TrainingFormat,
} from '@/lib/rate-card';
import type { User } from '@/services/client';

// ─── Services (drive the session format; each is priced from one rate card cell) ─
export type ServiceKey = '1on1' | 'group' | 'online' | 'private-online';
export type Service = {
  key: ServiceKey;
  title: string;
  subtitle: string;
  format: TrainingFormat;
  online: boolean;
};

export const SERVICES: readonly Service[] = [
  {
    key: '1on1',
    title: '1-on-1 session',
    subtitle: '1 learner',
    format: 'INDIVIDUAL',
    online: false,
  },
  { key: 'group', title: 'Group session', subtitle: '2–5 people', format: 'GROUP', online: false },
  {
    key: 'private-online',
    title: 'Private online class',
    subtitle: '1 learner',
    format: 'INDIVIDUAL',
    online: true,
  },
  { key: 'online', title: 'Online course', subtitle: 'Group', format: 'GROUP', online: true },
];

/** The two services a delivery offers: online ones for online, in-person ones otherwise. */
export const servicesFor = (delivery: DeliveryMode): Service[] =>
  SERVICES.filter(service => service.online === (delivery === 'ONLINE'));

export const getService = (key?: ServiceKey | null) =>
  SERVICES.find(service => service.key === key);

/** The service a saved job or class runs as, re-read against its delivery. */
export function serviceForDelivery(
  delivery: DeliveryMode,
  { serviceType, sessionFormat }: { serviceType?: string | null; sessionFormat?: string | null }
): ServiceKey {
  const saved = SERVICES.find(service => SERVICE_TYPE_ENUM[service.key] === serviceType);
  const format = saved?.format ?? (sessionFormat === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GROUP');
  return servicesFor(delivery).find(service => service.format === format)!.key;
}

export type BasisStatus = 'approved' | 'pending' | 'missing';

/** Whose rates the cards show: the viewer's own card, or someone they are booking. */
export type RateViewer = 'owner' | 'learner';

const FORMATS: readonly TrainingFormat[] = ['INDIVIDUAL', 'GROUP'];

/** Approved when the card prices the basis for the delivery; pending when only a proposal does. */
export function basisStatus(
  card: RateCardInput | null | undefined,
  proposedCard: RateCardInput | null | undefined,
  delivery: DeliveryMode,
  basis: RateBasis
): BasisStatus {
  const covers = (candidate: RateCardInput | null | undefined) =>
    FORMATS.some(format => rateFor(candidate, { format, delivery, basis }) !== null);
  if (covers(card)) return 'approved';
  return covers(proposedCard) ? 'pending' : 'missing';
}

export type { RateBasis } from '@/lib/rate-card';

// Only the apply-to-train wizard still reads these; new code uses `@/lib/rate-card` directly.
export { RATE_BASES } from '@/lib/rate-card';
export const DEFAULT_RATE_BASIS: RateBasis = 'per_hour';
export const rateBasisLabel = (basis?: RateBasis | null) => getRateBasis(basis).label;

/** The rate card the course creator approved; read it with `rateFor` from `@/lib/rate-card`. */
export type ApprovedRateCard = RateCard;

export const serviceFormat = (key?: ServiceKey | null): TrainingFormat =>
  getService(key)?.format ?? 'GROUP';

/** Map the UI service key onto the backend ServiceTypeEnum value. */
export const SERVICE_TYPE_ENUM: Record<
  ServiceKey,
  'ONE_ON_ONE' | 'GROUP' | 'ONLINE' | 'PRIVATE_ONLINE'
> = {
  '1on1': 'ONE_ON_ONE',
  group: 'GROUP',
  online: 'ONLINE',
  'private-online': 'PRIVATE_ONLINE',
};

// ─── Price and pay ────────────────────────────────────────────────────────────
export type ScheduleTotals = { sessions: number; minutes: number; days: number };

/** How many units of the basis a schedule bills: hours, sessions or distinct class days. */
export function billableUnits(basis: RateBasis, totals: ScheduleTotals): number {
  if (basis === 'per_session') return totals.sessions;
  if (basis === 'per_day') return totals.days;
  return Math.round((totals.minutes / 60) * 100) / 100;
}

/** "12 sessions", "1.5 hours", "1 day". */
export function unitsLabel(units: number, basis: RateBasis): string {
  const { unit } = getRateBasis(basis);
  const count = Number.isInteger(units) ? String(units) : String(Number(units.toFixed(2)));
  return `${count} ${unit}${units === 1 ? '' : 's'}`;
}

export type PriceAndPayIssue = { message: string; incomplete: boolean };

/** The first reason a sale price and instructor pay can't be saved, or null when they can. */
export function priceAndPayIssue({
  salePrice,
  instructorPay,
  approvedRate,
  basis,
  currency,
  payAtLeastRate = false,
}: {
  salePrice: string;
  instructorPay: string;
  approvedRate?: number | null;
  basis: RateBasis;
  currency?: string | null;
  /** Set when the instructor being paid is the one whose rate this is. */
  payAtLeastRate?: boolean;
}): PriceAndPayIssue | null {
  const sale = num(salePrice);
  const pay = num(instructorPay);
  const issue = (message: string, incomplete = false) => ({ message, incomplete });
  if (sale === undefined) return issue('Enter the sale price and instructor pay.', true);
  if (sale <= 0) return issue('Sale price must be above zero.');
  const floor =
    typeof approvedRate === 'number'
      ? `${formatRateAmount(approvedRate, currency)} ${formatRateBasis(basis)}`
      : null;
  if (floor && sale < (approvedRate ?? 0)) {
    return issue(`Sale price is below your approved rate of ${floor}.`);
  }
  if (pay === undefined) return issue('Enter the instructor pay.', true);
  if (pay <= 0) return issue('Instructor pay must be above zero.');
  if (pay > sale) return issue('Instructor pay cannot exceed the sale price.');
  if (payAtLeastRate && floor && pay < (approvedRate ?? 0)) {
    return issue(`Instructor pay is below your approved rate of ${floor}.`);
  }
  return null;
}

// ─── Days ─────────────────────────────────────────────────────────────────────
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DayKey = (typeof DAYS)[number];
export type DayRow = {
  active: boolean;
  start: string;
  end: string;
  allDay: boolean;
};

export const DAY_TO_ISO: Record<DayKey, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 0,
};
export const DAY_TOKEN: Record<DayKey, string> = {
  Mon: 'MONDAY',
  Tue: 'TUESDAY',
  Wed: 'WEDNESDAY',
  Thu: 'THURSDAY',
  Fri: 'FRIDAY',
  Sat: 'SATURDAY',
  Sun: 'SUNDAY',
};
export const DAY_FULL: Record<DayKey, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export const DEFAULT_DAYS: Record<DayKey, DayRow> = {
  Mon: { active: false, start: '09:00', end: '11:00', allDay: false },
  Tue: { active: false, start: '09:00', end: '11:00', allDay: false },
  Wed: { active: true, start: '09:00', end: '11:00', allDay: false },
  Thu: { active: false, start: '09:00', end: '11:00', allDay: false },
  Fri: { active: true, start: '11:00', end: '12:00', allDay: false },
  Sat: { active: false, start: '09:00', end: '11:00', allDay: false },
  Sun: { active: false, start: '09:00', end: '11:00', allDay: false },
};

// Target groups are not yet backed — held in state only, ready for the group taxonomy endpoint.
export const REMINDER_MINUTES: Record<string, number> = {
  '1h': 60,
  '6h': 360,
  '12h': 720,
  '24h': 1440,
  '48h': 2880,
};
export { scheduleTimeZoneLabel, scheduleTimeZoneOptions } from '@/lib/date';
export const TIMEZONES = scheduleTimeZoneOptions();

export type ScheduleMode = 'standard' | 'pick' | 'academic';
export type PeriodSlot = { day: DayKey; start: string; end: string };
export type AcademicPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  slots: PeriodSlot[];
};

export type ReminderState = {
  window: string;
  sendStudents: boolean;
  sendInstructor: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
};

export type UpcomingSession = { date: Date; label: string; time: string; minutes: number };

// ─── Date / number helpers ─────────────────────────────────────────────────────
export const fmtDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (base: Date, days: number): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

export const firstOccurrenceOnOrAfter = (startDate: string, dayKey: DayKey): Date | null => {
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  const cursor = new Date(base);
  let guard = 0;
  while (cursor.getDay() !== DAY_TO_ISO[dayKey] && guard < 8) {
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return cursor;
};

export const toDateTime = (dateISO: string, hhmm: string, timezone?: string | null): Date =>
  toUtcIsoDateTime(dateISO, hhmm, timezone) as unknown as Date;

export const num = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

// ─── Registration window ──────────────────────────────────────────────────────
/** Per-field messages for the registration window; empty object means valid. */
export type RegistrationWindowErrors = { start?: string; end?: string };

export const REGISTRATION_WINDOW_HINT =
  'When students may enrol. Enrolment is refused before it opens and after it closes.';

/**
 * The registration window is mandatory on every class — a class with no window is a
 * class nobody can be enrolled on, since enrolment eligibility is decided against it.
 *
 * Both dates are required, the window may not close before it opens, and a window
 * being set on a class that does not exist yet may not already be over. Dates are
 * compared as `YYYY-MM-DD` strings, which sort chronologically, so no timezone can
 * shift a day boundary between the input and the check.
 *
 * @param options.requireOpen set when creating: refuses a window that has already closed.
 */
export function validateRegistrationWindow(
  start: string,
  end: string,
  options: { requireOpen?: boolean; today?: Date } = {}
): RegistrationWindowErrors {
  const errors: RegistrationWindowErrors = {};
  const from = start.trim();
  const to = end.trim();

  if (!from) errors.start = 'Set the date registration opens.';
  if (!to) errors.end = 'Set the date registration closes.';
  if (errors.start || errors.end) return errors;

  if (to < from) {
    errors.end = 'Registration must close on or after it opens.';
    return errors;
  }

  if (options.requireOpen && to < fmtDate(options.today ?? new Date())) {
    errors.end = 'This window has already closed — pick a closing date from today onwards.';
  }

  return errors;
}

/** The first message to put in front of the user, for forms that also toast. */
export const firstRegistrationWindowError = (
  errors: RegistrationWindowErrors
): string | undefined => errors.start ?? errors.end;

/**
 * A `format: date` field, in the shape the API actually contracts for: a bare
 * `YYYY-MM-DD` calendar day.
 *
 * The OpenAPI document is unambiguous — `registration_period_start_date` is
 * `{ type: ['string','null'], format: 'date' }` (schemas.gen.ts) and the generated
 * request validator is `z.union([z.string().date(), z.null()])` (zod.gen.ts), which
 * an ISO date-time string fails. The backing column is a Postgres `DATE` and the
 * Java field a `LocalDate`. A calendar day has no instant, so sending one as a
 * `Date` is what produced the original bug: `new Date('2026-09-05T00:00:00')` is
 * local midnight, which serialises to `2026-09-04T21:00:00Z` in UTC+3 and stores
 * the day before.
 *
 * @hey-api nevertheless types the field as `Date` — it applies its date transform
 * to every `format: date*` field without distinguishing days from instants — so the
 * assignment needs a cast. It is written here once, with this note, rather than left
 * to look like an oversight at each call site. Remove it if the client is ever
 * regenerated with `format: date` mapped to `string`.
 */
export const apiCalendarDay = (value: string): Date => value.trim() as unknown as Date;

/**
 * The calendar day a `format: date` response field names, as `YYYY-MM-DD` — the value
 * a `<input type="date">` wants, and the one to send back.
 *
 * The generated response transformer parses the bare `YYYY-MM-DD` it receives with
 * `new Date(...)`, which reads a date-only string as **UTC** midnight. The UTC half of
 * that instant is therefore the day that was stored, and local getters would hand back
 * the previous day for every viewer west of Greenwich. Empty string for anything absent
 * or unparseable, so a caller can `|| fallback`.
 */
export const calendarDayInput = (value: Date | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
};

/** {@link calendarDayInput} in the shape a request body wants; undefined when absent. */
export const toApiCalendarDay = (value: Date | string | null | undefined): Date | undefined => {
  const day = calendarDayInput(value);
  return day === '' ? undefined : apiCalendarDay(day);
};
/**
 * Length of a HH:mm-HH:mm window, in minutes.
 *
 * The single way to get a session's length anywhere in the form: the user sets a start and an end,
 * and the duration is read back off them. Returns undefined for a window that does not run forwards
 * so callers can separate mid-edit values from a valid class length.
 */
export function sessionMinutesFor(start: string, end: string): number | undefined {
  const [sh = NaN, sm = NaN] = start.split(':').map(Number);
  const [eh = NaN, em = NaN] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some(value => Number.isNaN(value))) return undefined;
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return minutes > 0 ? minutes : undefined;
}

/** Renders a session length the way the form shows it back to the user. */
export function formatDuration(minutes?: number): string {
  if (minutes === undefined) return 'Invalid';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function computeUpcomingSessions(
  startDate: string,
  endDate: string,
  days: Record<DayKey, DayRow>
): UpcomingSession[] {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const out: UpcomingSession[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const iso = cursor.getDay();
    for (const d of DAYS) {
      if (DAY_TO_ISO[d] !== iso) continue;
      const row = days[d];
      if (!row?.active) continue;
      const timeStr = row.allDay ? '09:00' : row.start;
      const durationMinutes = row.allDay ? 24 * 60 : sessionMinutesFor(row.start, row.end);
      if (durationMinutes === undefined) continue;
      const [h, m] = timeStr.split(':').map(Number);
      const meetingAt = new Date(cursor);
      meetingAt.setHours(h || 0, m || 0, 0, 0);
      out.push({
        date: meetingAt,
        label: meetingAt.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        time: row.allDay ? 'All day' : `${row.start}–${row.end}`,
        minutes: durationMinutes,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    if (out.length > 500) break;
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type SessionWindow = { start: Date; end: Date };

export function computeSessionWindows(
  startDate: string,
  endDate: string,
  days: Record<DayKey, DayRow>
): SessionWindow[] {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const out: SessionWindow[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const iso = cursor.getDay();
    for (const d of DAYS) {
      if (DAY_TO_ISO[d] !== iso) continue;
      const row = days[d];
      if (!row?.active) continue;
      const [sh, sm] = (row.allDay ? '00:00' : row.start).split(':').map(Number);
      const [eh, em] = (row.allDay ? '23:59' : row.end).split(':').map(Number);
      const windowStart = new Date(cursor);
      windowStart.setHours(sh || 0, sm || 0, 0, 0);
      const windowEnd = new Date(cursor);
      windowEnd.setHours(eh || 0, em || 0, 0, 0);
      if (windowEnd > windowStart) out.push({ start: windowStart, end: windowEnd });
    }
    cursor.setDate(cursor.getDate() + 1);
    if (out.length > 500) break;
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

const INACTIVE_DAY: DayRow = { active: false, start: '09:00', end: '10:00', allDay: false };

/** Every session a schedule creates, in date order, whichever way it was laid out. */
export function scheduledSessions({
  mode,
  startDate,
  endDate,
  days,
  pickedDates,
  sessionStart,
  sessionEnd,
  periods,
}: {
  mode: ScheduleMode;
  startDate: string;
  endDate: string;
  days: Record<DayKey, DayRow>;
  pickedDates: Date[];
  sessionStart: string;
  sessionEnd: string;
  periods: AcademicPeriod[];
}): UpcomingSession[] {
  if (mode === 'standard') return computeUpcomingSessions(startDate, endDate, days);
  if (mode === 'pick') {
    const minutes = sessionMinutesFor(sessionStart, sessionEnd);
    if (minutes === undefined) return [];
    return computePickedSessions(pickedDates, sessionStart, sessionEnd, minutes);
  }
  const sessions = periods.flatMap(period =>
    period.slots.flatMap(slot => {
      const slotDays = Object.fromEntries(DAYS.map(day => [day, INACTIVE_DAY])) as Record<
        DayKey,
        DayRow
      >;
      slotDays[slot.day] = { active: true, start: slot.start, end: slot.end, allDay: false };
      return computeUpcomingSessions(period.startDate, period.endDate, slotDays);
    })
  );
  return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function computePickedSessions(
  pickedDates: Date[],
  start: string,
  end: string,
  minutes: number
): UpcomingSession[] {
  const [hours = 0, mins = 0] = start.split(':').map(Number);
  return pickedDates
    .map(picked => {
      const date = new Date(picked);
      date.setHours(hours, mins, 0, 0);
      const label = date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return { date, label, time: `${start}–${end}`, minutes };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Session count, scheduled minutes and distinct class days of a session list. */
export function scheduleTotals(sessions: UpcomingSession[]): ScheduleTotals {
  return {
    sessions: sessions.length,
    minutes: sessions.reduce((sum, session) => sum + session.minutes, 0),
    days: new Set(sessions.map(session => session.date.toDateString())).size,
  };
}

export function fmtTime12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = (h || 0) >= 12 ? 'PM' : 'AM';
  const h12 = (h || 0) % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export function periodStatus(p: AcademicPeriod): 'active' | 'upcoming' | 'ended' {
  const now = Date.now();
  const s = new Date(p.startDate).getTime();
  const e = new Date(p.endDate).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 'upcoming';
  if (now < s) return 'upcoming';
  if (now > e) return 'ended';
  return 'active';
}

export function fmtShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const instructorInitials = (u?: User) =>
  u
    ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() ||
      (u.email?.[0] ?? '?').toUpperCase()
    : '?';
export const instructorName = (u?: User) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Instructor' : 'Unassigned';

/**
 * One instructor the organisation may assign a class to. `uuid` is the **instructor profile**
 * uuid, not the user uuid — `default_instructor_uuid` on a class definition is checked against
 * the training approvals, which are recorded per instructor profile.
 */
export type InstructorOption = {
  uuid: string;
  name: string;
  avatarUrl?: string;
};

export const instructorOptionInitials = (option?: InstructorOption) =>
  option
    ? option.name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0] ?? '')
        .join('')
        .toUpperCase() || '?'
    : '?';
