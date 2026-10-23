import { expect, test } from '@playwright/test';
import { INSTRUCTOR, INSTRUCTOR_PROFILE, mockInstructorWorkbook } from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const CLASS_IDS = ['00000000-0000-4000-8000-000000004001', '00000000-0000-4000-8000-000000004002'];
const COURSE_IDS = ['00000000-0000-4000-8000-000000005001', '00000000-0000-4000-8000-000000005002'];
const names = ['Ayhomi P2 Student', 'Ayhomi Ayho A', 'Ayo Student', 'Wilfred Mwangi Njuguna'];
const learners = Array.from({ length: 12 }, (_, index) => ({
  uuid: `00000000-0000-4000-8000-0000000060${String(index + 1).padStart(2, '0')}`,
  user_uuid: `00000000-0000-4000-8000-0000000070${String(index + 1).padStart(2, '0')}`,
  full_name: names[index] || `Student ${String(index + 1).padStart(2, '0')}`,
  created_date: '2026-09-11T12:00:00Z',
}));
const courses = COURSE_IDS.map((uuid, index) => ({
  uuid,
  name:
    index === 0
      ? 'Flower Gardening Masterclass'
      : 'Introduction to Artificial Intelligence and Machine Learning',
  difficulty_uuid: index === 0 ? 'beginner' : 'advanced',
  status: 'PUBLISHED',
}));

function mockRoster() {
  return mockInstructorWorkbook(new MockApi())
    .get(
      new RegExp(`^/api/v1/classes/instructor/${INSTRUCTOR_PROFILE}$`),
      CLASS_IDS.map((uuid, index) => ({
        class_definition: {
          uuid,
          title: index === 0 ? 'Gardening cohort' : 'AI cohort',
          course_uuid: COURSE_IDS[index],
          default_instructor_uuid: INSTRUCTOR_PROFILE,
          is_active: true,
        },
      }))
    )
    .get(/^\/api\/v1\/config\/difficulty-levels$/, [
      { uuid: 'beginner', name: 'Beginner', level_order: 1 },
      { uuid: 'advanced', name: 'Advanced', level_order: 2 },
    ])
    .get(/^\/api\/v1\/courses\/search$/, paged(courses))
    .get(/^\/api\/v1\/classes\/([^/]+)\/schedule$/, (_request, match) =>
      paged([
        {
          uuid: `${match[1]}-session`,
          class_definition_uuid: match[1],
          instructor_uuid: INSTRUCTOR_PROFILE,
          title: 'Class session',
          start_time: '2026-10-23T08:00:00Z',
          end_time: '2026-10-23T09:00:00Z',
          timezone: 'Africa/Lagos',
          status: 'SCHEDULED',
        },
      ])
    )
    .get(/^\/api\/v1\/classes\/([^/]+)\/enrollments$/, (_request, match) =>
      learners.slice(0, match[1] === CLASS_IDS[0] ? 12 : 6).map(student => ({
        uuid: `${match[1]}-${student.uuid}`,
        student_uuid: student.uuid,
        scheduled_instance_uuid: `${match[1]}-session`,
        status: 'ENROLLED',
      }))
    )
    .get(/^\/api\/v1\/students\/search$/, paged(learners))
    .get(/^\/api\/v1\/users\/([^/]+)$/, (_request, match) => {
      const student = learners.find(item => item.user_uuid === match[1]);
      return student
        ? {
            uuid: student.user_uuid,
            full_name: student.full_name,
            email: `${student.uuid}@e2e.test`,
          }
        : null;
    })
    .get(/^\/api\/v1\/enrollment\/student\/([^/]+)\/overview$/, (_request, match) => {
      const index = learners.findIndex(student => student.uuid === match[1]);
      return {
        student_uuid: match[1],
        course_enrollments: paged(
          courses.slice(0, index < 6 ? 2 : 1).map(course => ({
            course_uuid: course.uuid,
            course_name: course.name,
            enrollment_status: index >= 10 ? 'COMPLETED' : index >= 8 ? 'ON_HOLD' : 'ENROLLED',
            progress_percentage: index >= 10 ? 100 : 40,
            updated_date: '2026-10-22T08:00:00Z',
          }))
        ),
        class_enrollments: paged(
          CLASS_IDS.slice(0, index < 6 ? 2 : 1).map(id => ({
            class_definition_uuid: id,
            latest_enrollment_status: 'ENROLLED',
            latest_activity_date: '2026-10-22T08:00:00Z',
          }))
        ),
      };
    });
}

async function selectOption(page: import('@playwright/test').Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
});

test('redesigned roster keeps live summaries, filtering, pagination and student links', async ({
  page,
}, testInfo) => {
  await mockRoster().install(page);
  await page.goto('/dashboard/instructor/enrollments');
  const table = page.getByRole('table', { name: 'Enrolled students' });
  await expect(table.getByRole('row')).toHaveCount(13);
  const summary = page.getByLabel('Student enrollment summary');
  await expect(summary.locator('dt')).toHaveText([
    'Total students',
    'Currently enrolled',
    'Graduated',
  ]);
  await expect(summary.locator('dd')).toHaveText(['12', '8', '2']);
  await expect(table.getByRole('columnheader')).toHaveText([
    'Student',
    'Course / Class',
    'Status',
    'Progress',
    'Joined',
  ]);
  await expect(table.getByRole('link', { name: 'Ayhomi P2 Student', exact: true })).toHaveAttribute(
    'href',
    `/dashboard/instructor/students/${learners[0]?.user_uuid}?sId=${learners[0]?.uuid}`
  );
  await selectOption(page, 'Rows per page', '10');
  await expect(page.getByText('Showing 1 to 10 of 12 students')).toBeVisible();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Showing 11 to 12 of 12 students')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search students' }).fill('Ayhomi');
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await page.getByRole('searchbox', { name: 'Search students' }).clear();
  await selectOption(page, 'Filter by status', 'Graduated');
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(summary.locator('dd')).toHaveText(['12', '8', '2']);
  await selectOption(page, 'Filter by status', 'All status');
  await selectOption(page, 'Filter by class', 'AI cohort');
  await expect(table.getByRole('row')).toHaveCount(7);
  await selectOption(page, 'Filter by class', 'All classes');
  await selectOption(page, 'Filter by level', 'Advanced');
  await expect(table.getByRole('row')).toHaveCount(7);
  await selectOption(page, 'Filter by level', 'All levels');
  await page.getByRole('button', { name: /^Filters/ }).click();
  await selectOption(
    page,
    'Filter by course',
    'Introduction to Artificial Intelligence and Machine Learning'
  );
  await expect(table.getByRole('row')).toHaveCount(7);
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.keyboard.press('Escape');
  await expect(table.getByRole('row')).toHaveCount(11);
  await page.screenshot({
    path: testInfo.outputPath('student-enrollment-desktop.png'),
    fullPage: true,
  });
});

test('mobile roster scrolls all five columns and keeps empty results and dark theme readable', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockRoster().install(page);
  await page.goto('/dashboard/instructor/enrollments');
  const table = page.getByRole('table', { name: 'Enrolled students' });
  await expect(table.getByRole('row')).toHaveCount(13);
  await expect(table.getByRole('columnheader', { name: 'Joined' })).toHaveCount(1);
  expect(
    await table.evaluate(element =>
      Boolean(
        element.parentElement &&
          element.parentElement.scrollWidth > element.parentElement.clientWidth
      )
    )
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.getByRole('searchbox', { name: 'Search students' }).fill('No matching learner');
  await expect(page.getByText('No students found')).toBeVisible();
  await expect(page.getByText('Showing 0 to 0 of 0 students')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('searchbox', { name: 'Search students' }).fill('Ayhomi');
  await expect(table.getByRole('row')).toHaveCount(3);
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({
    path: testInfo.outputPath('student-enrollment-mobile-dark.png'),
    fullPage: true,
  });
});
