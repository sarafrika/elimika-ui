import { DEFAULT_CLASS_TIME_ZONE, dayjs, parseApiDate } from '@/lib/date';
import type { ClassBatchSummary, ClassDefinition, ScheduledInstance } from '@/services/client/types.gen';

type Session = Pick<ScheduledInstance, 'start_time' | 'end_time' | 'status'>;
type Definition = Pick<
  ClassDefinition,
  | 'sale_price'
  | 'rate_basis'
  | 'default_start_time'
  | 'default_end_time'
  | 'registration_period_end_date'
  | 'location_type'
  | 'location_name'
  | 'max_participants'
>;

export type ClassCardFacts = {
  /** What the learner pays for the whole class, as the cart prices it. */
  total: number | null;
  /** How the total is made, e.g. `KES 1,750/h × 6 h`; null when it is a flat price. */
  breakdown: string | null;
  sessionCount: number;
  firstStart: Date | null;
  /** `4 sessions · 09:00–10:30`, or the default times when no session is scheduled yet. */
  schedule: string;
  /** Online, or the venue — never both. */
  where: string;
  online: boolean;
  closed: boolean;
  closedReason: 'registration' | 'ended' | null;
  closingSoon: boolean;
  startsThisWeek: boolean;
  seatsLeft: number | null;
  capacity: number | null;
};

const DAY_MS = 86_400_000;
const CLOSING_SOON_DAYS = 3;
const ZONE = DEFAULT_CLASS_TIME_ZONE;

/** The API's dates as plain Dates (parseApiDate gives a Dayjs). */
const toDate = (value: unknown): Date | null => parseApiDate(value as Date)?.toDate() ?? null;

const money = (value: number) => Math.round(value).toLocaleString('en-KE');
const trim = (value: number) => Number(value.toFixed(2)).toString();

function hoursOf(session: Session): number {
  const start = toDate(session.start_time);
  const end = toDate(session.end_time);
  if (!start || !end) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

/**
 * Mirrors the backend's ClassLinePricing: the unit price times the units of the class's rate
 * basis in its timetable (hours by default), or the unit price alone when nothing is scheduled.
 */
export function classTotal(
  unitPrice: number | null | undefined,
  basis: Definition['rate_basis'],
  sessions: readonly Session[]
): { total: number | null; breakdown: string | null } {
  if (unitPrice == null || !Number.isFinite(unitPrice)) return { total: null, breakdown: null };
  const live = sessions.filter(session => session.status !== 'CANCELLED');
  let units = 0;
  let unitLabel = 'h';
  if (basis === 'per_session') {
    units = live.length;
    unitLabel = units === 1 ? 'session' : 'sessions';
  } else if (basis === 'per_day') {
    units = new Set(live.map(s => dayjs(toDate(s.start_time)).tz(ZONE).format('YYYY-MM-DD'))).size;
    unitLabel = units === 1 ? 'day' : 'days';
  } else {
    units = live.reduce((sum, session) => sum + hoursOf(session), 0);
  }
  if (units <= 0) return { total: unitPrice, breakdown: null };
  const per = basis === 'per_session' ? 'session' : basis === 'per_day' ? 'day' : 'h';
  return {
    total: unitPrice * units,
    breakdown: `KES ${money(unitPrice)}/${per} × ${trim(units)} ${unitLabel}`,
  };
}

const clock = (value: unknown) => {
  const date = toDate(value);
  return date ? dayjs(date).tz(ZONE).format('HH:mm') : null;
};

export function classCardFacts(
  definition: Definition,
  sessions: readonly Session[],
  summary: Pick<ClassBatchSummary, 'seats_remaining' | 'max_participants'> | undefined,
  now: Date = new Date()
): ClassCardFacts {
  const live = sessions
    .filter(session => session.status !== 'CANCELLED')
    .map(session => ({ session, start: toDate(session.start_time), end: toDate(session.end_time) }))
    .filter((row): row is { session: Session; start: Date; end: Date } => Boolean(row.start && row.end))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const upcoming = live.filter(row => row.end.getTime() > now.getTime());
  const firstStart = upcoming[0]?.start ?? toDate(definition.default_start_time);
  const ended = live.length > 0 && upcoming.length === 0;
  const registrationEnd = toDate(definition.registration_period_end_date);
  const registrationClosed = Boolean(registrationEnd && registrationEnd.getTime() + DAY_MS <= now.getTime());
  const closed = ended || registrationClosed;

  const { total, breakdown } = classTotal(definition.sale_price, definition.rate_basis, live.map(row => row.session));

  const startClock = clock(live[0]?.session.start_time ?? definition.default_start_time);
  const endClock = clock(live[0]?.session.end_time ?? definition.default_end_time);
  const times = startClock && endClock ? `${startClock}–${endClock}` : '';
  const count = live.length;
  const schedule = [count ? `${count} session${count === 1 ? '' : 's'}` : 'Schedule to be set', times]
    .filter(Boolean)
    .join(' · ');

  const location = definition.location_type?.toUpperCase();
  const online = location === 'ONLINE' || !definition.location_name;
  const where = online ? 'Online · link after you join' : (definition.location_name ?? 'Venue to be confirmed');

  const capacity = Number(summary?.max_participants ?? definition.max_participants ?? 0) || null;
  const seatsLeft = summary?.seats_remaining == null ? null : Number(summary.seats_remaining);

  const closesIn = registrationEnd ? (registrationEnd.getTime() + DAY_MS - now.getTime()) / DAY_MS : null;
  return {
    total,
    breakdown,
    sessionCount: count,
    firstStart,
    schedule,
    where,
    online,
    closed,
    closedReason: ended ? 'ended' : registrationClosed ? 'registration' : null,
    closingSoon: !closed && closesIn != null && closesIn <= CLOSING_SOON_DAYS,
    startsThisWeek:
      !closed && Boolean(firstStart && firstStart.getTime() - now.getTime() <= 7 * DAY_MS && firstStart.getTime() >= now.getTime()),
    seatsLeft,
    capacity,
  };
}

/** `Sat 14 Nov`, in class time. */
export function startChip(date: Date | null): string {
  return date ? dayjs(date).tz(ZONE).format('ddd D MMM') : 'Date to be set';
}

/** `KES 10,500`. */
export function formatKes(value: number | null): string {
  return value == null ? 'Price on request' : `KES ${money(value)}`;
}
