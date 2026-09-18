import type { Dayjs } from 'dayjs';

import { dayjs, localDate, parseApiDate } from '@/lib/date';
import type { InstructorCalendarEntry, InstructorTimeHold } from '@/services/client';

import { hiredJobHref, instructorClassHref } from '../job-routes';

export type WeekBlockKind = 'hold' | 'class';

export type WeekBlock = {
  key: string;
  kind: WeekBlockKind;
  title: string;
  organisation: string | null;
  time: string;
  start: number;
  href: string | null;
};

export type WeekDay = {
  key: string;
  weekday: string;
  date: string;
  isToday: boolean;
  blocks: WeekBlock[];
};

/** Monday 00:00 in the viewer's zone. */
export function startOfWeek(value: Dayjs = dayjs()): Dayjs {
  const day = value.startOf('day');
  return day.subtract((day.day() + 6) % 7, 'day');
}

/** The API reads whole UTC days, so a day either side keeps early and late local sessions in. */
export function weekQueryRange(weekStart: Dayjs) {
  return {
    start: localDate(weekStart.subtract(1, 'day').toDate()),
    end: localDate(weekStart.add(7, 'day').toDate()),
  };
}

/** "Oct 12 – 18", or "Sep 28 – Oct 4" across a month. */
export function weekLabel(weekStart: Dayjs) {
  const end = weekStart.add(6, 'day');
  return weekStart.month() === end.month()
    ? `${weekStart.format('MMM D')} – ${end.format('D')}`
    : `${weekStart.format('MMM D')} – ${end.format('MMM D')}`;
}

/** "2:00–4:00 PM", or "9:00 AM–12:00 PM" when the window crosses noon. */
function timeRange(start: Dayjs, end: Dayjs | null) {
  if (!end) return start.format('h:mm A');
  return start.format('A') === end.format('A')
    ? `${start.format('h:mm')}–${end.format('h:mm A')}`
    : `${start.format('h:mm A')}–${end.format('h:mm A')}`;
}

const CLOSED_SESSION_STATUSES = ['CANCELLED', 'BLOCKED'];

// Lays hired time over Monday–Sunday: FIRM holds are hires still waiting on their class, and
// scheduled sessions are only those of classes created from the instructor's hires.
export function buildWeek(
  weekStart: Dayjs,
  holds: InstructorTimeHold[],
  entries: InstructorCalendarEntry[],
  hiredClassUuids: ReadonlySet<string>
): WeekDay[] {
  const blocks: (WeekBlock & { day: string })[] = [];

  for (const hold of holds) {
    const start = parseApiDate(hold.start_time)?.local();
    if (hold.status !== 'FIRM' || !start) continue;
    const end = parseApiDate(hold.end_time)?.local() ?? null;
    blocks.push({
      key: `hold-${hold.uuid ?? start.valueOf()}`,
      kind: 'hold',
      title: hold.title?.trim() || 'Hired job',
      organisation: hold.organisation_name?.trim() || null,
      time: timeRange(start, end),
      start: start.valueOf(),
      href: hold.job_uuid ? hiredJobHref(hold.job_uuid) : null,
      day: start.format('YYYY-MM-DD'),
    });
  }

  for (const entry of entries) {
    const classUuid = entry.class_definition_uuid;
    const start = parseApiDate(entry.start_time)?.local();
    if (entry.entry_type !== 'SCHEDULED_INSTANCE' || !start || !classUuid) continue;
    if (!hiredClassUuids.has(classUuid) || CLOSED_SESSION_STATUSES.includes(entry.status ?? '')) {
      continue;
    }
    const end = parseApiDate(entry.end_time)?.local() ?? null;
    blocks.push({
      key: `class-${entry.uuid ?? start.valueOf()}`,
      kind: 'class',
      title: entry.title?.trim() || 'Class session',
      organisation: entry.organisation_name?.trim() || null,
      time: timeRange(start, end),
      start: start.valueOf(),
      href: instructorClassHref(classUuid),
      day: start.format('YYYY-MM-DD'),
    });
  }

  const today = dayjs().format('YYYY-MM-DD');
  return Array.from({ length: 7 }, (_, index) => {
    const date = weekStart.add(index, 'day');
    const key = date.format('YYYY-MM-DD');
    return {
      key,
      weekday: date.format('ddd'),
      date: date.format('MMM D'),
      isToday: key === today,
      blocks: blocks.filter(block => block.day === key).sort((a, b) => a.start - b.start),
    };
  });
}
