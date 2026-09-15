import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AssignmentSubmission, QuizAttempt } from '@/services/client/types.gen';
import { taskGradeLabel } from './grading';

const assignment: AssignmentSubmission = {
  assignment_uuid: 'assignment',
  enrollment_uuid: 'student-enrollment',
  status: 'SUBMITTED',
};
const quiz: QuizAttempt = {
  quiz_uuid: 'quiz',
  enrollment_uuid: 'student-enrollment',
  status: 'SUBMITTED',
};

test('shows missing and unfinished work as not submitted', () => {
  assert.equal(taskGradeLabel(undefined), 'Not submitted');
  assert.equal(taskGradeLabel({ ...assignment, status: 'DRAFT' }), 'Not submitted');
  assert.equal(taskGradeLabel({ ...assignment, status: 'RETURNED', score: 5 }), 'Not submitted');
  assert.equal(taskGradeLabel({ ...quiz, status: 'IN_PROGRESS', score: 0 }), 'Not submitted');
});

test('keeps submitted work ungraded even when a quiz has a partial automatic score', () => {
  assert.equal(taskGradeLabel(assignment), 'Not graded');
  assert.equal(taskGradeLabel({ ...assignment, status: 'IN_REVIEW' }), 'Not graded');
  assert.equal(taskGradeLabel({ ...quiz, score: 4, max_score: 10 }), 'Not graded');
});

test('displays saved grades including zero and uses the task maximum as a fallback', () => {
  assert.equal(
    taskGradeLabel({ ...assignment, status: 'GRADED', score: 0, max_score: 10 }),
    '0 / 10'
  );
  assert.equal(taskGradeLabel({ ...quiz, status: 'GRADED', score: 8 }, 10), '8 / 10');
  assert.equal(
    taskGradeLabel({ ...quiz, status: 'GRADED', score: 8, max_score: 20 }, 10),
    '8 / 20'
  );
});

test('does not invent a score or maximum when grade details are missing', () => {
  assert.equal(taskGradeLabel({ ...assignment, status: 'GRADED', grade_display: 'A' }), 'A');
  assert.equal(taskGradeLabel({ ...assignment, status: 'GRADED' }), 'Grade unavailable');
  assert.equal(taskGradeLabel({ ...quiz, status: 'GRADED', score: 8 }), '8');
});

test('displays a quiz grade when the API returns a lowercase graded status', () => {
  assert.equal(
    taskGradeLabel({
      ...quiz,
      status: 'graded',
      score: 6,
      max_score: 8,
      grade_display: '6.00 / 8.00 (75.00%)',
    }),
    '6 / 8'
  );
  assert.equal(taskGradeLabel({ ...assignment, status: 'graded', score: 0 }, 10), '0 / 10');
});

test('recognizes lowercase unfinished and submitted statuses', () => {
  assert.equal(taskGradeLabel({ ...assignment, status: 'draft' }), 'Not submitted');
  assert.equal(taskGradeLabel({ ...assignment, status: 'returned' }), 'Not submitted');
  assert.equal(taskGradeLabel({ ...quiz, status: 'in_progress' }), 'Not submitted');
  assert.equal(taskGradeLabel({ ...assignment, status: 'in_review' }), 'Not graded');
  assert.equal(taskGradeLabel({ ...quiz, status: 'submitted', score: 6 }), 'Not graded');
});
