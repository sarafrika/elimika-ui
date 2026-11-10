import { dayjs, normalizeScheduleTimeZone } from '@/lib/date';

export type CalendarClassSlot = {
  startTime: Date;
  endTime: Date;
  timeZone: string;
};

/** The grid's date is a wall-calendar day; its hour belongs to the displayed zone. */
export function calendarSlotAtHour(date: Date, hour: number, timeZone: string) {
  const day = dayjs(date).format('YYYY-MM-DD');
  const start = dayjs.tz(`${day} ${String(hour).padStart(2, '0')}:00`, timeZone);
  return { startTime: start.toDate(), endTime: start.add(1, 'hour').toDate() };
}

export function classScheduleFromCalendarSlot(slot: CalendarClassSlot) {
  const timezone = normalizeScheduleTimeZone(slot.timeZone);
  const start = dayjs(slot.startTime).tz(timezone);
  const end = dayjs(slot.endTime).tz(timezone);
  return {
    date: start.format('YYYY-MM-DD'),
    startTime: start.format('HH:mm'),
    endTime: end.format('HH:mm'),
    durationMinutes: String(end.diff(start, 'minute')),
    timezone,
  };
}
