import assert from 'node:assert/strict';
import test from 'node:test';
import { groupInviteStudents, invitationAudience } from './invitation-audience';

const students = groupInviteStudents([
  { student_uuid: 'one', email: ' ONE@example.com ', full_name: 'One', group_name: 'Group A' },
  { student_uuid: 'one', email: 'one@example.com', full_name: 'One', group_name: 'Group B' },
  { student_uuid: 'two', email: 'two@example.com', full_name: 'Two', group_name: 'Group B' },
  { student_uuid: 'three', full_name: 'Three', group_name: 'Group A' },
]);

test('overlapping group students appear once with all their group names', () => {
  assert.equal(students.length, 3);
  assert.deepEqual(students[0]?.groups, ['Group A', 'Group B']);
});

test('removed students stay excluded even when manually entered or in multiple groups', () => {
  const audience = invitationAudience(
    [
      { name: 'One again', email: 'ONE@example.com' },
      { name: 'Manual', email: 'manual@example.com' },
    ],
    students,
    ['one@example.com']
  );
  assert.deepEqual(
    audience.map(recipient => recipient.email),
    ['two@example.com', 'manual@example.com']
  );
});

test('counts unique mailable recipients and restores exclusions without changing groups', () => {
  const audience = invitationAudience([{ name: 'Two', email: 'two@example.com' }], students, []);
  assert.equal(audience.length, 2);
  assert.equal(invitationAudience([], students, ['one@example.com', 'two@example.com']).length, 0);
  assert.equal(invitationAudience([], students, []).length, 2);
  assert.equal(students.length, 3);
});
