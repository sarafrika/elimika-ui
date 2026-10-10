import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeLegacyActionUrl } from './legacy-action-url';

test('role-less backend class links map onto each role’s live class route', () => {
  const url = '/dashboard/classes/c1';
  assert.equal(normalizeLegacyActionUrl(url, 'student'), '/dashboard/student/schedule/classes/c1');
  assert.equal(
    normalizeLegacyActionUrl(url, 'instructor'),
    '/dashboard/instructor/classes/class-training/c1'
  );
  assert.equal(
    normalizeLegacyActionUrl(url, 'organisation_user'),
    '/dashboard/organisation/classes?highlight=c1'
  );
  assert.equal(normalizeLegacyActionUrl(url, 'admin'), '/dashboard/admin/classes?class=c1');
});

test('schedule, assignment and transaction links resolve per role', () => {
  assert.equal(
    normalizeLegacyActionUrl('/dashboard/classes/schedule/i1', 'instructor'),
    '/dashboard/instructor/class-instance/i1'
  );
  assert.equal(
    normalizeLegacyActionUrl('/dashboard/classes/c1/assignments/a1', 'student'),
    '/dashboard/student/assignment/a1'
  );
  assert.equal(
    normalizeLegacyActionUrl('/dashboard/classes/c1/assignments/a1', 'instructor'),
    '/dashboard/instructor/assignment/assignment_a1?classId=c1'
  );
  assert.equal(
    normalizeLegacyActionUrl('/dashboard/transactions', 'student'),
    '/dashboard/student/wallet'
  );
});

test('current, external and unscoped urls pass through', () => {
  assert.equal(
    normalizeLegacyActionUrl('/dashboard/student/wallet', 'admin'),
    '/dashboard/student/wallet'
  );
  assert.equal(normalizeLegacyActionUrl('https://x.test/a', 'student'), 'https://x.test/a');
  assert.equal(normalizeLegacyActionUrl('/courses/c1', 'student'), '/courses/c1');
  assert.equal(normalizeLegacyActionUrl('/dashboard/classes/c1', null), '/dashboard/classes/c1');
  assert.equal(normalizeLegacyActionUrl(null, 'student'), '');
  assert.equal(
    normalizeLegacyActionUrl('/dashboard/courses?x=1', 'organisation'),
    '/dashboard/organisation/courses?x=1'
  );
});

test('live role-less dashboard routes are left alone', () => {
  const preview = '/dashboard/course-management/preview/c1?tab=applications';
  assert.equal(normalizeLegacyActionUrl(preview, 'instructor'), preview);
  assert.equal(normalizeLegacyActionUrl(preview, 'organisation'), preview);
  assert.equal(
    normalizeLegacyActionUrl('/dashboard/apply-to-train/x', 'admin'),
    '/dashboard/apply-to-train/x'
  );
  assert.equal(normalizeLegacyActionUrl('/dashboard/cart', 'student'), '/dashboard/cart');
});
