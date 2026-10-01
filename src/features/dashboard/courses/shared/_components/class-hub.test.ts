import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  averageRating,
  CLASS_COURSE_TABS,
  CLASS_HUB_TAB_LABELS,
  CLASS_PROGRAM_TABS,
  reviewerNameMap,
  reviewerUuids,
  scheduleTotalDuration,
  scheduleWeekSpan,
  sessionDuration,
  toBlockReviews,
  toCurriculumLessons,
} from './class-hub';

test('every tab id has a label, and only the programme page has courses and requirements', () => {
  for (const id of [...CLASS_COURSE_TABS, ...CLASS_PROGRAM_TABS]) {
    assert.ok(CLASS_HUB_TAB_LABELS[id]);
  }
  assert.ok(!(CLASS_COURSE_TABS as readonly string[]).includes('courses'));
  assert.ok((CLASS_PROGRAM_TABS as readonly string[]).includes('courses'));
  assert.equal(CLASS_COURSE_TABS[0], 'overview');
  assert.equal(CLASS_PROGRAM_TABS[0], 'overview');
});

test('scheduleTotalDuration sums minutes and drops a zero minute part', () => {
  assert.equal(scheduleTotalDuration([]), '0h');
  assert.equal(scheduleTotalDuration(undefined), '0h');
  assert.equal(scheduleTotalDuration([{ duration_minutes: 90 }, { duration_minutes: '30' }]), '2h');
  assert.equal(
    scheduleTotalDuration([{ duration_minutes: 95 }, { duration_minutes: null }]),
    '1h 35m'
  );
});

test('scheduleWeekSpan counts calendar weeks between first and last session', () => {
  assert.equal(scheduleWeekSpan([]), 0);
  assert.equal(scheduleWeekSpan([{ start_time: '2026-01-05T09:00:00Z' }]), 1);
  assert.equal(
    scheduleWeekSpan([
      { start_time: '2026-01-19T09:00:00Z' },
      { start_time: '2026-01-05T09:00:00Z' },
      { start_time: 'not a date' },
    ]),
    3
  );
});

test('sessionDuration formats a range and refuses a missing or backwards one', () => {
  assert.equal(sessionDuration('2026-01-05T09:00:00Z', '2026-01-05T10:05:00Z'), '1h 5m');
  assert.equal(sessionDuration('2026-01-05T09:00:00Z', '2026-01-05T09:40:00Z'), '40m');
  assert.equal(sessionDuration('2026-01-05T10:00:00Z', '2026-01-05T09:00:00Z'), '-');
  assert.equal(sessionDuration(undefined, '2026-01-05T09:00:00Z'), '-');
});

test('toCurriculumLessons orders by lesson number and maps content kinds', () => {
  const lessons = toCurriculumLessons([
    {
      lesson: { title: 'Second', lesson_number: 2, learning_objectives: '<p>Wire a panel</p>' },
      content: {
        data: [
          { uuid: 'c1', title: 'Intro video', mime_type: 'video/mp4', is_required: true },
          { uuid: 'c2', title: 'Reading' },
        ],
      },
    },
    { lesson: { title: 'First', lesson_number: 1, description: 'Safety basics' } },
    { lesson: null },
  ]);

  assert.equal(lessons.length, 2);
  assert.deepEqual(
    lessons.map(lesson => lesson.title),
    ['First', 'Second']
  );
  assert.equal(lessons[0]?.objective, 'Safety basics');
  assert.equal(lessons[0]?.items, undefined);
  assert.equal(lessons[0]?.itemCount, undefined);
  assert.equal(lessons[1]?.objective, 'Wire a panel');
  assert.equal(lessons[1]?.itemCount, 2);
  assert.equal(lessons[1]?.items?.[0]?.kind, 'video');
  assert.equal(lessons[1]?.items?.[0]?.required, true);
  assert.equal(lessons[1]?.items?.[1]?.kind, 'document');
});

test('toBlockReviews fills the fields ReviewsTab needs', () => {
  const [review] = toBlockReviews([{ uuid: 'r1', headline: 'Great', student_uuid: null }]);
  assert.equal(review?.rating, 0);
  assert.equal(review?.student_uuid, '');
  assert.equal(review?.headline, 'Great');
  assert.deepEqual(toBlockReviews(undefined), []);
});

test('reviewer helpers skip anonymous reviews and unnamed students', () => {
  assert.deepEqual(
    reviewerUuids([
      { student_uuid: 's1' },
      { student_uuid: 's1' },
      { student_uuid: 's2', is_anonymous: true },
      { student_uuid: null },
    ]),
    ['s1']
  );
  assert.deepEqual(reviewerNameMap({ s1: { full_name: 'Amina' }, s2: { full_name: null } }), {
    s1: 'Amina',
  });
});

test('averageRating rounds to one decimal and is null with nothing rated', () => {
  assert.equal(averageRating([]), null);
  assert.equal(averageRating([{ rating: 4 }, { rating: 5 }, { rating: 5 }]), 4.7);
  assert.equal(averageRating([{ rating: 3 }, {}]), 3);
});
