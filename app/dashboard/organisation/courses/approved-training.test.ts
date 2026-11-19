import assert from 'node:assert/strict';
import test from 'node:test';
import type { CourseTrainingApplication, ProgramTrainingApplication } from '@/services/client';
import { createClassHref, postJobHref } from '@/src/features/organisation/class-builder/routes';
import {
  approvedTrainingDetailsHref,
  approvedTrainingItems,
  approvedTrainingPrefill,
} from './approved-training';

test('combines only this organisation’s approved courses and programmes', () => {
  const course: CourseTrainingApplication = {
    uuid: 'course-approval',
    course_uuid: 'same-id',
    applicant_uuid: 'org',
    applicant_type: 'organisation',
    status: 'approved',
  };
  const program: ProgramTrainingApplication = {
    uuid: 'program-approval',
    program_uuid: 'same-id',
    applicant_uuid: 'org',
    applicant_type: 'organisation',
    status: 'approved',
  };
  const items = approvedTrainingItems(
    'org',
    [
      course,
      course,
      { ...course, course_uuid: 'pending', status: 'pending' },
      { ...course, course_uuid: 'other-org', applicant_uuid: 'other' },
      { ...course, course_uuid: 'instructor', applicant_type: 'instructor' },
    ],
    [
      program,
      program,
      { ...program, program_uuid: 'revoked', status: 'revoked' },
      { ...program, program_uuid: 'rejected', status: 'rejected' },
      { ...program, program_uuid: undefined },
      { ...program, program_uuid: 'pending', status: 'pending' },
      { ...program, program_uuid: 'other-org', applicant_uuid: 'other' },
      { ...program, program_uuid: 'instructor', applicant_type: 'instructor' },
    ]
  );
  assert.deepEqual(
    items.map(({ kind, uuid }) => ({ kind, uuid })),
    [
      { kind: 'course', uuid: 'same-id' },
      { kind: 'program', uuid: 'same-id' },
    ]
  );
  assert.deepEqual(approvedTrainingItems('', [course], [program]), []);
});

test('details, create class and post job actions keep the selected training kind', () => {
  assert.equal(
    approvedTrainingDetailsHref('course', 'course-1'),
    '/dashboard/organisation/courses/course-1'
  );
  assert.equal(
    approvedTrainingDetailsHref('program', 'program-1'),
    '/dashboard/organisation/courses/available-programs/program-1'
  );
  for (const kind of ['course', 'program'] as const) {
    const prefill = approvedTrainingPrefill(kind, 'selected');
    const expected = kind === 'program' ? 'programUuid' : 'courseUuid';
    const other = kind === 'program' ? 'courseUuid' : 'programUuid';
    for (const href of [createClassHref(prefill), postJobHref(prefill)]) {
      const params = new URL(href, 'https://example.com').searchParams;
      assert.equal(params.get(expected), 'selected');
      assert.equal(params.has(other), false);
    }
  }
});
