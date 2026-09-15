import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Enrollment } from '@/services/client/types.gen';
import { summarizeCourseEnrollments } from './overview-enrollments';

const enrollment = (
  student_uuid: string,
  status: Enrollment['status'] = 'ENROLLED',
  scheduled_instance_uuid = 'session-1'
): Enrollment => ({ student_uuid, status, scheduled_instance_uuid });

test('counts students from later classes when the first class of a course is empty', () => {
  const summary = summarizeCourseEnrollments([
    { course_uuid: 'course-1', enrollments: [] },
    { course_uuid: 'course-1', enrollments: [enrollment('student-1'), enrollment('student-2')] },
  ]);

  assert.equal(summary.studentsByCourse.get('course-1')?.size, 2);
  assert.equal(summary.totalStudents, 2);
});

test('counts each learner once per course across classes and scheduled sessions', () => {
  const summary = summarizeCourseEnrollments([
    {
      course_uuid: 'course-1',
      enrollments: [
        enrollment('student-1'),
        enrollment('student-1', 'ATTENDED', 'session-2'),
      ],
    },
    {
      course_uuid: 'course-1',
      enrollments: [enrollment('student-1'), enrollment('student-2', 'ABSENT')],
    },
    { course_uuid: 'course-2', enrollments: [enrollment('student-1')] },
  ]);

  assert.equal(summary.studentsByCourse.get('course-1')?.size, 2);
  assert.equal(summary.studentsByCourse.get('course-2')?.size, 1);
  assert.equal(summary.totalStudents, 2);
});

test('excludes waitlisted, cancelled, unidentified and unspecified-status enrollments', () => {
  const summary = summarizeCourseEnrollments([
    {
      course_uuid: 'course-1',
      enrollments: [
        enrollment('student-1'),
        enrollment('student-2', 'WAITLISTED'),
        enrollment('student-3', 'CANCELLED'),
        enrollment(''),
        { student_uuid: 'student-4', scheduled_instance_uuid: 'session-1' },
      ],
    },
  ]);

  assert.equal(summary.studentsByCourse.get('course-1')?.size, 1);
  assert.equal(summary.totalStudents, 1);
});

test('handles empty classes and keeps students without a course in the overall total', () => {
  assert.equal(summarizeCourseEnrollments([]).totalStudents, 0);

  const summary = summarizeCourseEnrollments([
    { course_uuid: 'empty-course', enrollments: [] },
    { enrollments: [enrollment('student-1')] },
  ]);

  assert.equal(summary.studentsByCourse.get('empty-course')?.size, 0);
  assert.equal(summary.studentsByCourse.size, 1);
  assert.equal(summary.totalStudents, 1);
});
