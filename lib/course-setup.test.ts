import assert from 'node:assert/strict';
import test from 'node:test';
import { getCreatedCourse } from './course-setup';
import { getErrorMessage } from './error-utils';

const validationResponse = {
  success: false,
  message: 'Validation failed',
  error: {
    course_code: 'Course code must be 2-30 letters, digits or hyphens',
  },
};

test('course save errors show field validation details in the toast message', () => {
  assert.equal(
    getErrorMessage(validationResponse, 'Could not create the course.'),
    validationResponse.error.course_code
  );
});

test('failed course creation responses retain validation details', () => {
  assert.throws(() => getCreatedCourse(validationResponse), {
    message: validationResponse.error.course_code,
  });
});

test('course save errors retain ordinary messages and use a fallback for empty errors', () => {
  assert.equal(getErrorMessage({ message: 'Access denied' }, 'Could not save.'), 'Access denied');
  assert.equal(getErrorMessage(undefined, 'Could not save.'), 'Could not save.');
});
