import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Enrollment } from '@/services/client/types.gen';
import { hasStudentNoteChanges } from './student-notes';

const enrollment: Enrollment = {
  uuid: 'enrollment-a',
  student_uuid: 'student-a',
  scheduled_instance_uuid: 'session',
  status: 'ATTENDED',
  instrument_condition: 'GOOD',
  attendance_comment: '<p>Practised scales.</p>',
};

test('only selects students with changed notes for saving', () => {
  const enrollments = [enrollment, { ...enrollment, student_uuid: 'student-b' }];
  const drafts = {
    'student-a': { condition: 'NEEDS_REPAIR', comment: enrollment.attendance_comment },
    'student-b': { condition: 'GOOD', comment: enrollment.attendance_comment },
  };
  assert.deepEqual(
    enrollments
      .filter(row => hasStudentNoteChanges(row, drafts[row.student_uuid as keyof typeof drafts]))
      .map(row => row.student_uuid),
    ['student-a']
  );
});

test('unchanged, untouched and reverted notes do not need saving', () => {
  assert.equal(hasStudentNoteChanges(enrollment), false);
  assert.equal(hasStudentNoteChanges(enrollment, { condition: 'GOOD' }), false);
  assert.equal(
    hasStudentNoteChanges(enrollment, { comment: enrollment.attendance_comment }),
    false
  );
});

test('treats empty editor HTML as unchanged when the saved comment is blank', () => {
  assert.equal(
    hasStudentNoteChanges({ ...enrollment, attendance_comment: undefined }, { comment: '<p></p>' }),
    false
  );
  assert.equal(
    hasStudentNoteChanges({ ...enrollment, attendance_comment: '' }, { comment: '<p>&nbsp;</p>' }),
    false
  );
});

test('clearing an existing comment is a change', () => {
  assert.equal(hasStudentNoteChanges(enrollment, { comment: '<p></p>' }), true);
});

test('successfully saved notes no longer need saving while failed notes remain changed', () => {
  const draft = { condition: 'GOOD', comment: '<p>Updated comment.</p>' };
  assert.equal(hasStudentNoteChanges(enrollment, draft), true);
  assert.equal(
    hasStudentNoteChanges({ ...enrollment, attendance_comment: draft.comment }, draft),
    false
  );
});
