import { expect, type Page, test } from '@playwright/test';
import {
  EVALUATION_PATH,
  GRADING_URL,
  INSTRUCTOR,
  mockInstructorWorkbook,
  mockLessonScoring,
  SCORE_CRITERIA,
} from '../fixtures/session-report';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

async function openDrawer(page: Page) {
  await page.goto(GRADING_URL);
  await page.getByRole('button', { name: 'Score this lesson for Amani Wekesa' }).click();
  return page.getByRole('dialog', { name: /Amani Wekesa · Lesson score/ });
}

async function pickAll(page: Page, level: number) {
  for (const criterion of SCORE_CRITERIA) {
    await page.getByRole('row', { name: new RegExp(criterion) }).getByRole('button', { name: new RegExp(`Level ${level}`) }).click();
  }
}

test.describe('Instructor · Lesson scoring drawer', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, INSTRUCTOR, baseURL as string);
  });

  test('the total and band update live as levels are picked, then submit', async ({ page }) => {
    const api = mockLessonScoring(mockInstructorWorkbook(new MockApi())).on('PUT', EVALUATION_PATH, request => ({
      ...request.postDataJSON(),
      score: 30,
      max_score: 30,
    }));
    await api.install(page);
    const drawer = await openDrawer(page);
    const live = drawer.getByTestId('live-score');

    await expect(live).toContainText('0/6 criteria scored');
    await drawer.getByRole('row', { name: /Posture/ }).getByRole('button', { name: /Level 5/ }).click();
    await expect(live).toContainText('/ 30 so far');
    await expect(live).toContainText('1/6 criteria scored');
    await expect(live).toContainText('Finish all criteria to see the band');

    await pickAll(page, 5);
    await expect(live).toContainText('30');
    await expect(live).toContainText('Distinction');
    await drawer.getByRole('button', { name: 'Submit score' }).click();

    await expect.poll(() => api.callsTo('PUT', EVALUATION_PATH).length).toBe(1);
    const body = api.callsTo('PUT', EVALUATION_PATH)[0]?.body as { status: string; criteria_selections: unknown[] };
    expect(body.status).toBe('completed');
    expect(body.criteria_selections).toHaveLength(6);
  });

  test('a score below the pass mark asks for confirmation before submitting', async ({ page }) => {
    const api = mockLessonScoring(mockInstructorWorkbook(new MockApi())).on('PUT', EVALUATION_PATH, request => request.postDataJSON());
    await api.install(page);
    const drawer = await openDrawer(page);

    await pickAll(page, 2);
    await expect(drawer.getByTestId('live-score')).toContainText('Below the course pass mark (18 / 30)');
    await drawer.getByRole('button', { name: 'Submit score' }).click();
    const confirm = drawer.getByRole('alert').filter({ hasText: 'Submit 12 / 30 (Fail)?' });
    await expect(confirm).toBeVisible();

    await confirm.getByRole('button', { name: 'Go back and check' }).click();
    await expect(confirm).toHaveCount(0);
    expect(api.callsTo('PUT', EVALUATION_PATH)).toHaveLength(0);

    await drawer.getByRole('button', { name: 'Submit score' }).click();
    await drawer.getByRole('button', { name: 'Yes, submit 12 / 30' }).click();
    await expect.poll(() => api.callsTo('PUT', EVALUATION_PATH).length).toBe(1);
  });

  test('save draft keeps an incomplete score as a draft', async ({ page }) => {
    const api = mockLessonScoring(mockInstructorWorkbook(new MockApi())).on('PUT', EVALUATION_PATH, request => request.postDataJSON());
    await api.install(page);
    const drawer = await openDrawer(page);

    await drawer.getByRole('row', { name: /Rhythm/ }).getByRole('button', { name: /Level 4/ }).click();
    await expect(drawer.getByRole('button', { name: 'Submit score' })).toBeDisabled();
    await drawer.getByRole('button', { name: 'Save draft' }).click();

    await expect.poll(() => api.callsTo('PUT', EVALUATION_PATH).length).toBe(1);
    expect((api.callsTo('PUT', EVALUATION_PATH)[0]?.body as { status: string }).status).toBe('pending');
  });
});
