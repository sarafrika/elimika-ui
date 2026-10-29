import assert from 'node:assert/strict';
import test from 'node:test';
import LegacyCreateCoursePage from '@/app/dashboard/course-creator/courses/create-course/page';
import LegacyCreateProgramPage from '@/app/dashboard/course-creator/courses/create-program/page';
import { markActiveMenuItem } from '../config/menu';

test('course and program editors select My Courses instead of Start a course', () => {
  for (const editor of ['create-course', 'create-program']) {
    const items = markActiveMenuItem(
      [
        { title: 'My Courses', url: '/dashboard/course-management' },
        { title: 'Start a course', url: '/dashboard/courses' },
      ],
      `/dashboard/course-management/${editor}`
    );
    assert.equal(items[0]?.isActive, true);
    assert.equal(items[1]?.isActive, false);
  }
});

test('old editor URLs redirect to My Courses and preserve edit parameters', async () => {
  for (const [editor, page] of [
    ['create-course', LegacyCreateCoursePage],
    ['create-program', LegacyCreateProgramPage],
  ] as const) {
    await assert.rejects(
      page({ searchParams: Promise.resolve({ id: 'existing-record', step: '3' }) }),
      error => {
        assert.ok(error instanceof Error && 'digest' in error);
        assert.equal(
          error.digest,
          `NEXT_REDIRECT;replace;/dashboard/course-creator/course-management/${editor}?id=existing-record&step=3;307;`
        );
        return true;
      }
    );
  }
});
