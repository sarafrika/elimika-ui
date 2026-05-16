'use client';

import { ScheduleSettings } from './page';

export type ScheduleMode = 'class' | 'custom';

export interface ScheduledSessionInstance {
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
}

const padNumber = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

export const calculateSessionHours = (start: string, end: string): number => {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return Math.max(0, (endMinutes - startMinutes) / 60);
};

export const formatSessionDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const buildUtcIsoDateTime = (date: string, time: string) =>
  new Date(`${date}T${time}:00Z`).toISOString();

export const generateScheduleInstances = (
  scheduleSettings: ScheduleSettings
): ScheduledSessionInstance[] => {
  const {
    startClass,
    endRepeat,
    allDay,
    repeat: { interval, unit, days = [] },
  } = scheduleSettings;

  if (!startClass.date || !endRepeat) return [];

  const startTime = allDay ? '00:00' : startClass.startTime || '';
  const endTime = allDay ? '23:59' : startClass.endTime || '';

  if (!allDay && (!startTime || !endTime)) return [];
  if (unit === 'week' && days.length === 0) return [];

  const start = new Date(`${startClass.date}T00:00:00`);
  const end = new Date(`${endRepeat}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const sessions: ScheduledSessionInstance[] = [];
  const hours = allDay ? 24 : calculateSessionHours(startTime, endTime);

  const pushSession = (date: Date) => {
    sessions.push({
      date: toDateKey(date),
      startTime,
      endTime,
      hours,
    });
  };

  switch (unit) {
    case 'day': {
      const cursor = new Date(start);
      while (cursor <= end) {
        pushSession(cursor);
        cursor.setDate(cursor.getDate() + interval);
      }
      break;
    }
    case 'week': {
      const startOfWeek = new Date(start);
      const dayIndex = startOfWeek.getDay();
      const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

      const weekCursor = new Date(startOfWeek);

      while (weekCursor <= end) {
        days
          .slice()
          .sort((a, b) => a - b)
          .forEach(day => {
            const occurrence = new Date(weekCursor);
            occurrence.setDate(weekCursor.getDate() + day);

            if (occurrence >= start && occurrence <= end) {
              pushSession(occurrence);
            }
          });

        weekCursor.setDate(weekCursor.getDate() + interval * 7);
      }
      break;
    }
    case 'month': {
      const cursor = new Date(start);
      while (cursor <= end) {
        pushSession(cursor);
        cursor.setMonth(cursor.getMonth() + interval);
      }
      break;
    }
    case 'year': {
      const cursor = new Date(start);
      while (cursor <= end) {
        pushSession(cursor);
        cursor.setFullYear(cursor.getFullYear() + interval);
      }
      break;
    }
    default:
      break;
  }

  return sessions;
};
