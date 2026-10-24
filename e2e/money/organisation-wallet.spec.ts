import { expect, test } from '@playwright/test';
import { paged } from '../support/api';
import { CLASS, INSTRUCTOR, ORG, shareWithFee, signedInAs } from './fixtures';

const OBLIGATIONS = [
  { uuid: 'ob-1', organisation_uuid: ORG, instructor_uuid: INSTRUCTOR, class_definition_uuid: CLASS, rate_amount: 10500,
    currency_code: 'KES', status: 'ACCRUED', accrued_at: '2026-10-14T06:00:00Z' },
  { uuid: 'ob-2', organisation_uuid: ORG, instructor_uuid: INSTRUCTOR, class_definition_uuid: CLASS, rate_amount: 10500,
    currency_code: 'KES', status: 'SETTLED', accrued_at: '2026-10-07T06:00:00Z', settlement_reference: 'QJK8L2' },
];

async function organisationWallet(page: import('@playwright/test').Page, baseURL: string) {
  const api = await signedInAs(page, 'organisation_user', baseURL);
  api
    .get(new RegExp(`/api/v1/organisations/${ORG}/wallet$`), { wallet_uuid: 'ow', currency_code: 'KES', balance_amount: 123840,
      shares_total: 33600, platform_fees_total: 3360, sales_count: 1 })
    .get(new RegExp(`/api/v1/organisations/${ORG}/wallet/transactions`), paged(shareWithFee(123840, 33600, 3360, 'Introduction to AI')))
    .get(new RegExp(`/api/v1/organisations/${ORG}/instructor-obligations`), paged(OBLIGATIONS))
    .get(/\/api\/v1\/classes\/[^/]+$/, { uuid: CLASS, title: 'Introduction to AI and ML' });
  return api;
}

test.describe('Organisation wallet', () => {
  test('shows the organisation’s balance, its share net of fees, and what it owes instructors', async ({ page, baseURL }) => {
    const api = await organisationWallet(page, baseURL ?? '');
    await api.install(page);

    await page.goto('/dashboard/organisation/wallet');

    await expect(page.getByRole('heading', { name: 'Organisation Wallet' })).toBeVisible();
    await expect(page.getByRole('definition').first()).toHaveText('KES 123,840');
    const summary = page.getByRole('region', { name: 'Summary' });
    await expect(summary).toContainText('KES 33,600');
    await expect(summary).toContainText('− KES 3,360');
    await expect(summary).toContainText('KES 10,500');
    await expect(page.getByRole('listitem').filter({ hasText: 'Class sale share', hasNotText: 'Platform fee' })).toContainText('+ KES 33,600');
  });

  test('records paying an instructor for a delivered session', async ({ page, baseURL }) => {
    const api = await organisationWallet(page, baseURL ?? '');
    api.on('POST', new RegExp(`/api/v1/organisations/${ORG}/instructor-obligations/ob-1/settle$`), { ...OBLIGATIONS[0], status: 'SETTLED' });
    await api.install(page);

    await page.goto('/dashboard/organisation/wallet?tab=accounts');

    const payables = page.getByRole('region', { name: 'Instructor payables' });
    await expect(payables.getByRole('listitem')).toHaveCount(2);
    await expect(payables.getByRole('button', { name: 'Record payment' })).toHaveCount(1);

    await payables.getByRole('button', { name: 'Record payment' }).click();
    const sheet = page.getByRole('dialog', { name: 'Record payment' });
    await sheet.getByLabel('Payment reference').fill('MPESA QJK8L3');
    await sheet.getByRole('button', { name: 'Record payment' }).click();

    await expect.poll(() => api.callsTo('POST', /\/settle$/).length).toBe(1);
    expect(api.callsTo('POST', /\/settle$/)[0]?.body).toEqual({ settlement_reference: 'MPESA QJK8L3' });
    await expect(page.getByText('Payment recorded. The instructor sees it as settled.')).toBeVisible();
  });

  test('sits in the Finance menu next to Earnings, with Learner funding renamed', async ({ page, baseURL }) => {
    const api = await organisationWallet(page, baseURL ?? '');
    await api.install(page);

    await page.goto('/dashboard/organisation/wallet');

    await expect(page.getByRole('link', { name: 'Wallet', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Learner funding' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Earnings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skills Wallet' })).toHaveCount(0);
  });
});
