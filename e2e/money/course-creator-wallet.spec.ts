import { expect, test } from '@playwright/test';
import { paged } from '../support/api';
import { COURSE, shareWithFee, signedInAs, transactionsOf } from './fixtures';

test.describe('Course creator wallet', () => {
  test('lists shares and fees in Transactions and filters to platform fees', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'course_creator', baseURL ?? '', 141900);
    api.get(/\/api\/v1\/wallets\/[^/]+\/transactions/, transactionsOf([
      ...shareWithFee(141900, 3000, 300, 'AI and ML'),
      { uuid: 'sale-2', transaction_type: 'SALE', amount: 50400, currency_code: 'KES', balance_before: 88800, balance_after: 139200,
        reference: 'order-17:line-1:creator', description: 'Class sale share - Introduction to AI (re-settled)', created_date: '2026-10-20T08:00:00Z' },
    ]));
    await api.install(page);

    await page.goto('/dashboard/course-creator/wallet?tab=transactions');

    await expect(page.getByRole('definition').first()).toHaveText('KES 141,900');
    const panel = page.getByRole('tabpanel', { name: 'Transactions' });
    await expect(panel.getByRole('listitem')).toHaveCount(3);

    await panel.getByRole('combobox', { name: 'Transaction type' }).click();
    await page.getByRole('option', { name: 'Platform fee' }).click();
    await expect(panel.getByRole('listitem')).toHaveCount(1);
    await expect(panel).toContainText('− KES 300');
  });

  test('the old Revenue address opens Accounts with each course’s earnings', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'course_creator', baseURL ?? '', 141900);
    api
      .get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged([]))
      .get(/\/api\/v1\/revenue\/analytics\/course-earnings$/, [{ course_uuid: COURSE, sales_count: 3, earned_amount: 130200 }])
      .get(/\/api\/v1\/courses\/search/, paged([{ uuid: COURSE, name: 'Introduction to AI and ML' }]));
    await api.install(page);

    await page.goto('/dashboard/course-creator/revenue');

    await expect(page).toHaveURL(/\/dashboard\/course-creator\/wallet\?tab=accounts$/);
    const byCourse = page.getByRole('region', { name: 'By course' });
    await expect(byCourse).toContainText('Introduction to AI and ML');
    await expect(byCourse).toContainText('3 class sales');
    await expect(byCourse).toContainText('KES 130,200');
  });
});
