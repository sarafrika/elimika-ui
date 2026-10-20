import { expect, test } from '@playwright/test';
import { paged } from '../support/api';
import { CHILD_A, CHILD_B, order, signedInAs } from './fixtures';

const ORDERS = [
  order('o-26', '26', 'CAPTURED', 10000, 'AI and ML', '2026-10-18T06:12:00Z', CHILD_A),
  order('o-24', '24', 'CAPTURED', 18000, 'Flower Gardening Masterclass', '2026-10-08T13:40:00Z', CHILD_B),
  order('o-19', '19', 'CAPTURED', 75000, 'Introduction to AI and ML', '2026-10-07T08:05:00Z', CHILD_A),
];

test.describe('Parent billing', () => {
  test('lists each payment with the child it was for, and filters by child', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'parent', baseURL ?? '');
    api
      .get(/\/api\/v1\/commerce\/orders\/mine/, paged(ORDERS))
      .get(/\/api\/v1\/students\/search/, paged([
        { uuid: CHILD_A, user_uuid: 'u-a', full_name: 'Jabari' },
        { uuid: CHILD_B, user_uuid: 'u-b', full_name: 'Wanjiku' },
      ]));
    await api.install(page);

    await page.goto('/dashboard/parent/billing');

    await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Summary' })).toContainText('KES 103,000');
    const payments = page.getByRole('region', { name: 'Payments' });
    await expect(payments).toContainText('For Jabari');
    await expect(payments.getByRole('listitem')).toHaveCount(3);

    await payments.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Wanjiku' }).click();
    await expect(payments.getByRole('listitem')).toHaveCount(1);
    await expect(payments).toContainText('Flower Gardening Masterclass');
  });

  test('totals what was paid for each child', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'parent', baseURL ?? '');
    api
      .get(/\/api\/v1\/commerce\/orders\/mine/, paged(ORDERS))
      .get(/\/api\/v1\/students\/search/, paged([
        { uuid: CHILD_A, user_uuid: 'u-a', full_name: 'Jabari' },
        { uuid: CHILD_B, user_uuid: 'u-b', full_name: 'Wanjiku' },
      ]));
    await api.install(page);

    await page.goto('/dashboard/parent/billing?tab=children');

    const children = page.getByRole('region', { name: 'By child' });
    await expect(children.getByRole('listitem').filter({ hasText: 'Jabari' })).toContainText('KES 85,000');
    await expect(children.getByRole('listitem').filter({ hasText: 'Wanjiku' })).toContainText('KES 18,000');
  });
});
