import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Lesson } from '@/services/client/types.gen';
import { planLessonOrder } from './lesson-order';

type SavedLesson = Lesson & { uuid: string };
const makeLesson = (number: number): SavedLesson => ({
  uuid: `lesson-${number}`,
  course_uuid: 'course',
  title: `Lesson ${number}`,
  status: 'DRAFT',
  lesson_number: number,
});
function verifyOrder(lessons: SavedLesson[]) {
  const current = new Map(lessons.map(lesson => [lesson.uuid, lesson.lesson_number]));
  for (const change of planLessonOrder(lessons)) {
    assert.ok(
      ![...current].some(([uuid, number]) => uuid !== change.uuid && number === change.number),
      'Every update uses an unoccupied number'
    );
    current.set(change.uuid, change.number);
  }
  assert.deepEqual(
    lessons.map(lesson => current.get(lesson.uuid)),
    lessons.map((_, index) => index + 1)
  );
}
test('renumbers every permutation without violating unique lesson numbers', () => {
  function permutations(items: SavedLesson[]): SavedLesson[][] {
    if (!items.length) return [[]];
    return items.flatMap((item, index) =>
      permutations(items.filter((_, position) => index !== position)).map(rest => [item, ...rest])
    );
  }
  for (const lessons of permutations([1, 2, 3, 4].map(makeLesson))) verifyOrder(lessons);
});
test('compacts gaps after deletion and resumes after a partially completed move', () => {
  verifyOrder([1, 3, 4].map(makeLesson));
  verifyOrder([2, 5, 3].map(makeLesson));
  verifyOrder([8, 3, 10].map(makeLesson));
});
test('does not write unchanged lesson order', () => {
  assert.deepEqual(planLessonOrder([1, 2, 3].map(makeLesson)), []);
});
