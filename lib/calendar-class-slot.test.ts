import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarSlotAtHour, classScheduleFromCalendarSlot } from './calendar-class-slot';

test('calendar hours are interpreted in the displayed zone rather than the browser zone', () => {
  const slot = calendarSlotAtHour(new Date(2026, 10, 10), 9, 'Africa/Nairobi');
  assert.equal(slot.startTime.toISOString(), '2026-11-10T06:00:00.000Z');
  assert.equal(slot.endTime.toISOString(), '2026-11-10T07:00:00.000Z');
  assert.deepEqual(classScheduleFromCalendarSlot({ ...slot, timeZone: 'Africa/Nairobi' }), {
    date: '2026-11-10',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: '60',
    timezone: 'Africa/Nairobi',
  });
});

test('prefill preserves the local date when the selected instant falls on a different UTC day', () => {
  const slot = calendarSlotAtHour(new Date(2026, 10, 10), 0, 'Asia/Tokyo');
  assert.equal(slot.startTime.toISOString(), '2026-11-09T15:00:00.000Z');
  const schedule = classScheduleFromCalendarSlot({ ...slot, timeZone: 'Asia/Tokyo' });
  assert.equal(schedule.date, '2026-11-10');
  assert.equal(schedule.startTime, '00:00');
  assert.equal(schedule.endTime, '01:00');
});

test('selected minutes and duration reach the class scheduler unchanged', () => {
  assert.deepEqual(
    classScheduleFromCalendarSlot({
      startTime: new Date('2026-11-10T06:15:00Z'),
      endTime: new Date('2026-11-10T07:45:00Z'),
      timeZone: 'Africa/Lagos',
    }),
    {
      date: '2026-11-10',
      startTime: '07:15',
      endTime: '08:45',
      durationMinutes: '90',
      timezone: 'Africa/Lagos',
    }
  );
});

test('calendar slots use the seasonal UTC offset of the selected day', () => {
  const winter = calendarSlotAtHour(new Date(2026, 0, 10), 9, 'America/New_York');
  const summer = calendarSlotAtHour(new Date(2026, 6, 10), 9, 'America/New_York');
  assert.equal(winter.startTime.toISOString(), '2026-01-10T14:00:00.000Z');
  assert.equal(summer.startTime.toISOString(), '2026-07-10T13:00:00.000Z');
});
