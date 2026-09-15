import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessmentDates, belongsToSession } from './assessment-scheduling';

test('schedules in the session timezone, independently of the browser timezone', () => {
  const dates = assessmentDates(
    '2026-09-15T09:00',
    '2026-09-15T10:00',
    '2026-09-22T10:00',
    'Africa/Nairobi'
  );
  assert.equal(dates.visible.toISOString(), '2026-09-15T06:00:00.000Z');
  assert.equal(dates.due.toISOString(), '2026-09-15T07:00:00.000Z');
  assert.equal(dates.grading.toISOString(), '2026-09-22T07:00:00.000Z');
});

test('accounts for daylight saving changes between release and submission', () => {
  const dates = assessmentDates(
    '2026-03-07T09:00',
    '2026-03-09T09:00',
    '2026-03-10T09:00',
    'America/New_York'
  );
  assert.equal(dates.visible.toISOString(), '2026-03-07T14:00:00.000Z');
  assert.equal(dates.due.toISOString(), '2026-03-09T13:00:00.000Z');
});

test('rejects missing dates and deadlines out of order', () => {
  assert.throws(
    () => assessmentDates('', '2026-09-15T10:00', '2026-09-22T10:00', 'UTC'),
    /all three/
  );
  assert.throws(
    () => assessmentDates('2026-09-15T11:00', '2026-09-15T10:00', '2026-09-22T10:00', 'UTC'),
    /before the release/
  );
  assert.throws(
    () => assessmentDates('2026-09-15T09:00', '2026-09-15T10:00', '2026-09-15T09:59', 'UTC'),
    /before the submission/
  );
});

test('keeps other session tasks separate while retaining class-wide schedules', () => {
  assert.equal(belongsToSession({ class_lesson_plan_uuid: 'session-a' }, 'session-a'), true);
  assert.equal(belongsToSession({ class_lesson_plan_uuid: 'session-b' }, 'session-a'), false);
  assert.equal(belongsToSession({}, 'session-a'), true);
});
