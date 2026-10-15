import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  courseRevenueShares,
  programCourseIds,
  programRevenueShares,
  type RevenueShareCourse,
} from './revenue-shares';

const courses: Record<string, RevenueShareCourse> = {
  first: {
    minimum_training_fee: 100,
    instructor_share_percentage: 80,
    creator_share_percentage: 20,
  },
  second: {
    minimum_training_fee: 300,
    instructor_share_percentage: 40,
    creator_share_percentage: 60,
  },
};

test('a course displays its saved split using the same calculation as program pricing', () => {
  assert.deepEqual(courseRevenueShares(courses.first!), {
    instructorShare: 80,
    creatorShare: 20,
    totalMinimumFee: 100,
  });
});

test('program shares are weighted by minimum training fees rather than averaged', () => {
  assert.deepEqual(programRevenueShares(['first', 'second'], courses), {
    instructorShare: 50,
    creatorShare: 50,
    totalMinimumFee: 400,
  });
});

test('all-free programs weight their courses equally', () => {
  assert.deepEqual(
    programRevenueShares(['first', 'second'], {
      first: { ...courses.first!, minimum_training_fee: 0 },
      second: { ...courses.second!, minimum_training_fee: null },
    }),
    { instructorShare: 60, creatorShare: 40, totalMinimumFee: 0 }
  );
});

test('free courses have zero weight in a program with paid courses', () => {
  assert.deepEqual(
    programRevenueShares(['first', 'second'], {
      ...courses,
      first: { ...courses.first!, minimum_training_fee: 0 },
    }),
    { instructorShare: 40, creatorShare: 60, totalMinimumFee: 300 }
  );
});

test('duplicate membership rows do not increase the course weight', () => {
  assert.deepEqual(
    programRevenueShares(['first', 'second', 'first'], courses),
    programRevenueShares(['first', 'second'], courses)
  );
});

test('missing or invalid course data makes the split unavailable', () => {
  assert.equal(programRevenueShares(['first', 'missing'], courses), undefined);
  for (const override of [
    { instructor_share_percentage: Number.NaN },
    { instructor_share_percentage: 101, creator_share_percentage: -1 },
    { creator_share_percentage: 30 },
    { minimum_training_fee: -10 },
  ]) {
    assert.equal(courseRevenueShares({ ...courses.first!, ...override }), undefined);
  }
});

test('displayed percentages round to two decimals and still add up to 100', () => {
  const split = programRevenueShares(['first', 'second'], {
    ...courses,
    second: { ...courses.second!, minimum_training_fee: 200 },
  });
  assert.equal(split?.instructorShare, 53.33);
  assert.equal(split?.creatorShare, 46.67);
  assert.equal((split?.instructorShare ?? 0) + (split?.creatorShare ?? 0), 100);
});

test('memberships are isolated per visible program, deduplicated, and sorted', () => {
  const memberships = programCourseIds(
    ['program-1', 'empty-program'],
    [
      { program_uuid: 'program-1', course_uuid: 'second' },
      { program_uuid: 'program-1', course_uuid: 'first' },
      { program_uuid: 'program-1', course_uuid: 'first' },
      { program_uuid: 'other-program', course_uuid: 'unrelated' },
    ]
  );
  assert.deepEqual(memberships.get('program-1'), ['first', 'second']);
  assert.deepEqual(memberships.get('empty-program'), []);
  assert.equal(memberships.has('other-program'), false);
});
