import { expect, test } from '@playwright/test';
import { paged } from '../support/api';
import { CLASS, ORG, shareWithFee, signedInAs, transactionsOf } from './fixtures';

const STATEMENT = [
  ...shareWithFee(31500, 35000, 3500, 'Flower Gardening'),
  { uuid: 'rev-1', transaction_type: 'SALE_REVERSAL', amount: 93600, currency_code: 'KES', balance_before: 93600, balance_after: 0,
    reference: 'order-17:line-1:reversal', description: 'Moved to the hiring organisation - Introduction to AI', created_date: '2026-10-19T08:00:00Z' },
];

test.describe('Instructor wallet', () => {
  test('shows the balance in the header and every sale share, fee and reversal in Transactions', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'instructor', baseURL ?? '', 31500,
      { shares_total: 35000, platform_fees_total: 3500, sales_count: 1 });
    api.get(/\/api\/v1\/wallets\/[^/]+\/transactions/, transactionsOf(STATEMENT));
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet?tab=transactions');

    await expect(page.getByRole('definition').first()).toHaveText('KES 31,500');
    const panel = page.getByRole('tabpanel', { name: 'Transactions' });
    await expect(panel.getByRole('listitem')).toHaveCount(3);
    await expect(panel.getByRole('listitem').filter({ hasText: 'Class sale share - Flower Gardening', hasNotText: 'Platform fee' })).toContainText('+ KES 35,000');
    await expect(panel.getByRole('listitem').filter({ hasText: 'Platform fee' })).toContainText('− KES 3,500');
    await expect(panel.getByRole('listitem').filter({ hasText: 'Moved to the hiring organisation' })).toContainText('SALE REVERSAL');
  });

  test('lists sessions organisations owe for, without letting the instructor settle them', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'instructor', baseURL ?? '', 31500);
    api
      .get(/\/obligation-statement$/, { lines: [{ organisation_uuid: ORG, currency_code: 'KES', amount_outstanding: 10500, outstanding_session_count: 1 }] })
      .get(/\/instructors\/users\/[^/]+\/instructor-obligations/, paged([
        { uuid: 'ob-1', organisation_uuid: ORG, class_definition_uuid: CLASS, rate_amount: 10500, currency_code: 'KES', status: 'ACCRUED', accrued_at: '2026-10-14T06:00:00Z' },
      ]))
      .get(/\/api\/v1\/classes\/[^/]+$/, { uuid: CLASS, title: 'Introduction to AI and ML' });
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet?tab=accounts');

    await expect(page.getByRole('tabpanel', { name: 'Accounts' })).toContainText('1 delivered session · paid to you directly, not withdrawable');
    const owed = page.getByRole('region', { name: 'Owed to me' });
    await expect(owed).toContainText('KES 10,500');
    await expect(owed).toContainText('Owed');
    await expect(owed.getByRole('button', { name: 'Record payment' })).toHaveCount(0);
  });

  test('opens a transfer from the instructor’s own wallet', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'instructor', baseURL ?? '', 31500);
    api.get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged(STATEMENT));
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet');
    await page.getByRole('button', { name: 'Transfer' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
