import { expect, test } from '@playwright/test';
import { mockShell, STUDENT_USER, STUDENT_UUID, ENROLLMENT_UUID } from '../fixtures/grades';
import { INSTRUCTOR, INSTRUCTOR_PROFILE, mockInstructorWorkbook } from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const CLASS_A = '00000000-0000-4000-8000-000000008001';
const CLASS_B = '00000000-0000-4000-8000-000000008002';
const COURSE = '00000000-0000-4000-8000-000000008003';
const ASSIGNMENT_A = '00000000-0000-4000-8000-000000008004';
const ASSIGNMENT_B = '00000000-0000-4000-8000-000000008005';
const QUIZ_A = '00000000-0000-4000-8000-000000008006';
const QUIZ_B = '00000000-0000-4000-8000-000000008007';
const SECOND_STUDENT = '00000000-0000-4000-8000-000000008008';
const assignments = [
  {
    uuid: ASSIGNMENT_A,
    class_definition_uuid: CLASS_A,
    title: 'Practice scales',
    lesson_uuid: 'lesson',
    max_points: 20,
  },
  {
    uuid: ASSIGNMENT_B,
    class_definition_uuid: CLASS_B,
    title: 'Compose a melody',
    lesson_uuid: 'lesson',
    max_points: 10,
  },
];
const quizzes = [
  {
    uuid: QUIZ_A,
    class_definition_uuid: CLASS_A,
    title: 'Reading music',
    lesson_uuid: 'lesson',
    passing_score: 60,
  },
  {
    uuid: QUIZ_B,
    class_definition_uuid: CLASS_B,
    title: 'Intervals quiz',
    lesson_uuid: 'lesson',
    passing_score: 60,
  },
];
const courseOverview = (uuid: string, index: number) => ({
  class_definition_uuid: uuid,
  class_title: index === 0 ? 'Piano beginners' : 'Piano advanced',
  course_uuid: COURSE,
  course_name: 'Introduction to Piano',
  instructor_uuid: INSTRUCTOR_PROFILE,
  instructor_name: INSTRUCTOR.name,
  course_enrollment_uuid: ENROLLMENT_UUID,
});

function mockAssessments(role: 'student' | 'instructor') {
  const api = new MockApi();
  if (role === 'student') {
    mockShell(api, STUDENT_USER, {
      path: /^\/api\/v1\/students\/search$/,
      row: { uuid: STUDENT_UUID, user_uuid: STUDENT_USER.uuid, full_name: STUDENT_USER.name },
    });
  } else {
    mockInstructorWorkbook(api);
  }
  return api
    .get(/^\/api\/v1\/users\/directory$/, [
      {
        uuid: STUDENT_USER.uuid,
        full_name: STUDENT_USER.name,
        profile_image_url: 'profile_images/amani.svg',
      },
      {
        uuid: 'second-user',
        full_name: 'Brian Otieno',
        profile_image_url: 'profile_images/brian.svg',
      },
    ])
    .get(/^\/api\/v1\/enrollment\/student\/[^/]+\/course-overview$/, request => {
      const params = new URL(request.url()).searchParams;
      const page = Number(params.get('page') ?? 0);
      return {
        enrollments: {
          content: [courseOverview(page === 0 ? CLASS_A : CLASS_B, page)],
          metadata: { totalPages: 2, totalElements: 2 },
        },
      };
    })
    .get(
      new RegExp(`^/api/v1/classes/instructor/${INSTRUCTOR_PROFILE}$`),
      [CLASS_A, CLASS_B].map((uuid, index) => ({
        class_definition: {
          uuid,
          title: index === 0 ? 'Piano beginners' : 'Piano advanced',
          course_uuid: COURSE,
          default_instructor_uuid: INSTRUCTOR_PROFILE,
        },
      }))
    )
    .get(
      /^\/api\/v1\/classes\/batch$/,
      [CLASS_A, CLASS_B].map((uuid, index) => ({
        uuid,
        title: index === 0 ? 'Piano beginners' : 'Piano advanced',
        course_uuid: COURSE,
        course_title: 'Introduction to Piano',
        instructor: { uuid: INSTRUCTOR_PROFILE, display_name: INSTRUCTOR.name },
        enrolled_count: 1,
      }))
    )
    .get(/^\/api\/v1\/courses\/search$/, paged([{ uuid: COURSE, name: 'Introduction to Piano' }]))
    .get(/^\/api\/v1\/classes\/assessment-schedules$/, {
      assignment_schedules: assignments.map((item, index) => ({
        uuid: `assignment-schedule-${index}`,
        assignment_uuid: item.uuid,
        class_definition_uuid: item.class_definition_uuid,
        instructor_uuid: INSTRUCTOR_PROFILE,
      })),
      quiz_schedules: quizzes.map((item, index) => ({
        uuid: `quiz-schedule-${index}`,
        quiz_uuid: item.uuid,
        class_definition_uuid: item.class_definition_uuid,
        instructor_uuid: INSTRUCTOR_PROFILE,
      })),
    })
    .get(/^\/api\/v1\/assignments\/search$/, paged(assignments))
    .get(/^\/api\/v1\/quizzes\/search$/, paged(quizzes))
    .get(
      /^\/api\/v1\/students\/search$/,
      paged([
        { uuid: STUDENT_UUID, user_uuid: STUDENT_USER.uuid, full_name: STUDENT_USER.name },
        { uuid: SECOND_STUDENT, user_uuid: 'second-user', full_name: 'Brian Otieno' },
      ])
    )
    .get(new RegExp(`^/api/v1/courses/${COURSE}/enrollments$`), request => {
      const page = Number(new URL(request.url()).searchParams.get('page') ?? 0);
      return {
        content:
          page === 0
            ? [{ uuid: ENROLLMENT_UUID, course_uuid: COURSE, student_uuid: STUDENT_UUID }]
            : [{ uuid: 'someone-else', course_uuid: COURSE, student_uuid: SECOND_STUDENT }],
        metadata: { totalPages: 2 },
      };
    })
    .get(/^\/api\/v1\/assignments\/submissions\/search$/, request => {
      const page = Number(new URL(request.url()).searchParams.get('page') ?? 0);
      return {
        content:
          page === 0
            ? [
                {
                  uuid: 'other-work',
                  assignment_uuid: ASSIGNMENT_A,
                  enrollment_uuid: 'someone-else',
                  status: 'GRADED',
                  percentage: 100,
                },
              ]
            : [
                {
                  uuid: 'my-work',
                  assignment_uuid: ASSIGNMENT_B,
                  enrollment_uuid: ENROLLMENT_UUID,
                  status: 'SUBMITTED',
                  submitted_at: '2026-10-22T09:00:00Z',
                },
              ],
        metadata: { totalPages: 2, totalElements: 2 },
      };
    })
    .get(
      /^\/api\/v1\/quizzes\/attempts\/search$/,
      paged([
        {
          uuid: 'my-quiz',
          quiz_uuid: QUIZ_A,
          enrollment_uuid: ENROLLMENT_UUID,
          status: 'SUBMITTED',
          score: 0,
          max_score: 10,
          submitted_at: '2026-10-22T10:00:00Z',
        },
        {
          uuid: 'older-quiz',
          quiz_uuid: QUIZ_A,
          enrollment_uuid: ENROLLMENT_UUID,
          status: 'GRADED',
          score: 9,
          max_score: 10,
          submitted_at: '2026-10-21T10:00:00Z',
        },
        {
          uuid: 'second-student-quiz',
          quiz_uuid: QUIZ_A,
          enrollment_uuid: 'someone-else',
          status: 'GRADED',
          score: 8,
          max_score: 10,
          grade_display: 'Distinction',
          submitted_at: '2026-10-22T11:00:00Z',
        },
        {
          uuid: 'unfinished-quiz',
          quiz_uuid: QUIZ_B,
          enrollment_uuid: ENROLLMENT_UUID,
          status: 'IN_PROGRESS',
        },
      ])
    );
}

async function selectOption(page: import('@playwright/test').Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('student sees all issued quizzes and assignments, own results, filtering and links', async ({
  page,
  context,
  baseURL,
}) => {
  await signIn(context, STUDENT_USER, baseURL as string);
  const api = mockAssessments('student');
  await api.install(page);
  await page.goto('/dashboard/student/assessment');
  const table = page.getByRole('table', { name: 'Issued assessments' });
  await expect(table.getByRole('row')).toHaveCount(5);
  const assignment = table.getByRole('row').filter({ hasText: 'Practice scales' });
  await expect(assignment.getByText('Not started', { exact: true })).toBeVisible();
  await expect(assignment.getByRole('link', { name: 'Practice scales' })).toHaveAttribute(
    'href',
    `/dashboard/student/assignment/${ASSIGNMENT_A}`
  );
  const quiz = table.getByRole('row').filter({ hasText: 'Reading music' });
  await expect(quiz.getByText('Completed', { exact: true })).toBeVisible();
  await expect(quiz.getByText('0%', { exact: true })).toBeVisible();
  await expect(quiz.getByRole('link', { name: 'View result' })).toHaveAttribute(
    'href',
    `/dashboard/student/assignment/quiz/${QUIZ_A}`
  );
  await selectOption(page, 'Assessment Type', 'Quiz');
  await expect(table.getByRole('row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  const results = page.getByRole('table', { name: 'Student assessment results' });
  await expect(results.getByRole('row')).toHaveCount(3);
  await expect(results.getByText(STUDENT_USER.name, { exact: true })).toHaveCount(2);
  await expect(results.getByText('Brian Otieno', { exact: true })).toHaveCount(0);
  await expect(results.getByText('0 / 10', { exact: true })).toBeVisible();
  await expect(results.getByRole('columnheader', { name: 'Grade', exact: true })).toHaveCount(0);
  await expect(results.getByRole('columnheader', { name: 'Result', exact: true })).toBeVisible();
  const classCell = results
    .getByRole('row')
    .filter({ hasText: 'Reading music' })
    .getByRole('cell')
    .nth(2);
  await expect(classCell).toContainText('Piano beginners');
  await expect(classCell).toContainText('Introduction to Piano');
  await expect(results.getByRole('row').filter({ hasText: 'Compose a melody' })).toContainText(
    'Awaiting grading'
  );
  await page.getByRole('button', { name: 'All Assessments', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search assessments' }).fill('advanced');
  await expect(table.getByRole('row')).toHaveCount(3);
  const submissionCalls = api.callsTo('GET', /^\/api\/v1\/assignments\/submissions\/search$/);
  expect(submissionCalls).toHaveLength(2);
  expect(submissionCalls.every(call => call.search.includes(ENROLLMENT_UUID))).toBe(true);
  expect(api.callsTo('GET', /^\/api\/v1\/classes\/assessment-schedules$/)).toHaveLength(1);
  expect(api.calls.some(call => /\{[^}]+\}|%7B/i.test(call.path))).toBe(false);
});

test('instructor sees both task types across classes and class-scoped review links', async ({
  page,
  context,
  baseURL,
}) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  const api = mockAssessments('instructor');
  await api.install(page);
  await page.route('**/api/proxy/api/v1/files/profile_images/*.svg', route =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="18" fill="currentColor"/></svg>',
    })
  );
  await page.goto('/dashboard/instructor/training-hub?tab=assessment');
  const workspace = page.getByRole('region', { name: 'Assessments workspace' });
  const table = workspace.getByRole('table', { name: 'Issued assessments' });
  await expect(table.getByRole('row')).toHaveCount(5);
  await expect(table.getByRole('link', { name: 'Compose a melody' })).toHaveAttribute(
    'href',
    `/dashboard/instructor/assignment/assignment_${ASSIGNMENT_B}?classId=${CLASS_B}`
  );
  const quiz = table.getByRole('row').filter({ hasText: 'Reading music' });
  await expect(quiz.getByRole('link', { name: 'View results' })).toHaveAttribute(
    'href',
    `/dashboard/instructor/assignment/quiz_${QUIZ_A}?classId=${CLASS_A}`
  );
  await expect(quiz.getByText('Completed', { exact: true })).toBeVisible();
  expect(api.callsTo('GET', new RegExp(`^/api/v1/courses/${COURSE}/enrollments$`))).toHaveLength(0);
  await workspace.getByRole('button', { name: 'Results', exact: true }).click();
  const results = workspace.getByRole('table', { name: 'Student assessment results' });
  await expect(results.getByRole('row')).toHaveCount(5);
  const brianQuiz = results
    .getByRole('row')
    .filter({ hasText: 'Reading music' })
    .filter({ hasText: 'Brian Otieno' });
  await expect(brianQuiz).toContainText('8 / 10');
  await expect(brianQuiz).toContainText('Distinction');
  await expect(brianQuiz).toContainText('80%');
  await expect(brianQuiz.getByRole('img', { name: 'Brian Otieno avatar' })).toHaveAttribute(
    'src',
    '/api/proxy/api/v1/files/profile_images/brian.svg'
  );
  const amaniQuiz = results
    .getByRole('row')
    .filter({ hasText: 'Reading music' })
    .filter({ hasText: STUDENT_USER.name });
  await expect(amaniQuiz).toContainText('0 / 10');
  await expect(amaniQuiz).toContainText('0%');
  await expect(amaniQuiz.getByRole('link', { name: 'View result', exact: true })).toHaveAttribute(
    'href',
    `/dashboard/instructor/assignment/quiz_${QUIZ_A}?classId=${CLASS_A}&enrollment=${ENROLLMENT_UUID}`
  );
  await expect(results.getByText('Intervals quiz', { exact: true })).toHaveCount(0);
  expect(api.callsTo('GET', /^\/api\/v1\/users\/directory$/)).toHaveLength(1);
  await page.screenshot({ path: test.info().outputPath('results-desktop.png'), fullPage: true });
  await selectOption(page, 'Status', 'Awaiting grading');
  await expect(results.getByRole('row')).toHaveCount(2);
  await expect(results.getByText(STUDENT_USER.name, { exact: true })).toBeVisible();
  await workspace.getByRole('button', { name: 'Clear filters' }).click();
  const downloadPromise = page.waitForEvent('download');
  await workspace.getByRole('button', { name: 'Export page' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('assessment-results.csv');
  await workspace.getByRole('button', { name: 'All Assessments', exact: true }).click();
  await selectOption(page, 'Class', 'Piano advanced');
  await expect(table.getByRole('row')).toHaveCount(3);
  expect(api.calls.some(call => call.path.includes('course-overview'))).toBe(false);
  expect(api.callsTo('GET', new RegExp(`^/api/v1/courses/${COURSE}/enrollments$`))).toHaveLength(2);
  expect(api.callsTo('GET', /^\/api\/v1\/me\/profile\/competencies$/)).toHaveLength(0);
  await workspace.getByRole('button', { name: 'Competencies', exact: true }).click();
  const competencies = workspace.getByRole('region', { name: 'Competency records' });
  const attainment = competencies.getByRole('table', { name: 'Assessment competency attainment' });
  // Filters carry across subtabs; only advanced-class assessments are initially selected.
  await expect(attainment.getByRole('row')).toHaveCount(3);
  await competencies.getByRole('button', { name: 'Clear filters' }).click();
  await expect(attainment.getByRole('row')).toHaveCount(5);
  const reading = attainment.getByRole('row').filter({ hasText: 'Reading music' });
  await expect(reading.getByRole('cell').nth(1)).toHaveText('2');
  await expect(reading.getByRole('cell').nth(2)).toHaveText('1');
  await expect(reading.getByRole('cell').nth(3)).toHaveText('0');
  await expect(reading.getByRole('cell').nth(4)).toHaveText('1');
  await expect(reading).toContainText('50% achieved');
  const pending = attainment.getByRole('row').filter({ hasText: 'Compose a melody' });
  await expect(pending.getByRole('cell').nth(3)).toHaveText('1');
  await expect(
    competencies.getByText('How competencies are derived', { exact: true })
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('competencies-desktop.png'),
    fullPage: true,
  });
  expect(api.callsTo('GET', /^\/api\/v1\/me\/profile\/competencies$/)).toHaveLength(0);
  await competencies.getByRole('searchbox', { name: 'Search assessments' }).fill('not recorded');
  await expect(competencies.getByText('No competencies match', { exact: true })).toBeVisible();
});

test('mobile table scrolls within the page in dark mode and empty searches can reset', async ({
  page,
  context,
  baseURL,
}) => {
  await signIn(context, STUDENT_USER, baseURL as string);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await mockAssessments('student').install(page);
  await page.goto('/dashboard/student/assessment');
  await expect(page.getByRole('table', { name: 'Issued assessments' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.getByRole('searchbox', { name: 'Search assessments' }).fill('no matching assessment');
  await expect(page.getByText('No assessments match', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(
    page.getByRole('table', { name: 'Issued assessments' }).getByRole('row')
  ).toHaveCount(5);
  await page.screenshot({
    path: test.info().outputPath('assessments-mobile-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Student assessment results' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.screenshot({
    path: test.info().outputPath('results-mobile-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Competencies', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Assessment competency attainment' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.screenshot({
    path: test.info().outputPath('competencies-mobile-dark.png'),
    fullPage: true,
  });
});

test('failed schedule responses show a retry state instead of empty or misleading totals', async ({
  page,
  context,
  baseURL,
}) => {
  await signIn(context, STUDENT_USER, baseURL as string);
  const api = mockAssessments('student').get(/^\/api\/v1\/classes\/assessment-schedules$/, {
    success: false,
    error: 'Unavailable',
  });
  await api.install(page);
  await page.goto('/dashboard/student/assessment');
  await expect(page.getByText('Unable to load assessments', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByText('No assessments issued yet', { exact: true })).toHaveCount(0);
});
