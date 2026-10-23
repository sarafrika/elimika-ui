import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AssessmentResultRow, AssessmentRow } from './assessment-list-data';
import { buildAssessmentResultRows } from './assessment-list-data';
import { summarizeAssessmentCompetencies } from './assessment-competencies';

const assessment: AssessmentRow = {
  id: 'quiz-schedule',
  uuid: 'quiz',
  kind: 'quiz',
  title: 'Reading music',
  classMeta: {
    uuid: 'class',
    title: 'Piano beginners',
    courseUuid: 'course',
    courseTitle: 'Piano',
    instructorUuid: 'teacher',
    instructorName: 'Teacher',
    enrollmentUuids: [],
    learners: 4,
  },
  instructorUuid: 'teacher',
  instructorName: 'Teacher',
  dueAt: null,
  issuedAt: 0,
  status: 'completed',
  percentage: null,
  submittedCount: 4,
  gradedCount: 4,
  href: '/dashboard/instructor/assignment/quiz_quiz',
  passingPercentage: 75,
};

test('uses reported quiz outcomes, configured pass marks and pending states without guessing thresholds', () => {
  const results = buildAssessmentResultRows(
    [assessment],
    [],
    [
      { quiz_uuid: 'quiz', enrollment_uuid: 'passing', status: 'GRADED', score: 8, max_score: 10 },
      { quiz_uuid: 'quiz', enrollment_uuid: 'failing', status: 'GRADED', score: 0, max_score: 10 },
      {
        quiz_uuid: 'quiz',
        enrollment_uuid: 'reported',
        status: 'GRADED',
        is_passed: false,
        percentage: 100,
      },
      {
        quiz_uuid: 'quiz',
        enrollment_uuid: 'unconfirmed',
        status: 'SUBMITTED',
        submitted_at: new Date(),
      },
    ],
    'instructor'
  );
  assert.deepEqual(summarizeAssessmentCompetencies([assessment], results), [
    {
      competency: 'Reading music',
      assessed: 4,
      achieved: 1,
      developing: 1,
      notAchieved: 2,
    },
  ]);
  const withoutPassMark = buildAssessmentResultRows(
    [{ ...assessment, passingPercentage: undefined }],
    [],
    [{ quiz_uuid: 'quiz', enrollment_uuid: 'unknown', status: 'GRADED', percentage: 90 }],
    'instructor'
  );
  assert.equal(withoutPassMark[0]?.passed, null);
});

test('aggregates filtered assessments once per learner, keeps zero-result indicators and sorts by achieved', () => {
  const second = { ...assessment, id: 'second', uuid: 'second', title: 'Performance' };
  const empty = { ...assessment, id: 'empty', uuid: 'empty', title: 'No submissions' };
  const result = (
    task: AssessmentRow,
    learner: string,
    passed: boolean | null
  ): AssessmentResultRow => ({
    id: `${task.id}-${learner}`,
    assessment: task,
    enrollmentUuid: learner,
    submittedAt: null,
    score: null,
    maxScore: null,
    percentage: null,
    grade: null,
    passed,
    status: passed == null ? 'awaiting-grading' : 'completed',
    href: task.href,
  });
  const results = [
    result(assessment, 'a', true),
    result(assessment, 'a', true),
    result(assessment, 'b', false),
    result(second, 'a', true),
    result(second, 'b', true),
    result(second, 'c', null),
  ];
  const list = summarizeAssessmentCompetencies(
    [assessment, { ...assessment, id: 'repeat-schedule' }, second, empty],
    results
  );
  assert.deepEqual(
    list.map(row => [row.competency, row.assessed, row.achieved, row.developing, row.notAchieved]),
    [
      ['Performance', 3, 2, 1, 0],
      ['Reading music', 2, 1, 0, 1],
      ['No submissions', 0, 0, 0, 0],
    ]
  );
  assert.deepEqual(summarizeAssessmentCompetencies([second], results), [list[0]]);
});
