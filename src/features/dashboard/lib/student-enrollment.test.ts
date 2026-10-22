import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { UserDomain } from '@/lib/types';
import {
  STUDENT_COURSES_PATH,
  studentClassEnrollmentPath,
  studentCoursePath,
  studentEnrollmentHref,
  studentEnrollmentState,
  studentEnrollmentSwitchHref,
  studentProfileSetupHref,
} from './student-enrollment';

const parse = (href: string) => new URL(href, 'https://elimika.test');
const roles: UserDomain[] = [
  'instructor',
  'course_creator',
  'admin',
  'parent',
  'organisation',
  'organisation_user',
];

test('class action links preserve the selected course or programme and class', () => {
  const course = parse(studentClassEnrollmentPath({ uuid: 'class-1', course_uuid: 'course-1' }));
  assert.equal(course.pathname, '/dashboard/student/courses/available-classes/course-1/enroll');
  assert.equal(course.searchParams.get('id'), 'class-1');
  const program = parse(studentClassEnrollmentPath({ uuid: 'class-2', program_uuid: 'program-1' }));
  assert.equal(program.pathname, '/dashboard/student/courses/available-programs/program-1/enroll');
  assert.equal(program.searchParams.get('id'), 'class-2');
  assert.equal(studentClassEnrollmentPath({ course_uuid: 'course-1' }), STUDENT_COURSES_PATH);
});

test('creating a profile after Search Instructor resumes the selected instructor search', () => {
  const setup = parse(
    studentProfileSetupHref('/dashboard/instructor/courses/instructor?programId=program-1')
  );
  assert.equal(
    setup.searchParams.get('next'),
    '/dashboard/student/courses/instructor?programId=program-1'
  );
});

test('student actions switch every non-student role that has a student profile', () => {
  for (const role of roles) {
    assert.equal(
      studentEnrollmentState({
        isLoading: false,
        accountUuid: 'account-1',
        studentUuid: 'student-1',
        domains: [role, 'student'],
        activeDomain: role,
      }),
      'switch-profile'
    );
    assert.equal(
      studentCoursePath(
        `/dashboard/${role === 'course_creator' ? 'course-creator' : role === 'organisation_user' ? 'organisation' : role}/courses`
      ),
      STUDENT_COURSES_PATH
    );
  }
});

test('accounts without a student profile are prompted to create one', () => {
  for (const role of roles) {
    assert.equal(
      studentEnrollmentState({
        isLoading: false,
        accountUuid: 'account-1',
        domains: [role],
        activeDomain: role,
      }),
      'create-profile'
    );
  }
});

test('an existing student continues without another role switch', () => {
  assert.equal(
    studentEnrollmentState({
      isLoading: false,
      accountUuid: 'account-1',
      studentUuid: 'student-1',
      domains: ['instructor', 'student'],
      activeDomain: 'student',
    }),
    'ready'
  );
});

test('loading or failed account reads do not trigger duplicate profile creation', () => {
  assert.equal(
    studentEnrollmentState({
      isLoading: true,
      domains: [],
      activeDomain: 'instructor',
    }),
    'loading'
  );
  assert.equal(
    studentEnrollmentState({
      isLoading: false,
      domains: [],
      activeDomain: 'instructor',
    }),
    'unavailable'
  );
  assert.equal(
    studentEnrollmentState({
      isLoading: false,
      accountUuid: 'account-1',
      domains: ['student', 'instructor'],
      activeDomain: 'instructor',
    }),
    'unavailable'
  );
});

test('profile switching retains a selected course and the exact class to enroll in', () => {
  const source = '/dashboard/instructor/courses/available-classes/course-1/enroll?id=class-1';
  const target = '/dashboard/student/courses/available-classes/course-1/enroll?id=class-1';
  assert.equal(studentCoursePath(source), target);
  const switchUrl = parse(studentEnrollmentSwitchHref(source));
  assert.equal(switchUrl.pathname, '/dashboard/switch/student');
  assert.equal(switchUrl.searchParams.get('next'), target);
});

test('profile setup and switching preserve the same programme enrollment destination', () => {
  const source = '/dashboard/course-creator/courses/available-programs/program-1/enroll?id=class-2';
  const expected = '/dashboard/student/courses/available-programs/program-1/enroll?id=class-2';
  const entry = parse(studentEnrollmentHref(source));
  assert.equal(entry.pathname, '/dashboard/start-course');
  assert.equal(entry.searchParams.get('next'), expected);
  const setup = parse(studentProfileSetupHref(source));
  assert.equal(setup.pathname, '/dashboard/add-profile/student');
  assert.equal(setup.searchParams.get('next'), expected);
  const resume = parse(studentEnrollmentSwitchHref(setup.searchParams.get('next') ?? ''));
  assert.equal(resume.searchParams.get('next'), expected);
});

test('catalogue search filters survive entering the student profile', () => {
  const target = studentCoursePath(
    '/dashboard/instructor/courses?q=art%20%26%20design&tab=programs'
  );
  const url = parse(target);
  assert.equal(url.pathname, STUDENT_COURSES_PATH);
  assert.equal(url.searchParams.get('q'), 'art & design');
  assert.equal(url.searchParams.get('tab'), 'programs');
});

test('invalid and unrelated return links fall back to the student course catalogue', () => {
  for (const target of [
    undefined,
    '',
    'https://example.com',
    '//example.com/courses',
    '/dashboard/instructor/wallet',
    '/dashboard/courses/../../wallet',
    '/dashboard/student/courses/%2e%2e/wallet',
    '/dashboard/courses-other',
    '/dashboard/switch/admin?next=/dashboard/admin/overview',
    `/${String.fromCharCode(92)}example.com/courses`,
  ]) {
    assert.equal(studentCoursePath(target), STUDENT_COURSES_PATH);
  }
});
