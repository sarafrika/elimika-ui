import assert from 'node:assert/strict';
import test from 'node:test';
import type { UserNotification } from '@/services/notifications';
import { getNotificationUrlPath } from './dashboard-notifications';

const note = (type: string, action_url: string, metadata: Record<string, string> = {}) =>
  ({ type, action_url, metadata }) as unknown as UserNotification;

test('creator moderation notifications open the matching editor under My Courses', () => {
  for (const type of ['COURSE_CONTENT_APPROVED', 'COURSE_CONTENT_REJECTED']) {
    assert.equal(
      getNotificationUrlPath(note(type, '', { course_uuid: 'course-1' }), 'course_creator'),
      '/dashboard/course-creator/course-management/create-course?id=course-1'
    );
  }
  for (const type of ['PROGRAM_CONTENT_APPROVED', 'PROGRAM_CONTENT_REJECTED']) {
    assert.equal(
      getNotificationUrlPath(note(type, '', { program_uuid: 'program-1' }), 'course_creator'),
      '/dashboard/course-creator/course-management/create-program?id=program-1'
    );
  }
});

test('payment receipts fall through to the role’s normalised transactions page', () => {
  const receipt = note('ORDER_PAYMENT_RECEIPT', '/dashboard/transactions');
  assert.equal(getNotificationUrlPath(receipt, 'student'), '/dashboard/student/wallet');
  assert.equal(getNotificationUrlPath(receipt, 'organisation'), '/dashboard/organisation/wallet');
});

test('non-student class reminders use the normalised action url', () => {
  const reminder = note('UPCOMING_CLASS_REMINDER', '/dashboard/classes/c1', {
    class_definition_uuid: 'c1',
  });
  assert.equal(
    getNotificationUrlPath(reminder, 'instructor'),
    '/dashboard/instructor/classes/training/c1'
  );
  assert.equal(
    getNotificationUrlPath(reminder, 'organisation_user'),
    '/dashboard/organisation/classes?highlight=c1'
  );
});

test('instructor enrollment notifications open the new training workspace', () => {
  for (const type of [
    'INSTRUCTOR_CLASS_ENROLLMENT_MILESTONE',
    'INSTRUCTOR_CLASS_ENROLLMENT_NOTICE',
    'NEW_STUDENT_ENROLLMENT',
  ]) {
    assert.equal(
      getNotificationUrlPath(note(type, '', { class_definition_uuid: 'c1' }), 'instructor'),
      '/dashboard/instructor/classes/training/c1'
    );
  }
});
