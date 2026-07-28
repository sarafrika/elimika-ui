// Shared types, catalogues, and pure helpers for the organisation create-class form.
// Kept UI-free so every section component and the container page import from one place.
import type { User } from '@/services/client';

// ─── Services (drive the session format; prices are display-only) ────────────
export type ServiceKey = '1on1' | 'group' | 'online' | 'private-online';
export type Service = {
  key: ServiceKey;
  title: string;
  subtitle?: string;
  price: string;
  unit: string;
  format: 'INDIVIDUAL' | 'GROUP';
};

export const SERVICES: Service[] = [
  { key: '1on1', title: '1-on-1 Session', price: 'KSh 1,500', unit: 'session', format: 'INDIVIDUAL' },
  { key: 'group', title: 'Group Session', subtitle: '(2–5 people)', price: 'KSh 1,200', unit: 'person', format: 'GROUP' },
  { key: 'online', title: 'Online Course', price: 'KSh 5,000', unit: 'course', format: 'GROUP' },
  { key: 'private-online', title: 'Private Online Class', price: 'KSh 3,000', unit: 'class', format: 'INDIVIDUAL' },
];

export const serviceFormat = (key: ServiceKey): 'INDIVIDUAL' | 'GROUP' =>
  SERVICES.find(s => s.key === key)?.format ?? 'GROUP';

// ─── Days ─────────────────────────────────────────────────────────────────────
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DayKey = (typeof DAYS)[number];
export type DayRow = { active: boolean; start: string; end: string; allDay: boolean };

export const DAY_TO_ISO: Record<DayKey, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
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
export const TARGET_GROUPS = [
  'Nursery',
  'Baby Class',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Junior Secondary',
  'Senior Secondary',
];

export const REMINDER_MINUTES: Record<string, number> = {
  '1h': 60,
  '6h': 360,
  '12h': 720,
  '24h': 1440,
  '48h': 2880,
};
export const TIMEZONES = ['EAT East Africa Time', 'UTC', 'GMT', 'CAT Central Africa Time'];

export type ScheduleMode = 'standard' | 'pick' | 'academic';
export type PeriodSlot = { day: DayKey; start: string; end: string };
export type AcademicPeriod = { id: string; name: string; startDate: string; endDate: string; slots: PeriodSlot[] };

export type ReminderState = {
  window: string;
  sendStudents: boolean;
  sendInstructor: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
};

export type UpcomingSession = { date: Date; label: string; time: string };

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

export const toDateTime = (dateISO: string, hhmm: string): Date => new Date(`${dateISO}T${hhmm}:00`);

export const num = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

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
      const [h, m] = timeStr.split(':').map(Number);
      const meetingAt = new Date(cursor);
      meetingAt.setHours(h || 0, m || 0, 0, 0);
      out.push({
        date: meetingAt,
        label: meetingAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        time: row.allDay ? 'All day' : `${row.start}–${row.end}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    if (out.length > 500) break;
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function fmtTime12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = (h || 0) >= 12 ? 'PM' : 'AM';
  const h12 = (h || 0) % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export function sessionEndFor(sessionStart: string, sessionDuration: string): string {
  const [h, m] = sessionStart.split(':').map(Number);
  const mins: Record<string, number> = { '30m': 30, '1h': 60, '1.5h': 90, '2h': 120, '3h': 180, '4h': 240 };
  const total = (h || 0) * 60 + (m || 0) + (mins[sessionDuration] ?? 120);
  return `${String(Math.floor((total / 60) % 24)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
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
    ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '?').toUpperCase()
    : '?';
export const instructorName = (u?: User) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Instructor' : 'Unassigned';
