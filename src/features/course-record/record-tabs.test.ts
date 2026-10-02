import assert from 'node:assert/strict';
import { test } from 'node:test';

import { courseHeaderFacts, resolveCourseRecordTab, visibleCourseRecordTabs } from './record-tabs';

test('visibleCourseRecordTabs keeps the capability order and drops tabs without a panel', () => {
  assert.deepEqual(
    visibleCourseRecordTabs(['overview', 'curriculum', 'commercials', 'reviews'], {
      reviews: 'r',
      overview: 'o',
      commercials: null,
    }),
    ['overview', 'reviews']
  );
  assert.deepEqual(visibleCourseRecordTabs(['overview'], undefined), []);
});

test('resolveCourseRecordTab honours a tab the viewer has, else falls back to the first', () => {
  const tabs = ['overview', 'curriculum', 'reviews'] as const;
  assert.equal(resolveCourseRecordTab('curriculum', tabs), 'curriculum');
  assert.equal(resolveCourseRecordTab('commercials', tabs), 'overview');
  assert.equal(resolveCourseRecordTab(undefined, tabs), 'overview');
  assert.equal(resolveCourseRecordTab('overview', []), undefined);
});

test('courseHeaderFacts lists only the facts the response carried', () => {
  assert.deepEqual(courseHeaderFacts({}), []);
  assert.deepEqual(
    courseHeaderFacts({
      lessonCount: 1,
      contentItemCount: 68,
      contentCountNote: 'locked',
      level: 'Intermediate',
      enrolledCount: 1200,
      averageRating: 4.26,
      totalReviews: 1,
    }),
    [
      { key: 'lessons', value: '1', label: 'lesson' },
      { key: 'content', value: '68', label: 'content items (locked)' },
      { key: 'level', label: 'Intermediate' },
      { key: 'enrolled', value: '1,200', label: 'enrolled' },
      { key: 'rating', value: '4.3', label: '(1 review)' },
    ]
  );
});

test('courseHeaderFacts leaves out a rating with no reviews behind it', () => {
  assert.deepEqual(courseHeaderFacts({ averageRating: 0, totalReviews: 0 }), []);
});
