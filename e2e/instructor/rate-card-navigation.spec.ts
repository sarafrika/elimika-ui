import { expect, test } from '@playwright/test';
import { INSTRUCTOR, mockInstructorWorkbook } from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

test('My Rate Cards opens the existing page from the sidebar and Jobs has no rate-card shortcut', async ({
  page,
  context,
  baseURL,
}) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  const api = mockInstructorWorkbook(new MockApi())
    .get(/^\/api\/v1\/courses\/training-applications\/search$/, paged([]))
    .get(/^\/api\/v1\/programs\/training-applications\/search$/, paged([]));
  await api.install(page);
  await page.goto('/dashboard/instructor/skills-matches?tab=jobs');
  await expect(page.getByRole('region', { name: 'Job summary', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rate cards', exact: true })).toHaveCount(0);

  const rateCards = page.getByRole('link', { name: 'My Rate Cards', exact: true });
  await expect(rateCards).toHaveAttribute('href', '/dashboard/instructor/rate-card');
  await rateCards.click();
  await expect(page).toHaveURL(/\/dashboard\/instructor\/rate-card$/);
  await expect(page.getByRole('heading', { name: 'My Rate Cards', exact: true })).toBeVisible();
  await expect(page.getByText('No rate cards yet', { exact: true })).toBeVisible();
  await expect(rateCards).toHaveAttribute('data-active', 'true');
});
