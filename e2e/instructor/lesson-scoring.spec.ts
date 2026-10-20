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


/** WCAG contrast of a level label against its button, read as rendered (canvas resolves oklab). */
async function labelContrast(page: Page, button: ReturnType<Page['locator']>, part: 'points') {
  return button.evaluate((element, part) => {
    const rgba = (color: string) => {
      const ctx = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 255] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255] as const;
    };
    const backgroundOf = (node: Element | null): readonly [number, number, number] => {
      if (!node) return [255, 255, 255];
      const [r, g, b, a] = rgba(getComputedStyle(node).backgroundColor);
      const under = backgroundOf(node.parentElement);
      return [r * a + under[0] * (1 - a), g * a + under[1] * (1 - a), b * a + under[2] * (1 - a)];
    };
    const channel = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (r: number, g: number, b: number) =>
      0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    const label = element.querySelector(`[data-part="${part}"]`) ?? element;
    const text = rgba(getComputedStyle(label).color);
    const bg = backgroundOf(element);
    const mix = (i: 0 | 1 | 2) => text[i] * text[3] + bg[i] * (1 - text[3]);
    const fore = luminance(mix(0), mix(1), mix(2));
    const back = luminance(bg[0], bg[1], bg[2]);
    return (Math.max(fore, back) + 0.05) / (Math.min(fore, back) + 0.05);
  }, part);
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
  test('level labels stay readable when hovered, picked or not', async ({ page }) => {
    await mockLessonScoring(mockInstructorWorkbook(new MockApi())).install(page);
    const drawer = await openDrawer(page);
    const row = drawer.getByRole('row', { name: /Posture/ });
    const unpicked = row.getByRole('button', { name: /Level 4/ });
    const picked = row.getByRole('button', { name: /Level 5/ });
    await picked.click();

    for (const button of [unpicked, picked]) {
      for (const part of ['points'] as const) {
        await page.mouse.move(0, 0);
        expect(await labelContrast(page, button, part)).toBeGreaterThanOrEqual(4.5);
        await button.hover();
        await expect.poll(() => labelContrast(page, button, part)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('level descriptions sit once in the header and each cell shows only its points, centred', async ({ page }) => {
    await mockLessonScoring(mockInstructorWorkbook(new MockApi()), null, { described: true }).install(page);
    const drawer = await openDrawer(page);
    const header = drawer.getByRole('columnheader', { name: /Level 4/ });
    await expect(header.locator('[data-part="level-description"]')).toHaveText('Mostly accurate');
    await expect(drawer.getByText('Mostly accurate')).toHaveCount(1);

    const cell = drawer.getByRole('row', { name: /Posture/ }).getByRole('button', { name: /Level 4/ });
    await expect(cell).toHaveText(/^4\s*pts$/);
    const [points, box] = await Promise.all([cell.locator('[data-part="points"]').boundingBox(), cell.boundingBox()]);
    if (!points || !box) throw new Error('level cell not laid out');
    expect(Math.abs(points.y + points.height / 2 - (box.y + box.height / 2))).toBeLessThan(4);
  });
});
