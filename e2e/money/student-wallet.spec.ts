import { expect, test } from '@playwright/test';
import { paged } from '../support/api';
import { order, signedInAs } from './fixtures';

const ORDERS = [
  order('o-2', '2', 'AWAITING_PAYMENT', 49500, 'Saturday Test Class', '2026-08-24T15:33:00Z'),
  order('o-23', '23', 'CAPTURED', 10000, 'AI and ML', '2026-10-17T20:19:30Z'),
  order('o-20', '20', 'CAPTURED', 18000, 'Flower Gardening Masterclass', '2026-10-07T07:57:00Z'),
];

test.describe('Student wallet', () => {
  test('shows what the student paid and what is still due, and filters to what is waiting', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'student', baseURL ?? '');
    api.get(/\/api\/v1\/commerce\/orders\/mine/, paged(ORDERS));
    await api.install(page);

    await page.goto('/dashboard/student/wallet');

    await expect(page.getByRole('heading', { name: 'My payments' })).toBeVisible();
    const summary = page.getByRole('region', { name: 'Summary' });
    await expect(summary).toContainText('KES 28,000');
    await expect(summary).toContainText('KES 49,500');
    const payments = page.getByRole('region', { name: 'Payments' });
    await expect(payments.getByRole('listitem')).toHaveCount(3);

    await payments.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Awaiting payment' }).click();
    await expect(payments.getByRole('listitem')).toHaveCount(1);
    await expect(payments).toContainText('Saturday Test Class');
  });

  test('opens a receipt for a paid order in a side sheet', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'student', baseURL ?? '');
    api.get(/\/api\/v1\/commerce\/orders\/mine/, paged(ORDERS));
    await api.install(page);
    await page.goto('/dashboard/student/wallet');

    await page.getByRole('listitem').filter({ hasText: 'AI and ML' }).getByRole('button', { name: 'Receipt' }).click();

    const sheet = page.getByRole('dialog', { name: /Receipt · Order #23/ });
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('KES 10,000');
    await expect(sheet).toContainText('Paid');
  });

  test('sends an M-Pesa prompt for an order awaiting payment and waits for it to clear', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'student', baseURL ?? '');
    api
      .get(/\/api\/v1\/commerce\/orders\/mine/, paged(ORDERS))
      .on('POST', /\/api\/v1\/commerce\/orders\/o-2\/pay\/mpesa$/, { checkout_request_id: 'ws_CO_1' })
      .get(/\/api\/v1\/commerce\/orders\/o-2\/payment-status$/, { status: 'CAPTURED' });
    await api.install(page);
    await page.goto('/dashboard/student/wallet');

    await page.getByRole('button', { name: 'Complete payment' }).click();
    const sheet = page.getByRole('dialog', { name: 'Complete payment' });
    await sheet.getByLabel('M-Pesa number').fill('0712345678');
    await sheet.getByRole('button', { name: 'Send M-Pesa prompt' }).click();

    await expect.poll(() => api.callsTo('POST', /\/pay\/mpesa$/).length).toBe(1);
    expect(api.callsTo('POST', /\/pay\/mpesa$/)[0]?.body).toEqual({ phone_number: '0712345678' });
    await expect(page.getByText('Payment received. Your seat is confirmed.')).toBeVisible();
  });

  test('the Balance tab is deep-linkable and explains an empty balance', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'student', baseURL ?? '');
    api
      .get(/\/api\/v1\/commerce\/orders\/mine/, paged(ORDERS))
      .get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged([]));
    await api.install(page);

    await page.goto('/dashboard/student/wallet?tab=balance');

    await expect(page.getByRole('tab', { name: /Balance/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('No credits yet')).toBeVisible();
    await page.getByRole('tab', { name: /Payments/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/student\/wallet$/);
  });
});
