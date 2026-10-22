import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isBelowClassAverage,
  reportAssignmentMarks,
  reportTaskMarkLabel,
  summarizeReportScores,
  summarizeStudentMarks,
  type ReportTaskMark,
} from './session-report-scores';

const assignment: ReportTaskMark = {
  id: 'assignment',
  kind: 'assignment',
  title: 'Practice',
  status: 'GRADED',
  score: 10,
  maxScore: 20,
};
const quiz: ReportTaskMark = {
  id: 'quiz',
  kind: 'quiz',
  title: 'Theory',
  status: 'graded',
  score: 5,
  maxScore: 10,
};

test('combines assignment and quiz points and their obtainable marks', () => {
  const result = summarizeStudentMarks([assignment, quiz]);
  assert.equal(result.score, 15);
  assert.equal(result.maxScore, 30);
  assert.equal(result.percentage, 50);
  assert.equal(result.graded, 2);
  assert.equal(result.complete, true);
});

test('retains graded zeros and distinguishes ungraded work from zero', () => {
  assert.equal(summarizeStudentMarks([{ ...quiz, score: 0 }]).score, 0);
  const ungraded = summarizeStudentMarks([{ ...quiz, status: 'SUBMITTED', score: 5 }]);
  assert.equal(ungraded.score, undefined);
  assert.equal(ungraded.maxScore, undefined);
  assert.equal(ungraded.complete, false);
});

test('skips pending work in both earned and possible points and includes available totals in KPIs', () => {
  const summary = summarizeReportScores([
    { key: 'complete', marks: [assignment, quiz] },
    { key: 'pending', marks: [assignment, { ...quiz, status: 'SUBMITTED' }] },
    {
      key: 'ungraded',
      marks: [
        { ...assignment, status: 'NONE' },
        { ...quiz, status: 'NONE' },
      ],
    },
  ]);
  assert.equal(summary.rows.get('pending')?.score, 10);
  assert.equal(summary.rows.get('pending')?.maxScore, 20);
  assert.equal(summary.rows.get('pending')?.percentage, 50);
  assert.equal(summary.average, 50);
  assert.equal(summary.scored, 2);
  assert.equal(summary.enrolled, 3);
  assert.equal(summary.rows.get('ungraded')?.score, undefined);
});

test('uses three assessed tasks when one of two quizzes has no score', () => {
  const result = summarizeStudentMarks([
    assignment,
    { ...assignment, id: 'assignment-2', score: 15 },
    quiz,
    { ...quiz, id: 'quiz-2', score: undefined },
  ]);
  assert.equal(result.score, 30);
  assert.equal(result.maxScore, 50);
  assert.equal(result.percentage, 60);
  assert.equal(result.graded, 3);
  assert.equal(result.complete, true);
});

test('a missing grade with no maximum does not prevent totals for available grades', () => {
  const summary = summarizeReportScores([
    { key: 'student', marks: [assignment, { ...quiz, score: undefined, maxScore: undefined }] },
  ]);
  assert.equal(summary.rows.get('student')?.score, 10);
  assert.equal(summary.maxScore, 20);
  assert.equal(summary.average, 10);
  assert.equal(summary.scored, 1);
});

test('calculates averages, extremes and below-average marks without highlighting ties', () => {
  const summary = summarizeReportScores([
    { key: 'low', marks: [{ ...assignment, score: 0 }] },
    { key: 'mid', marks: [assignment] },
    { key: 'high', marks: [{ ...assignment, score: 20 }] },
  ]);
  assert.equal(summary.average, 10);
  assert.equal(summary.averagePercentage, 50);
  assert.equal(summary.highest, 20);
  assert.equal(summary.lowest, 0);
  assert.equal(summary.maxScore, 20);
  assert.equal(isBelowClassAverage(summary.rows.get('low')!, summary), true);
  assert.equal(isBelowClassAverage(summary.rows.get('mid')!, summary), false);
  assert.equal(summary.bands.find(band => band.name === 'Below 50%')?.count, 1);
});

test('compares percentages when learners have different obtainable marks', () => {
  const summary = summarizeReportScores([
    { key: 'a', marks: [{ ...assignment, score: 10, maxScore: 20 }] },
    { key: 'b', marks: [{ ...assignment, score: 15, maxScore: 60 }] },
  ]);
  assert.equal(summary.maxScore, undefined);
  assert.equal(summary.average, 37.5);
  assert.equal(summary.highest, 50);
  assert.equal(summary.lowest, 25);
  assert.equal(isBelowClassAverage(summary.rows.get('b')!, summary), true);
});

test('uses inclusive course band thresholds and accounts for learners below the lowest band', () => {
  const summary = summarizeReportScores(
    [
      { key: 'merit', marks: [{ ...quiz, score: 8 }] },
      { key: 'pass', marks: [{ ...quiz, score: 5 }] },
      { key: 'below', marks: [{ ...quiz, score: 0 }] },
    ],
    [
      { name: 'Pass', min_percentage: 50 },
      { name: 'Merit', min_percentage: 80 },
    ]
  );
  assert.deepEqual(summary.bands, [
    { name: 'Merit', count: 1 },
    { name: 'Pass', count: 1 },
    { name: 'Below band', count: 1 },
  ]);
});

test('does not invent maxima or statistics for unknown, invalid or missing grades', () => {
  for (const maxScore of [undefined, 0, Number.NaN]) {
    assert.equal(summarizeStudentMarks([{ ...quiz, maxScore }]).complete, false);
  }
  const summary = summarizeReportScores([
    { key: 'pending', marks: [{ ...quiz, score: Number.NaN }] },
  ]);
  assert.equal(summary.average, undefined);
  assert.equal(summary.highest, undefined);
  assert.equal(summary.lowest, undefined);
  assert.equal(summary.scored, 0);
  assert.equal(summarizeReportScores([]).hasTasks, false);
});

test('reconstructs assignments for learners with missing submissions from the saved report', () => {
  const marks = reportAssignmentMarks({
    assignment_titles: ['Practice'],
    rows: [
      {
        student_uuid: 'a',
        assignments: [{ title: 'Practice', status: 'GRADED', score: 8, max_score: 10 }],
      },
      { student_uuid: 'b', assignments: [] },
    ],
  });
  assert.equal(marks[1]?.[0]?.title, 'Practice');
  assert.equal(marks[1]?.[0]?.maxScore, 10);
  assert.equal(summarizeStudentMarks(marks[1] ?? []).score, undefined);
});

test('keeps repeated assignment titles as separate tasks', () => {
  const marks = reportAssignmentMarks({
    rows: [
      {
        assignments: [
          { title: 'Practice', status: 'GRADED', score: 3, max_score: 5 },
          { title: 'Practice', status: 'GRADED', score: 4, max_score: 5 },
        ],
      },
    ],
  });
  assert.equal(marks[0]?.length, 2);
  assert.equal(summarizeStudentMarks(marks[0] ?? []).score, 7);
});

test('distinguishes pending submissions and missing grades while showing obtainable marks', () => {
  assert.equal(reportTaskMarkLabel({ ...quiz, score: 0 }), '0 / 10');
  assert.equal(reportTaskMarkLabel({ ...quiz, status: 'SUBMITTED' }), 'Not graded / 10');
  assert.equal(reportTaskMarkLabel({ ...quiz, status: 'NONE' }), 'Not submitted / 10');
  assert.equal(reportTaskMarkLabel({ ...quiz, score: undefined }), 'Grade unavailable / 10');
});

test('does not highlight equal fractional scores because of floating-point rounding', () => {
  const summary = summarizeReportScores(
    ['a', 'b', 'c'].map(key => ({
      key,
      marks: [{ ...quiz, score: 1, maxScore: 3 }],
    }))
  );
  for (const score of summary.rows.values())
    assert.equal(isBelowClassAverage(score, summary), false);
});
