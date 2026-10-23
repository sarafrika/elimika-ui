import { expect, test } from '@playwright/test';
import {
  CLASS_ID,
  COURSE_ENROLMENT_ID,
  INSTRUCTOR,
  LESSON_ID,
  mockInstructorWorkbook,
  mockLessonScoring,
} from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const ASSIGNMENT_ID = '00000000-0000-4000-8000-000000000901';
const QUIZ_ID = '00000000-0000-4000-8000-000000000902';
const SUBMISSION_ID = '00000000-0000-4000-8000-000000000903';
const ATTEMPT_ID = '00000000-0000-4000-8000-000000000904';
const gradePath = new RegExp(
  `^/api/v1/assignments/${ASSIGNMENT_ID}/submissions/${SUBMISSION_ID}/grade$`
);
const assignmentUrl = `/dashboard/instructor/assignment/assignment_${ASSIGNMENT_ID}?classId=${CLASS_ID}`;
const quizUrl = `/dashboard/instructor/assignment/quiz_${QUIZ_ID}?classId=${CLASS_ID}`;

function mockTasks() {
  let graded = false;
  const submission = () => ({
    uuid: SUBMISSION_ID,
    assignment_uuid: ASSIGNMENT_ID,
    enrollment_uuid: COURSE_ENROLMENT_ID,
    status: graded ? 'GRADED' : 'SUBMITTED',
    submission_text: '<p>My assignment response</p>',
    submitted_at: '2026-10-22T08:00:00Z',
    max_score: 10,
    ...(graded ? { score: 0, instructor_comments: 'Please revise the technique.' } : {}),
  });
  const attempt = {
    uuid: ATTEMPT_ID,
    quiz_uuid: QUIZ_ID,
    enrollment_uuid: COURSE_ENROLMENT_ID,
    status: 'GRADED',
    attempt_number: 1,
    submitted_at: '2026-10-22T08:00:00Z',
    score: 6,
    max_score: 8,
  };
  const api = mockLessonScoring(mockInstructorWorkbook(new MockApi()))
    .get(new RegExp(`^/api/v1/assignments/${ASSIGNMENT_ID}$`), {
      uuid: ASSIGNMENT_ID,
      title: 'Rudiments assignment',
      lesson_uuid: LESSON_ID,
      max_points: 10,
    })
    .get(new RegExp(`^/api/v1/classes/${CLASS_ID}/assignments$`), [
      {
        uuid: 'assignment-schedule',
        assignment_uuid: ASSIGNMENT_ID,
        lesson_uuid: LESSON_ID,
      },
    ])
    .get(new RegExp(`^/api/v1/classes/${CLASS_ID}/quizzes$`), [
      {
        uuid: 'quiz-schedule',
        quiz_uuid: QUIZ_ID,
        lesson_uuid: LESSON_ID,
      },
    ])
    .get(new RegExp(`^/api/v1/quizzes/${QUIZ_ID}$`), {
      uuid: QUIZ_ID,
      title: 'Rudiments quiz',
      lesson_uuid: LESSON_ID,
    })
    .get(/^\/api\/v1\/assignments\/submissions\/search$/, () =>
      paged([
        submission(),
        // Over-broad API results must not let another enrollment's work into the review.
        { ...submission(), uuid: 'other-submission', enrollment_uuid: 'other-course-enrollment' },
      ])
    )
    .get(
      new RegExp(`^/api/v1/assignments/${ASSIGNMENT_ID}/submissions/${SUBMISSION_ID}/attachments$`),
      []
    )
    .on('POST', gradePath, () => {
      graded = true;
      return submission();
    })
    .get(/^\/api\/v1\/quizzes\/attempts\/search$/, paged([attempt]))
    .get(new RegExp(`^/api/v1/quizzes/${QUIZ_ID}/attempts/${ATTEMPT_ID}/review$`), {
      ...attempt,
      questions: [
        {
          uuid: 'written-question',
          question_type: 'SHORT_ANSWER',
          question_text: '<p>Name this rudiment</p>',
          points: 8,
          response: { text_response: 'Paradiddle', points_earned: 6 },
        },
      ],
    });
  return api;
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
});

test('assignment page uses managed grading, validates scores and saves against the course enrollment', async ({
  page,
}) => {
  const api = mockTasks();
  await api.install(page);
  await page.goto(assignmentUrl);
  await page
    .getByRole('button', { name: 'Review and grade Rudiments assignment for Amani Wekesa' })
    .click();
  const drawer = page.getByRole('dialog', { name: 'Amani Wekesa · Rudiments assignment' });
  await expect(drawer.getByText('My assignment response')).toBeVisible();
  const score = drawer.getByRole('spinbutton', { name: 'Score' });
  const save = drawer.getByRole('button', { name: 'Save grade' });
  await score.fill('11');
  await expect(save).toBeDisabled();
  await score.fill('0');
  await drawer.getByRole('textbox', { name: 'Feedback' }).fill('Please revise the technique.');
  await save.click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByText('0 / 10', { exact: true })).toBeVisible();
  expect(api.callsTo('POST', gradePath)).toHaveLength(1);
  const params = new URLSearchParams(api.callsTo('POST', gradePath)[0]?.search);
  expect(params.get('score')).toBe('0');
  expect(params.get('maxScore')).toBe('10');
  expect(params.get('comments')).toBe('Please revise the technique.');
  expect(api.calls.some(call => call.path.includes(`/quizzes/${ASSIGNMENT_ID}`))).toBe(false);
  expect(api.calls.some(call => call.path.includes('other-submission/attachments'))).toBe(false);
});

test('quiz page shows automatic results and written answers without grading controls', async ({
  page,
}) => {
  const api = mockTasks();
  await api.install(page);
  await page.goto(quizUrl);
  await expect(page.getByText('6 / 8', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'View results for Rudiments quiz for Amani Wekesa' })
    .click();
  const drawer = page.getByRole('dialog', { name: 'Amani Wekesa · Rudiments quiz' });
  await expect(drawer.getByText('Paradiddle', { exact: true })).toBeVisible();
  await expect(drawer.getByText('Auto-graded: 6 / 8')).toBeVisible();
  await expect(drawer.getByRole('spinbutton')).toHaveCount(0);
  await expect(drawer.getByRole('button', { name: 'Save grade' })).toHaveCount(0);
  expect(api.calls.filter(call => call.method === 'POST')).toHaveLength(0);
  expect(api.calls.some(call => call.path.includes(`/assignments/${QUIZ_ID}`))).toBe(false);
});

test('missing class context does not send placeholder task or enrollment requests', async ({
  page,
}) => {
  const api = mockTasks();
  await api.install(page);
  await page.goto('/dashboard/instructor/assignment/invalid');
  await expect(page.getByText('Select a task from your class assignments')).toBeVisible();
  expect(api.calls.some(call => /\{[^}]+\}|%7B/i.test(call.path))).toBe(false);
  expect(api.callsTo('GET', /\/submissions|\/attempts|\/enrollments/)).toHaveLength(0);
});
