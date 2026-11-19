import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GetCourseContentResponse, LessonContent } from '@/services/client/types.gen';
import { resolveWorkbookLessonContent } from './workbook-content';

const material: LessonContent = {
  uuid: 'material',
  lesson_uuid: 'lesson-b',
  title: 'Course B reading',
  content_type_uuid: 'text',
  content_text: 'Learning material',
};

for (const access of ['instructor', 'student'] as const) {
  test(`${access} reads the selected program lesson through course-level access`, () => {
    const response: GetCourseContentResponse = {
      success: true,
      data: {
        access,
        full_access: true,
        lessons: [
          { uuid: 'lesson-a', contents: [{ ...material, uuid: 'other-material' }] },
          { uuid: 'lesson-b', contents: [material] },
        ],
      },
    };
    const result = resolveWorkbookLessonContent(response, { success: false }, 'lesson-b');
    assert.equal(result.hasCourseContent, true);
    assert.equal(result.lessonFound, true);
    assert.deepEqual(result.contents, [material]);
  });
}

test('a missing lesson never substitutes materials from another lesson', () => {
  const result = resolveWorkbookLessonContent(
    { data: { full_access: true, lessons: [{ uuid: 'lesson-a', contents: [material] }] } },
    { data: [material] },
    'lesson-b'
  );
  assert.equal(result.lessonFound, false);
  assert.deepEqual(result.contents, []);
});

test('lesson-level access remains available when course-level access is unavailable', () => {
  const result = resolveWorkbookLessonContent(
    null,
    { success: true, data: [material] },
    'lesson-b'
  );
  assert.equal(result.hasCourseContent, false);
  assert.deepEqual(result.contents, [material]);
});

test('failed responses and public outlines never supply lesson bodies', () => {
  for (const response of [
    {
      success: false,
      data: { full_access: true, lessons: [{ uuid: 'lesson-b', contents: [material] }] },
    },
    { data: { access: 'prospect', full_access: false, lessons: [{ title: 'Outline' }] } },
  ] satisfies GetCourseContentResponse[]) {
    const result = resolveWorkbookLessonContent(
      response,
      { success: false, data: [material] },
      'lesson-b'
    );
    assert.equal(result.hasCourseContent, false);
    assert.deepEqual(result.contents, []);
  }
});

test('materials follow display order without modifying the cached response', () => {
  const materials = [
    { ...material, uuid: 'last', display_order: 2 },
    { ...material, uuid: 'first', display_order: 1 },
  ];
  const result = resolveWorkbookLessonContent(undefined, { data: materials }, 'lesson-b');
  assert.deepEqual(
    result.contents.map(item => item.uuid),
    ['first', 'last']
  );
  assert.deepEqual(
    materials.map(item => item.uuid),
    ['last', 'first']
  );
});
