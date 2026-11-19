import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ClassDefinitionResponse } from '@/services/client';
import {
  belongsToClassShare,
  classSharePath,
  matchesClassShare,
  parseClassShareScope,
} from './class-share';

test('share links round-trip either owner without carrying the current page filters', () => {
  for (const kind of ['organisation', 'instructor'] as const) {
    const scope = { kind, uuid: 'owner-1' };
    const url = new URL(classSharePath(scope), 'https://example.com');
    assert.equal(url.pathname, '/class-invite');
    assert.deepEqual([...url.searchParams], [[kind, 'owner-1']]);
    assert.deepEqual(
      parseClassShareScope(key => url.searchParams.get(key)),
      scope
    );
  }
  assert.equal(
    parseClassShareScope(() => null),
    undefined
  );
});

test('shared list filters include inactive classes and apply search before pagination', () => {
  const row: ClassDefinitionResponse = {
    course_title: 'Introduction to painting',
    class_definition: {
      title: 'Evening class',
      organisation_uuid: 'org-1',
      default_instructor_uuid: 'trainer-1',
      course_uuid: 'course-1',
      class_visibility: 'PUBLIC',
      session_format: 'GROUP',
      location_type: 'ONLINE',
      default_start_time: new Date('2026-11-20T10:00:00Z'),
      default_end_time: new Date('2026-11-20T11:00:00Z'),
      is_active: false,
    },
  };
  for (const scope of [
    { kind: 'organisation', uuid: 'org-1' },
    { kind: 'instructor', uuid: 'trainer-1' },
  ] as const) {
    assert.equal(matchesClassShare(row, scope, {}, ''), true);
    assert.equal(matchesClassShare(row, scope, { location: 'ONLINE' }, 'PAINTING'), true);
    assert.equal(matchesClassShare(row, scope, { location: 'IN_PERSON' }, ''), false);
    assert.equal(matchesClassShare(row, scope, { course: 'other-course' }, ''), false);
    assert.equal(matchesClassShare(row, scope, {}, 'unrelated'), false);
    assert.equal(matchesClassShare(row, { ...scope, uuid: 'other-owner' }, {}, ''), false);
  }
});

test('rows from another owner are excluded even if a listing response contains them', () => {
  const row = { organisation_uuid: 'org-1', default_instructor_uuid: 'trainer-1' };
  assert.equal(belongsToClassShare(row, { kind: 'organisation', uuid: 'org-1' }), true);
  assert.equal(belongsToClassShare(row, { kind: 'organisation', uuid: 'org-2' }), false);
  assert.equal(belongsToClassShare(row, { kind: 'instructor', uuid: 'trainer-1' }), true);
  assert.equal(belongsToClassShare(row, { kind: 'instructor', uuid: 'trainer-2' }), false);
});
