import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateRubricGrade } from './rubric-grading';

const matrix = {
  criteria: [{ uuid: 'analysis' }, { uuid: 'presentation' }],
  scoring_levels: [
    { uuid: 'excellent', points: 4 },
    { uuid: 'good', points: 3 },
    { uuid: 'missing', points: 0 },
  ],
};

test('adds the selected levels as a plain sum out of the rubric maximum, as the workbook does', () => {
  const grade = calculateRubricGrade(matrix, { analysis: 'excellent', presentation: 'good' });
  assert.equal(grade.rawScore, 7);
  assert.equal(grade.totalScore, 7);
  assert.equal(grade.maxScore, 8);
  assert.equal(grade.percentage, 88);
  assert.equal(grade.allRowsGraded, true);
});

test('requires a valid selection for every criterion and ignores unrelated selections', () => {
  const grade = calculateRubricGrade(matrix, {
    analysis: 'excellent',
    presentation: 'unknown',
    other: 'excellent',
  });
  assert.equal(grade.gradedCriteria, 1);
  assert.equal(grade.allRowsGraded, false);
  assert.equal(grade.totalScore, 4);
});

test('zero-point selections count as graded and can produce a saved zero', () => {
  const grade = calculateRubricGrade(matrix, { analysis: 'missing', presentation: 'missing' });
  assert.equal(grade.totalScore, 0);
  assert.equal(grade.allRowsGraded, true);
});

test('half points add without rounding drift, like 27.5 out of 30', () => {
  const halves = {
    criteria: [{ uuid: 'a' }, { uuid: 'b' }],
    scoring_levels: [
      { uuid: 'five', points: 5 },
      { uuid: 'half', points: 4.5 },
    ],
  };
  assert.equal(calculateRubricGrade(halves, { a: 'half', b: 'half' }).totalScore, 9);
  assert.equal(calculateRubricGrade(halves, { a: 'five', b: 'half' }).totalScore, 9.5);
});

test('blocks saving for empty, unidentified, duplicate, or invalid rubric data', () => {
  const invalidMatrices = [
    { ...matrix, criteria: [] },
    { ...matrix, criteria: [{}] },
    { ...matrix, criteria: [{ uuid: 'same' }, { uuid: 'same' }] },
    { ...matrix, scoring_levels: [] },
    { ...matrix, scoring_levels: [{ points: 4 }] },
    {
      ...matrix,
      scoring_levels: [
        { uuid: 'same', points: 4 },
        { uuid: 'same', points: 2 },
      ],
    },
    { ...matrix, scoring_levels: [{ uuid: 'bad', points: Number.NaN }] },
    { ...matrix, scoring_levels: [{ uuid: 'bad', points: -1 }] },
    { ...matrix, scoring_levels: [{ uuid: 'zero', points: 0 }] },
  ];
  for (const invalidMatrix of invalidMatrices) {
    const grade = calculateRubricGrade(invalidMatrix, {});
    assert.equal(grade.isValid, false);
    assert.equal(grade.allRowsGraded, false);
  }
});
