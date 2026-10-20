import { expect, test } from '@playwright/test';
import { ADMIN, mockOrganisationSession, ORG, SESSION_REPORTS, SUBMITTED_REPORT, SUBMITTED_SESSION } from '../fixtures/organisation';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

test.describe('School session reports', () => {
  let api: MockApi;

  test.beforeEach(async ({ page, context, baseURL }) => {
    await signIn(context, ADMIN, baseURL as string);
    api = mockOrganisationSession(new MockApi())
      .get(new RegExp(`^/api/v1/enrollment/organisations/${ORG}/session-reports$`), paged(SESSION_REPORTS))
      .get(new RegExp(`^/api/v1/timetable/schedule/${SUBMITTED_SESSION}/report$`), SUBMITTED_REPORT);
    await api.install(page);
    await page.goto('/dashboard/organisation/session-reports');
  });

  test('flags overdue reports and counts compliance per trainer', async ({ page }) => {
    await expect(page.getByRole('alert').filter({ hasText: 'overdue' })).toContainText('2 session reports are overdue');
    const table = page.getByRole('table', { name: 'Compliance by trainer' });
    const antony = table.getByRole('row', { name: /Antony Trainer/ });
    // Antony: one overdue session, one submitted late.
    await expect(antony.getByRole('cell').nth(1)).toHaveText('2');
    await expect(antony.getByRole('cell').nth(3)).toHaveText('1');
    await expect(antony.getByRole('cell').nth(4)).toHaveText('1');
    await expect(table.getByRole('row', { name: /Emmanuel Trainer/ })).toContainText('100%');
  });

  test('filters the list by status', async ({ page }) => {
    const rows = page.getByTestId('session-report-row');
    await expect(rows).toHaveCount(2);
    await page.getByRole('button', { name: 'Submitted', exact: true }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Violin 4B');
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(rows).toHaveCount(4);
  });

  test('opens a submitted report read-only and sanitises comments', async ({ page }) => {
    await page.getByRole('button', { name: 'Submitted', exact: true }).click();
    await page.getByRole('button', { name: 'View report' }).click();
    const sheet = page.getByTestId('session-report-readonly');
    await expect(sheet).toContainText('Amani Wekesa');
    await expect(sheet).toContainText('29 / 30');
    await expect(sheet.getByText('Lovely tone.')).toBeVisible();
    await expect(sheet.getByRole('button')).toHaveCount(0);
    await expect(sheet.locator('textarea, input, [contenteditable="true"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
