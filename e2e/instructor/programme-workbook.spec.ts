import { expect, test } from '@playwright/test';
import {
  CLASS_ID,
  COURSE_ID,
  INSTRUCTOR,
  LESSON_ID,
  mockInstructorWorkbook,
} from '../fixtures/session-report';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

const PROGRAM_ID = '77777777-7777-4777-8777-777777777777';
const NEXT_COURSE = '88888888-8888-4888-8888-888888888888';
const NEXT_LESSON = '99999999-9999-4999-8999-999999999999';
const outline = [
  {
    uuid: LESSON_ID,
    course_uuid: COURSE_ID,
    lesson_number: 1,
    title: 'Keeping time',
    status: 'PUBLISHED',
    active: true,
  },
  {
    uuid: NEXT_LESSON,
    course_uuid: NEXT_COURSE,
    lesson_number: 1,
    title: 'Reading notes',
    status: 'PUBLISHED',
    active: true,
  },
];

test.beforeEach(async ({ page, context, baseURL }) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  const api = mockInstructorWorkbook(new MockApi())
    .get(new RegExp(`^/api/v1/classes/${CLASS_ID}$`), {
      class_definition: { uuid: CLASS_ID, title: 'Music foundation', program_uuid: PROGRAM_ID },
    })
    .get(new RegExp(`^/api/v1/programs/${PROGRAM_ID}/courses$`), [
      { uuid: COURSE_ID, name: 'Rhythm fundamentals' },
      { uuid: NEXT_COURSE, name: 'Music theory' },
    ])
    .get(/^\/api\/v1\/courses\/lessons$/, outline)
    .get(/^\/api\/v1\/content-types$/, { content: [] })
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}/content$`), {
      access: 'instructor',
      full_access: true,
      lessons: [
        {
          uuid: LESSON_ID,
          contents: [
            {
              uuid: 'reading-1',
              lesson_uuid: LESSON_ID,
              content_type_uuid: 'text',
              title: 'First reading',
              content_text: 'First page',
              display_order: 1,
            },
            {
              uuid: 'reading-2',
              lesson_uuid: LESSON_ID,
              content_type_uuid: 'text',
              title: 'Final reading',
              content_text: 'Last page',
              display_order: 2,
            },
          ],
        },
      ],
    })
    .get(new RegExp(`^/api/v1/courses/${NEXT_COURSE}/content$`), {
      access: 'instructor',
      full_access: true,
      lessons: [{ uuid: NEXT_LESSON, contents: [] }],
    });
  await api.install(page);
});

test('All lessons groups the entire program by course and opens the correct lesson', async ({
  page,
}) => {
  await page.goto(`/dashboard/instructor/classes/training/${CLASS_ID}?view=lessons`);
  const rhythm = page.getByRole('region', { name: 'Rhythm fundamentals', exact: true });
  const theory = page.getByRole('region', { name: 'Music theory', exact: true });
  await expect(rhythm.getByRole('button', { name: 'Lesson 1: Keeping time' })).toBeVisible();
  await expect(theory.getByRole('button', { name: 'Lesson 1: Reading notes' })).toBeVisible();
  await theory.getByRole('button', { name: 'Lesson 1: Reading notes' }).click();
  await expect(page).toHaveURL(new RegExp(`course=${NEXT_COURSE}`));
  await expect(
    page.getByRole('heading', { name: 'Lesson 1: Reading notes', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'All lessons', exact: true }).first().click();
  await expect(rhythm).toBeVisible();
  await expect(theory).toBeVisible();
});

test('the final content page offers the next course and starts its first lesson', async ({
  page,
}) => {
  await page.goto(
    `/dashboard/instructor/classes/training/${CLASS_ID}?course=${COURSE_ID}&lesson=${LESSON_ID}`
  );
  await expect(page.getByRole('heading', { name: 'First reading', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'All lessons', exact: true }).first().click();
  await expect(page.getByRole('region', { name: 'Music theory', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'First reading', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide lessons', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'First reading', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start next course/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Final reading', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start next course: Music theory', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`course=${NEXT_COURSE}`));
  await expect(page).toHaveURL(new RegExp(`lesson=${NEXT_LESSON}`));
  await expect(
    page.getByRole('heading', { name: 'Lesson 1: Reading notes', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Start next course/ })).toHaveCount(0);
});
