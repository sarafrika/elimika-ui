import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hitDestination, PALETTE_TYPES, seeAllHref, toPaletteDomain } from './hit-href';

const hrefOf = (destination: ReturnType<typeof hitDestination>) =>
  destination?.kind === 'href' ? destination.href : null;

test('admin hits open the admin console', () => {
  assert.equal(
    hrefOf(hitDestination('admin', { type: 'courses', uuid: 'c1' })),
    '/dashboard/admin/courses/c1'
  );
  assert.equal(
    hrefOf(hitDestination('admin', { type: 'classes', uuid: 'k1' })),
    '/dashboard/admin/classes?class=k1'
  );
  assert.equal(
    hrefOf(hitDestination('admin', { type: 'marketplace_jobs', uuid: 'j1' })),
    '/dashboard/admin/marketplace/j1'
  );
});

test('instructor hits resolve the user before opening a person page', () => {
  const destination = hitDestination('admin', { type: 'instructors', uuid: 'i1' });
  assert.equal(destination?.kind, 'instructor-user');
  if (destination?.kind === 'instructor-user') {
    assert.equal(destination.build('u1'), '/dashboard/admin/people/u1?tab=teaching');
  }
  const student = hitDestination('student', { type: 'instructors', uuid: 'i1' });
  if (student?.kind === 'instructor-user') {
    assert.equal(student.build('u1'), '/profile-user/u1?domain=instructor');
  }
});

test('learners open jobs in the opportunities sheet', () => {
  assert.equal(
    hrefOf(hitDestination('student', { type: 'marketplace_jobs', uuid: 'j1' })),
    '/dashboard/student/opportunities?job=j1'
  );
  assert.equal(
    hrefOf(hitDestination('parent', { type: 'courses', uuid: 'c1' })),
    '/dashboard/parent/all-courses/c1'
  );
});

test('types without a destination are not searched', () => {
  assert.equal(PALETTE_TYPES.student.includes('people'), false);
  assert.equal(PALETTE_TYPES.parent.includes('classes'), false);
  assert.equal(hitDestination('student', { type: 'people', uuid: 'p1' }), null);
});

test('organisation dashboards map to one palette domain', () => {
  assert.equal(toPaletteDomain('organisation'), 'organisation_user');
  assert.equal(
    hrefOf(hitDestination('organisation_user', { type: 'classes', uuid: 'k1' })),
    '/dashboard/organisation/classes?highlight=k1'
  );
});

test('see all carries the term', () => {
  assert.equal(seeAllHref('admin', 'people', 'ann'), '/dashboard/admin/people?q=ann');
  assert.equal(
    seeAllHref('admin', 'instructors', 'ann'),
    '/dashboard/admin/people?role=instructor&q=ann'
  );
  assert.equal(seeAllHref('student', 'courses', 'java'), '/dashboard/student/courses?q=java');
  assert.equal(seeAllHref('student', 'classes', 'java'), null);
});
