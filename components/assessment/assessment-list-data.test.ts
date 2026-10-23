import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AssignmentSubmission, QuizAttempt } from '@/services/client/types.gen';
import {
  type AssessmentClass,
  buildAssessmentRows,
  buildAssessmentResultRows,
} from './assessment-list-data';

const classMeta: AssessmentClass = {
  uuid: 'class-one',
  title: 'Piano beginners',
  courseUuid: 'course',
  courseTitle: 'Piano',
  instructorUuid: 'teacher',
  instructorName: 'Teacher',
  enrollmentUuids: ['my-course-enrollment'],
  learners: 2,
};
const baseline = {
  role: 'student' as const,
  classes: [classMeta],
  assignments: {
    assignment: {
      uuid: 'assignment',
      title: 'Practice scales',
      lesson_uuid: 'lesson',
      max_points: 20,
    },
  },
  quizzes: {},
  assignmentSchedules: [
    { uuid: 'schedule-a', assignment_uuid: 'assignment', class_definition_uuid: classMeta.uuid },
  ],
  quizSchedules: [{ uuid: 'schedule-q', quiz_uuid: 'quiz', class_definition_uuid: classMeta.uuid }],
  submissions: [] as AssignmentSubmission[],
  attempts: [] as QuizAttempt[],
  now: new Date('2026-10-23T12:00:00Z').getTime(),
};

test('includes issued assignments and quizzes without submissions or template details', () => {
  const rows = buildAssessmentRows(baseline);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]!.title, 'Practice scales');
  assert.equal(rows[1]!.kind, 'quiz');
  assert.equal(rows[1]!.href, '/dashboard/student/assignment/quiz/quiz');
  assert.ok(rows.every(row => row.status === 'pending' && row.percentage === null));
});

test('ignores other enrollments and uses the newest quiz retake, automatically graded', () => {
  const rows = buildAssessmentRows({
    ...baseline,
    attempts: [
      {
        quiz_uuid: 'quiz',
        enrollment_uuid: 'my-course-enrollment',
        status: 'GRADED',
        score: 2,
        max_score: 10,
        submitted_at: new Date('2026-10-20'),
      },
      {
        quiz_uuid: 'quiz',
        enrollment_uuid: 'other-enrollment',
        status: 'GRADED',
        score: 0,
        max_score: 10,
        submitted_at: new Date('2026-10-23'),
      },
      {
        quiz_uuid: 'quiz',
        enrollment_uuid: 'my-course-enrollment',
        status: 'SUBMITTED',
        score: 8,
        max_score: 10,
        submitted_at: new Date('2026-10-22'),
      },
    ],
  });
  assert.equal(rows[1]!.status, 'completed');
  assert.equal(rows[1]!.percentage, 80);
  assert.equal(rows[1]!.submittedCount, 1);
  assert.equal(rows[1]!.gradedCount, 1);
});

test('drafts are not submissions and submitted assignments await instructor grading', () => {
  const submission: AssignmentSubmission = {
    assignment_uuid: 'assignment',
    enrollment_uuid: 'my-course-enrollment',
    status: 'DRAFT',
  };
  assert.equal(
    buildAssessmentRows({ ...baseline, submissions: [submission] })[0]!.status,
    'in-progress'
  );
  assert.equal(
    buildAssessmentRows({ ...baseline, submissions: [{ ...submission, status: 'SUBMITTED' }] })[0]!
      .status,
    'awaiting-grading'
  );
  const graded = buildAssessmentRows({
    ...baseline,
    submissions: [{ ...submission, status: 'GRADED', score: 0, max_score: 20 }],
  })[0]!;
  assert.equal(graded.status, 'completed');
  assert.equal(graded.percentage, 0);
});

test('keeps schedules distinct across classes and prevents ambiguous shared-template totals', () => {
  const secondClass = { ...classMeta, uuid: 'class-two' };
  const rows = buildAssessmentRows({
    ...baseline,
    role: 'instructor',
    classes: [classMeta, secondClass],
    assignmentSchedules: [
      ...baseline.assignmentSchedules,
      { ...baseline.assignmentSchedules[0]!, class_definition_uuid: secondClass.uuid },
    ],
    submissions: [
      {
        assignment_uuid: 'assignment',
        enrollment_uuid: 'some-enrollment',
        status: 'GRADED',
        percentage: 95,
      },
    ],
  });
  const assignments = rows.filter(row => row.kind === 'assignment');
  assert.equal(assignments.length, 2);
  assert.notEqual(assignments[0]!.id, assignments[1]!.id);
  assert.ok(assignments.every(row => row.percentage === null && row.submittedCount === null));
  assert.equal(
    assignments[1]!.href,
    '/dashboard/instructor/assignment/assignment_assignment?classId=class-two'
  );
});

test('students cannot see future releases or schedules from unenrolled classes', () => {
  const data = {
    ...baseline,
    quizSchedules: [
      { ...baseline.quizSchedules[0]!, visible_at: new Date('2027-01-01') },
      { ...baseline.quizSchedules[0]!, uuid: 'unrelated', class_definition_uuid: 'unrelated' },
    ],
  };
  assert.equal(buildAssessmentRows(data).length, 1);
  assert.equal(
    buildAssessmentRows({ ...data, role: 'instructor' }).find(row => row.kind === 'quiz')?.status,
    'upcoming'
  );
});

test('results list individual student grades, not an assessment average, and keep zero scores', () => {
  const attempts: QuizAttempt[] = [
    {
      quiz_uuid: 'quiz',
      enrollment_uuid: 'my-course-enrollment',
      status: 'GRADED',
      score: 0,
      max_score: 10,
      submitted_at: new Date('2026-10-22'),
    },
    {
      quiz_uuid: 'quiz',
      enrollment_uuid: 'my-course-enrollment',
      status: 'GRADED',
      score: 9,
      max_score: 10,
      submitted_at: new Date('2026-10-21'),
    },
    {
      quiz_uuid: 'quiz',
      enrollment_uuid: 'another-enrollment',
      status: 'SUBMITTED',
      score: 8,
      max_score: 10,
      grade_display: 'Distinction',
      submitted_at: new Date('2026-10-22'),
    },
    { quiz_uuid: 'quiz', enrollment_uuid: 'draft-enrollment', status: 'IN_PROGRESS' },
  ];
  const data = { ...baseline, role: 'instructor' as const, attempts };
  const rows = buildAssessmentResultRows(buildAssessmentRows(data), [], attempts, 'instructor');
  assert.equal(rows.length, 2);
  assert.equal(rows.find(row => row.enrollmentUuid === 'my-course-enrollment')?.score, 0);
  assert.equal(rows.find(row => row.enrollmentUuid === 'my-course-enrollment')?.percentage, 0);
  assert.equal(rows.find(row => row.enrollmentUuid === 'another-enrollment')?.grade, 'Distinction');
  assert.ok(rows.every(row => row.status === 'completed'));
  assert.equal(
    rows.find(row => row.enrollmentUuid === 'another-enrollment')?.href,
    '/dashboard/instructor/assignment/quiz_quiz?classId=class-one&enrollment=another-enrollment'
  );
});

test('student result rows exclude other enrollments and show ungraded assignments as pending', () => {
  const submissions: AssignmentSubmission[] = [
    {
      assignment_uuid: 'assignment',
      enrollment_uuid: 'my-course-enrollment',
      status: 'SUBMITTED',
      score: 0,
      submitted_at: new Date('2026-10-22'),
    },
    {
      assignment_uuid: 'assignment',
      enrollment_uuid: 'another-enrollment',
      status: 'GRADED',
      score: 15,
      max_score: 20,
    },
  ];
  const data = { ...baseline, submissions };
  const rows = buildAssessmentResultRows(buildAssessmentRows(data), submissions, [], 'student');
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.enrollmentUuid, 'my-course-enrollment');
  assert.equal(rows[0]?.status, 'awaiting-grading');
  assert.equal(rows[0]?.score, null);
  assert.equal(rows[0]?.percentage, null);
});
