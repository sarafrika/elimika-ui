import { expect, test } from '@playwright/test';
import {
  COURSE_UUID,
  ENROLLMENT_UUID,
  MALICIOUS_COMMENT,
  mockShell,
  progressReport,
  STUDENT_USER,
  STUDENT_UUID,
} from '../fixtures/grades';
import { mockProgrammeReport, PROGRAM_UUID, programmeReport } from '../fixtures/programme';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

async function openMyGrades(
  page: import('@playwright/test').Page,
  comment?: string,
  withProgramme = false
) {
  const api = new MockApi();
  if (withProgramme) {
    const report = programmeReport();
    const [first, ...rest] = report.courses;
    mockProgrammeReport(
      api,
      programmeReport({ courses: [{ ...first, course_uuid: COURSE_UUID }, ...rest] })
    );
  }
  mockShell(api, STUDENT_USER, {
    path: /^\/api\/v1\/students\/search/,
    row: { uuid: STUDENT_UUID, user_uuid: STUDENT_USER.uuid, full_name: STUDENT_USER.name },
  });
  api.get(new RegExp(`^/api/v1/enrollment/student/${STUDENT_UUID}/overview`), {
    student_uuid: STUDENT_UUID,
    course_enrollments: paged([
      {
        enrollment_uuid: ENROLLMENT_UUID,
        course_uuid: COURSE_UUID,
        course_name: 'Introduction to Piano',
      },
    ]),
  });
  api.get(/\/gradebook\/enrollments\/[^/]+\/progress-report$/, progressReport(comment));
  await api.install(page);
  await page.goto('/dashboard/student/grades');
  return api;
}

test.describe('Student · My grades', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, STUDENT_USER, baseURL as string);
  });

  test('shows the average, final grade and label the instructor submitted', async ({ page }) => {
    await openMyGrades(page);
    const card = page.getByTestId('course-grades');
    await expect(card.getByRole('heading', { name: 'Introduction to Piano' })).toBeVisible();
    await expect(card.getByText('27.5 / 30')).toBeVisible();
    await expect(card.getByText('91.67%')).toBeVisible();
    await expect(card.getByText('Merit')).toBeVisible();
    await expect(card.getByText('6 of 7')).toBeVisible();
  });

  test('an ungraded lesson says it does not count yet', async ({ page }) => {
    await openMyGrades(page);
    await page.getByRole('button', { name: /Recital piece/ }).click();
    await expect(page.getByText('The instructor has not submitted this score yet.')).toBeVisible();
    await expect(
      page.getByText('Lessons not graded yet do not count towards the final grade.')
    ).toBeVisible();
  });

  test('expanding a graded lesson lists its criteria', async ({ page }) => {
    await openMyGrades(page);
    await page.getByRole('button', { name: /Playing with a metronome/ }).click();
    await expect(page.getByText(/Technique 4 · Tonal Quality 3/)).toBeVisible();
  });

  test('the instructor comment keeps its formatting', async ({ page }) => {
    await openMyGrades(page);
    const comment = page.getByTestId('instructor-comments');
    await expect(comment.locator('strong', { hasText: 'Good progress.' })).toBeVisible();
    await expect(comment.locator('li', { hasText: 'Left-hand finger speed' })).toBeVisible();
  });

  test('a malicious comment renders without running anything', async ({ page }) => {
    await openMyGrades(page, MALICIOUS_COMMENT);
    await expect(page.getByTestId('instructor-comments').getByText('Nice work')).toBeVisible();
    await expect(
      page.getByTestId('instructor-comments').locator('script, img[onerror]')
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss)
    ).toBeUndefined();
  });

  test('lists the program with its mark and links each course to the program it counts towards', async ({
    page,
  }) => {
    await openMyGrades(page, undefined, true);
    const programs = page.getByRole('region', { name: 'Programs' });
    const card = programs.getByTestId('student-program-card');
    await expect(card.getByRole('heading', { name: 'Foundation Music Certificate' })).toBeVisible();
    await expect(card).toContainText('5 mandatory courses · pass mark 50%');
    await expect(card).toContainText('In progress');
    await expect(card).toContainText('Program mark · Provisional');
    await expect(card).toContainText('75.76%');
    await expect(card).toContainText('3 of 5');
    await expect(card).toContainText('1 of 2');
    await expect(card).toContainText(
      '1 of 3 mandatory courses have a result · Drums & Rhythm, Performance & Ensemble are still running'
    );
    await expect(card.getByRole('link', { name: 'Open program report' })).toHaveAttribute(
      'href',
      `/dashboard/student/programs/${PROGRAM_UUID}?tab=assessment`
    );
    await expect(page.getByTestId('course-part-of')).toHaveText(
      'Counts towards Foundation Music Certificate · mandatory · 15%'
    );
  });

  test('without a program the page shows courses only', async ({ page }) => {
    await openMyGrades(page);
    await expect(page.getByTestId('course-grades')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Programs' })).toHaveCount(0);
    await expect(page.getByTestId('course-part-of')).toHaveCount(0);
  });
});
