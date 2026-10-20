import { expect, test } from '@playwright/test';
import { paged } from '../support/api';
import { CLASS, ORG, shareWithFee, signedInAs } from './fixtures';

const STATEMENT = [
  ...shareWithFee(31500, 35000, 3500, 'Flower Gardening'),
  { uuid: 'rev-1', transaction_type: 'SALE_REVERSAL', amount: 93600, currency_code: 'KES', balance_after: 0,
    reference: 'order-17:line-1:reversal', description: 'Moved to the hiring organisation - Introduction to AI', created_date: '2026-10-20T08:00:00Z' },
];

test.describe('Instructor wallet', () => {
  test('pairs each sale share with its platform fee and shows the breakdown on request', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'instructor', baseURL ?? '', 31500);
    api
      .get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged(STATEMENT))
      .get(/\/obligation-statement$/, { lines: [{ organisation_uuid: ORG, currency_code: 'KES', amount_outstanding: 21000, outstanding_session_count: 2 }] });
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet');

    const summary = page.getByRole('region', { name: 'Summary' });
    await expect(summary).toContainText('KES 31,500');
    await expect(summary).toContainText('− KES 3,500');
    await expect(summary).toContainText('KES 21,000');

    const share = page.getByRole('listitem').filter({ hasText: 'Class sale share · Flower Gardening' });
    await expect(share).toContainText('+ KES 31,500');
    await share.getByRole('button', { name: 'Breakdown' }).click();
    await expect(share).toContainText('+ KES 35,000');
    await expect(share).toContainText('− KES 3,500');

    const reversal = page.getByRole('listitem').filter({ hasText: 'Moved to the hiring organisation' });
    await expect(reversal).toContainText('Reversed');
  });

  test('lists sessions organisations owe for, without letting the instructor settle them', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'instructor', baseURL ?? '', 31500);
    api
      .get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged(STATEMENT))
      .get(/\/obligation-statement$/, { lines: [] })
      .get(/\/instructors\/users\/[^/]+\/instructor-obligations/, paged([
        { uuid: 'ob-1', organisation_uuid: ORG, class_definition_uuid: CLASS, rate_amount: 10500, currency_code: 'KES', status: 'ACCRUED', accrued_at: '2026-10-14T06:00:00Z' },
      ]))
      .get(/\/api\/v1\/classes\/[^/]+$/, { uuid: CLASS, title: 'Introduction to AI and ML' });
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet?tab=owed');

    const owed = page.getByRole('region', { name: 'Owed to me' });
    await expect(owed).toContainText('KES 10,500');
    await expect(owed).toContainText('Owed');
    await expect(owed.getByRole('button', { name: 'Record payment' })).toHaveCount(0);
  });

  test('opens a transfer from the instructor’s own wallet', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'instructor', baseURL ?? '', 31500);
    api
      .get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged(STATEMENT))
      .get(/\/obligation-statement$/, { lines: [] });
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet');
    await page.getByRole('button', { name: 'Transfer' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
