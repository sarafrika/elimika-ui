import { expect, type Page, test } from '@playwright/test';
import { httpError, paged } from '../support/api';
import { signedInAs, USER } from './fixtures';

// One person's wallet with a purse per role; the top-level figures are their sums.
const PURSES = [
  { purse: 'COURSE_CREATOR', wallet_uuid: 'w-cc', currency_code: 'KES', balance_amount: 13500, held_amount: 0, available_amount: 13500,
    account_balance: 13500, shares_total: 15000, platform_fees_total: 1500, sales_count: 1, transferred_out_total: 0 },
  { purse: 'INSTRUCTOR', wallet_uuid: 'w-in', currency_code: 'KES', balance_amount: 30000, held_amount: 2000, available_amount: 28000,
    account_balance: 32000, shares_total: 35000, platform_fees_total: 3500, sales_count: 1, transferred_out_total: 0 },
  { purse: 'STUDENT', wallet_uuid: 'w-st', currency_code: 'KES', balance_amount: 1500, held_amount: 0, available_amount: 1500,
    account_balance: 1500, shares_total: 0, platform_fees_total: 0, sales_count: 0, transferred_out_total: 0 },
];
const WALLET = { uuid: null, user_uuid: USER, owner_type: 'USER', owner_uuid: USER, currency_code: 'KES', balance_amount: 45000,
  held_amount: 2000, available_amount: 43000, account_balance: 47000, shares_total: 50000, platform_fees_total: 5000, sales_count: 2,
  transferred_out_total: 0, can_withdraw: true, purse: null, purses: PURSES };

const SPLIT = {
  uuid: 'split-1', order_id: 'o-31', order_number: '31', line_item_id: 'line-1', title: 'Introduction to AI',
  captured_at: '2026-10-20T11:05:00Z', currency_code: 'KES', line_gross: 50000, creator_percentage: 30,
  your_role: 'COURSE_CREATOR', your_purse: 'COURSE_CREATOR', your_gross: 15000, your_fee: 1500, your_net: 13500,
  creator: { role: 'COURSE_CREATOR', name: 'Amina Wanjiru', owner_type: 'USER', owner_uuid: USER, status: 'PAID', gross: 15000, fee: 1500, net: 13500 },
  delivery: { role: 'INSTRUCTOR', name: null, owner_type: null, owner_uuid: null, status: 'NO_EARNER', gross: 35000, fee: 0, net: 0 },
  platform_fee_total: 1500, retained: 36500, reconciles: false, backfilled: true,
  fee_rule: { description: '10% of each share', recorded: true },
  transactions: [
    { uuid: 'sale-1', wallet_uuid: 'w-cc', transaction_type: 'SALE', role: 'COURSE_CREATOR', reference: 'order-31:line-1:creator', amount: 15000, purse: 'COURSE_CREATOR' },
    { uuid: 'fee-1', wallet_uuid: 'w-cc', transaction_type: 'PLATFORM_FEE', role: 'COURSE_CREATOR', reference: 'order-31:line-1:creator:fee', amount: 1500, purse: 'COURSE_CREATOR' },
  ],
};

async function personWallet(page: Page, baseURL: string, role: 'course_creator' | 'instructor' | 'student') {
  const api = await signedInAs(page, role, baseURL);
  api
    .get(/\/api\/v1\/wallets\/[^/]+$/, WALLET)
    .get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged([]))
    .get(/\/api\/v1\/commerce\/orders\/mine/, paged([]))
    .get(/\/obligation-statement$/, { lines: [] });
  return api;
}

test.describe('Role purses', () => {
  for (const [role, path, account, available, label] of [
    ['course_creator', 'course-creator', 'KES 13,500', 'KES 13,500', 'Course creator purse'],
    ['instructor', 'instructor', 'KES 32,000', 'KES 28,000', 'Instructor purse'],
    ['student', 'student', 'KES 1,500', 'KES 1,500', 'Student purse'],
  ] as const) {
    test(`the ${path} wallet shows only its own purse`, async ({ page, baseURL }) => {
      const api = await personWallet(page, baseURL ?? '', role);
      await api.install(page);

      await page.goto(`/dashboard/${path}/wallet?tab=transactions`);

      const header = page.getByRole('definition');
      await expect(header.nth(0)).toHaveText(account);
      await expect(header.nth(1)).toHaveText(available);
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      await expect.poll(() => api.callsTo('GET', /\/wallets\/[^/]+\/transactions$/).at(-1)?.search ?? '').toContain(
        `purse=${role.toUpperCase()}`
      );
    });
  }

  test('the header chip shows the dashboard’s purse and every purse in its menu', async ({ page, baseURL }) => {
    const api = await personWallet(page, baseURL ?? '', 'instructor');
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet');
    await page.getByRole('banner').getByRole('button', { name: /32,000/ }).click();

    const all = page.getByRole('region', { name: 'All purses' });
    await expect(all).toContainText('KES 47,000');
    await expect(all).toContainText('Course creator purse');
    await expect(all).toContainText('KES 13,500');
    await expect(all).toContainText('Student purse');
  });

  test('a student cannot withdraw and is told why', async ({ page, baseURL }) => {
    const api = await personWallet(page, baseURL ?? '', 'student');
    await api.install(page);

    await page.goto('/dashboard/student/wallet');

    await expect(page.getByText('Student funds can be spent on Elimika but not withdrawn.').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toHaveCount(0);
  });

  test('moves money from the instructor purse into the student purse', async ({ page, baseURL }) => {
    const api = await personWallet(page, baseURL ?? '', 'instructor');
    api.on('POST', /\/api\/v1\/wallets\/[^/]+\/purse-transfers$/, { transfer_reference: 'PT-1', amount: 5000, currency_code: 'KES' });
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet');
    await page.getByRole('button', { name: 'Move between purses' }).click();
    const dialog = page.getByRole('dialog', { name: 'Move money between my purses' });
    await expect(dialog).toContainText('Available KES 28,000');
    await dialog.getByLabel('To').click();
    await page.getByRole('option', { name: 'Student purse' }).click();
    await dialog.getByLabel('Amount (KES)').fill('5000');
    await dialog.getByRole('button', { name: 'Move money' }).click();

    await expect.poll(() => api.callsTo('POST', /\/purse-transfers$/)[0]?.body).toMatchObject({
      from_purse: 'INSTRUCTOR', to_purse: 'STUDENT', amount: 5000, currency_code: 'KES',
    });
    await expect(page.getByText('KES 5,000 moved to your student purse.')).toBeVisible();
  });

  test('shows the server’s reason when a move is refused', async ({ page, baseURL }) => {
    const api = await personWallet(page, baseURL ?? '', 'instructor');
    api.on('POST', /\/purse-transfers$/, httpError(400, 'Money cannot leave the STUDENT purse.'));
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet');
    await page.getByRole('button', { name: 'Move between purses' }).click();
    const dialog = page.getByRole('dialog', { name: 'Move money between my purses' });
    await dialog.getByLabel('Amount (KES)').fill('100');
    await dialog.getByRole('button', { name: 'Move money' }).click();

    await expect(dialog.getByRole('alert')).toHaveText('Money cannot leave the STUDENT purse.');
  });

  test('a student tops up from their other purses but never moves money out', async ({ page, baseURL }) => {
    const api = await personWallet(page, baseURL ?? '', 'student');
    await api.install(page);

    await page.goto('/dashboard/student/wallet');
    await page.getByRole('button', { name: 'Add from my other purses' }).click();
    const dialog = page.getByRole('dialog', { name: 'Move money between my purses' });
    await dialog.getByLabel('From').click();
    await expect(page.getByRole('option', { name: /Student purse/ })).toHaveCount(0);
  });
});

test.describe('Order split breakdown', () => {
  test('lists sales for the purse and opens a line’s split', async ({ page, baseURL }) => {
    const api = await personWallet(page, baseURL ?? '', 'course_creator');
    api
      .get(/\/api\/v1\/wallets\/[^/]+\/sales$/, paged([SPLIT]))
      .get(/\/api\/v1\/wallets\/[^/]+\/sales\/split-1$/, SPLIT);
    await api.install(page);

    await page.goto('/dashboard/course-creator/wallet?tab=sales');

    const sales = page.getByRole('tabpanel', { name: 'Sales' });
    const row = sales.getByRole('row').filter({ hasText: 'Introduction to AI' });
    await expect(row).toContainText('KES 50,000');
    await expect(row).toContainText('KES 15,000');
    await expect(row).toContainText('− KES 1,500');
    await expect(row).toContainText('KES 13,500');
    expect(api.callsTo('GET', /\/sales$/)[0]?.search).toContain('purse=COURSE_CREATOR');

    await row.getByRole('button', { name: 'Breakdown' }).click();
    const sheet = page.getByRole('dialog', { name: 'Introduction to AI' });
    await expect(sheet.getByRole('region', { name: 'Course creator share' })).toContainText('30%');
    await expect(sheet.getByRole('region', { name: 'Course creator share' })).toContainText('Amina Wanjiru');
    await expect(sheet.getByRole('region', { name: 'Instructor share' })).toContainText('70%');
    await expect(sheet.getByRole('region', { name: 'Instructor share' })).toContainText('No earner');
    await expect(sheet).toContainText('Kept by Elimika');
    await expect(sheet).toContainText('KES 36,500');
    await expect(sheet.getByRole('list', { name: 'Why Elimika kept part of this line' })).toContainText('nobody was set to receive');
    await expect(sheet.getByRole('region', { name: 'Fee rule' })).toContainText('10% of each share');
    await expect(sheet.getByRole('alert')).toContainText('do not add up to the line total');
    await expect(sheet).toContainText('Recorded before splits were kept');
    const txns = sheet.getByRole('region', { name: 'Your transactions for this sale' });
    await expect(txns).toContainText('Sale share');
    await expect(txns).toContainText('Platform fee');
  });

  test('a sale share in Transactions opens the same split', async ({ page, baseURL }) => {
    const api = await personWallet(page, baseURL ?? '', 'course_creator');
    api
      .get(/\/api\/v1\/wallets\/[^/]+\/transactions/, paged([
        { uuid: 'sale-1', transaction_type: 'SALE', amount: 15000, currency_code: 'KES', balance_before: 0, balance_after: 15000,
          reference: 'order-31:line-1:creator', description: 'Class sale share - Introduction to AI', created_date: '2026-10-20T11:05:00Z',
          purse: 'COURSE_CREATOR', sale_split_uuid: 'split-1' },
      ]))
      .get(/\/api\/v1\/wallets\/[^/]+\/sales\/split-1$/, SPLIT);
    await api.install(page);

    await page.goto('/dashboard/course-creator/wallet?tab=transactions');
    await page.getByRole('button', { name: 'View split' }).click();

    await expect(page.getByRole('dialog', { name: 'Introduction to AI' })).toContainText('Line total');
    expect(api.callsTo('GET', /\/sales\/split-1$/)[0]?.search).toContain('purse=COURSE_CREATOR');
  });
});

test.describe('Admin purses', () => {
  test('payout rows and the wallet check name the purse a withdrawal is paid from', async ({ page, baseURL }) => {
    const row = { uuid: 'wd-1', reference: 'WD-2026-000001', status: 'NEEDS_REVIEW', amount: 2000, fee_amount: 0, net_amount: 2000,
      currency_code: 'KES', masked_msisdn: '+254 7•• ••• 678', owner_type: 'USER', owner_uuid: USER, requester_name: 'Amina Wanjiru',
      created_date: '2026-10-23T08:00:00Z', review_flags: [], purse: 'INSTRUCTOR', wallet_flags: [],
      wallet_check: { purse: 'INSTRUCTOR', account_balance: 32000, held_amount: 2000, held_count: 1, available_balance: 28000,
        balance_after: 26000, ledger_balance: 28000, ledger_matches: true, covers: true, checked_at: '2026-10-23T09:00:00Z' } };
    const api = await signedInAs(page, 'admin', baseURL ?? '');
    api
      .get(/\/api\/v1\/admin\/payouts\/summary$/, { payouts_configured: true, needs_review_count: 1, needs_review_amount: 2000 })
      .get(/\/api\/v1\/admin\/payouts\/withdrawals$/, paged([row]));
    await api.install(page);

    await page.goto('/dashboard/admin/payouts');

    const tableRow = page.getByRole('row').filter({ hasText: 'WD-2026-000001' });
    await expect(tableRow).toContainText('Instructor purse');
    await tableRow.getByRole('button', { name: 'Open' }).click();
    const check = page.getByRole('region', { name: 'Wallet check' });
    await expect(check).toContainText('Wallet check · Instructor purse');
    await expect(check).toContainText('Instructor purse balance');
    await expect(check).toContainText('KES 32,000');
  });

  test('an order in Sales shows how each line was split', async ({ page, baseURL }) => {
    const api = await signedInAs(page, 'admin', baseURL ?? '');
    api
      .get(/\/api\/v1\/revenue\/analytics\/sales/, paged([{ order_id: 'o-31', order_number: '31', line_item_id: 'line-1', title: 'Introduction to AI',
        customer_email: 'learner@e2e.test', payment_status: 'CAPTURED', order_total_amount: 50000, order_currency_code: 'KES' }]))
      .get(/\/api\/v1\/admin\/sales\/orders\/o-31\/splits$/, [{ ...SPLIT, your_role: null, your_purse: null }]);
    await api.install(page);

    await page.goto('/dashboard/admin/sales?order=o-31');

    const splits = page.getByRole('region', { name: 'Split · Introduction to AI' });
    await expect(splits).toContainText('Course creator share');
    await expect(splits).toContainText('Amina Wanjiru');
    await expect(splits).toContainText('Kept by Elimika');
  });
});
