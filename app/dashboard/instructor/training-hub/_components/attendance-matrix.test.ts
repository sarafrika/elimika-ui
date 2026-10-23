import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Enrollment, ScheduledInstance } from '@/services/client/types.gen';
import { buildClassAttendance } from './attendance-matrix';

function session(uuid: string, classId: string, day: number): ScheduledInstance {
  return {
    uuid,
    class_definition_uuid: classId,
    instructor_uuid: 'instructor',
    title: 'Class',
    start_time: new Date(Date.UTC(2026, 9, day, 8)),
    end_time: new Date(Date.UTC(2026, 9, day, 9)),
    timezone: 'Africa/Lagos',
    location_type: 'ONLINE',
  };
}

test('builds one row per student with chronological session columns and distinct attendance totals', () => {
  const sessions = [session('second', 'class', 22), session('first', 'class', 21)];
  const enrollments: Enrollment[] = [
    { student_uuid: 'student-a', scheduled_instance_uuid: 'first', status: 'ATTENDED' },
    { student_uuid: 'student-a', scheduled_instance_uuid: 'second', status: 'ABSENT' },
    {
      student_uuid: 'student-b',
      scheduled_instance_uuid: 'first',
      status: 'ENROLLED',
      did_attend: false,
    },
  ];
  const matrix = buildClassAttendance('class', sessions, enrollments);
  assert.deepEqual(
    matrix.sessions.map(item => item.uuid),
    ['first', 'second']
  );
  assert.deepEqual(matrix.studentIds, ['student-a', 'student-b']);
  assert.deepEqual(matrix.totals, { present: 1, absent: 1, unmarked: 1 });
  assert.equal(matrix.marks.get('student-b')?.get('first'), 'UNMARKED');
  assert.equal(matrix.marks.get('student-b')?.get('second'), undefined);
});

test('uses the newest saved record once when the API returns duplicate enrollments', () => {
  const enrollment: Enrollment = { student_uuid: 'student', scheduled_instance_uuid: 'session' };
  const matrix = buildClassAttendance(
    'class',
    [session('session', 'class', 21)],
    [
      { ...enrollment, status: 'ABSENT', updated_date: new Date('2026-10-21T08:00:00Z') },
      { ...enrollment, status: 'ATTENDED', updated_date: new Date('2026-10-21T09:00:00Z') },
      { ...enrollment, status: 'ENROLLED', updated_date: new Date('2026-10-21T07:00:00Z') },
    ]
  );
  assert.deepEqual(matrix.totals, { present: 1, absent: 0, unmarked: 0 });
  assert.equal(matrix.marks.get('student')?.get('session'), 'PRESENT');
});

test('excludes other classes, cancelled sessions, cancelled enrollments and waiting list entries', () => {
  const matrix = buildClassAttendance(
    'class',
    [
      session('valid', 'class', 21),
      session('foreign', 'other-class', 22),
      { ...session('cancelled', 'class', 23), status: 'CANCELLED' },
    ],
    [
      { student_uuid: 'valid-student', scheduled_instance_uuid: 'valid', status: 'ATTENDED' },
      { student_uuid: 'foreign-student', scheduled_instance_uuid: 'foreign', status: 'ATTENDED' },
      {
        student_uuid: 'cancelled-session-student',
        scheduled_instance_uuid: 'cancelled',
        status: 'ABSENT',
      },
      { student_uuid: 'cancelled-student', scheduled_instance_uuid: 'valid', status: 'CANCELLED' },
      { student_uuid: 'waiting-student', scheduled_instance_uuid: 'valid', status: 'WAITLISTED' },
    ]
  );
  assert.deepEqual(matrix.studentIds, ['valid-student']);
  assert.deepEqual(
    matrix.sessions.map(item => item.uuid),
    ['valid']
  );
  assert.deepEqual(matrix.totals, { present: 1, absent: 0, unmarked: 0 });
});

test('recognizes recorded attendance flags and keeps an empty class empty', () => {
  const matrix = buildClassAttendance(
    'class',
    [session('session', 'class', 21)],
    [
      { student_uuid: 'present', scheduled_instance_uuid: 'session', did_attend: true },
      {
        student_uuid: 'absent',
        scheduled_instance_uuid: 'session',
        did_attend: false,
        is_attendance_marked: true,
      },
    ]
  );
  assert.deepEqual(matrix.totals, { present: 1, absent: 1, unmarked: 0 });
  assert.deepEqual(buildClassAttendance('class', [], []).totals, {
    present: 0,
    absent: 0,
    unmarked: 0,
  });
});
