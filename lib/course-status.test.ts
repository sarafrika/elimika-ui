import assert from 'node:assert/strict';
import { test } from 'node:test';
import { courseCreationSchema } from '@/app/dashboard/course-creator/_components/course-creation-types';

test('course status validation accepts API statuses and defaults to draft', () => {
  const status = courseCreationSchema.shape.status;
  assert.equal(status.parse(undefined), 'draft');
  for (const value of ['draft', 'in_review', 'published', 'archived']) {
    assert.equal(status.parse(value), value);
  }
  for (const value of ['skills', 'competencies', 'certifications']) {
    assert.equal(status.safeParse(value).success, false);
  }
});
