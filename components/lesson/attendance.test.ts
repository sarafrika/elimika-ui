import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Enrollment } from '@/services/client/types.gen';
import { enrollmentAttendanceStatus } from './attendance';

const enrollment: Enrollment = { scheduled_instance_uuid: 'session', student_uuid: 'student' };

test('retrieves persisted present and absent statuses even when derived flags are omitted', () => {
  assert.equal(enrollmentAttendanceStatus({ ...enrollment, status: 'ATTENDED' }), 'PRESENT');
  assert.equal(
    enrollmentAttendanceStatus({ ...enrollment, status: 'ATTENDED', is_attendance_marked: true }),
    'PRESENT'
  );
  assert.equal(enrollmentAttendanceStatus({ ...enrollment, status: 'ABSENT' }), 'ABSENT');
  assert.equal(
    enrollmentAttendanceStatus({ ...enrollment, status: 'ABSENT', did_attend: true }),
    'ABSENT'
  );
});

test('honors explicitly recorded attendance without treating missing flags as absence', () => {
  assert.equal(
    enrollmentAttendanceStatus({ ...enrollment, did_attend: true, is_attendance_marked: true }),
    'PRESENT'
  );
  assert.equal(
    enrollmentAttendanceStatus({ ...enrollment, did_attend: false, is_attendance_marked: true }),
    'ABSENT'
  );
  assert.equal(
    enrollmentAttendanceStatus({ ...enrollment, is_attendance_marked: true }),
    'UNMARKED'
  );
  assert.equal(enrollmentAttendanceStatus({ ...enrollment, status: 'ENROLLED' }), 'UNMARKED');
});
