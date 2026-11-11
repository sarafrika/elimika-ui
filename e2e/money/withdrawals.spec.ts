import { expect, type Page, test } from '@playwright/test';
import { httpError, paged } from '../support/api';
import { ORG, signedInAs, USER } from './fixtures';

const RULES = { min_amount: 100, max_amount: 150000, daily_limit: 300000, fee_payer: 'PLATFORM', earner_fee: 0,
  new_number_hold_hours: 24, withdrawals_enabled: true };
const METHOD = { uuid: 'pm-1', method_type: 'MPESA', label: 'Personal', masked_msisdn: '+254 7•• ••• 678', status: 'VERIFIED',
  is_default: true, on_hold: false };
const withdrawal = (status: string, extra: Record<string, unknown> = {}) => ({
  uuid: 'wd-1', reference: 'WD-2026-000001', status, amount: 2000, fee_amount: 0, net_amount: 2000, currency_code: 'KES',
  masked_msisdn: METHOD.masked_msisdn, owner_type: 'USER', owner_uuid: USER, requester_name: 'Amina Wanjiru',
  requested_by_user_uuid: USER, created_date: '2026-10-23T08:00:00Z', review_flags: [], ...extra,
});

// The admin endpoints add each earner's wallet as the server read it.
const WALLET_OK = { account_balance: 23880, held_amount: 2000, held_count: 1, available_balance: 21880, balance_after: 21880,
  ledger_balance: 21880, ledger_matches: true, covers: true, held_debited_amount: 2000, checked_at: '2026-10-23T09:00:00Z' };
const adminRow = (status: string, extra: Record<string, unknown> = {}) =>
  withdrawal(status, { wallet_check: WALLET_OK, wallet_flags: [], ...extra });

async function instructorWallet(page: Page, baseURL: string, canWithdraw: boolean, rules = RULES, methods = [METHOD],
  role: 'instructor' | 'course_creator' = 'instructor') {
  const api = await signedInAs(page, role, baseURL, 23880);
  api
    .get(/\/api\/v1\/wallets\/[^/]+$/, { uuid: 'w1', user_uuid: USER, owner_type: 'USER', owner_uuid: USER, currency_code: 'KES',
      balance_amount: 23880, held_amount: 0, available_amount: 23880, can_withdraw: canWithdraw })
    .get(/\/api\/v1\/wallets\/payout-rules$/, rules)
    .get(/\/api\/v1\/wallets\/[^/]+\/payout-methods$/, methods)
    .get(/\/api\/v1\/wallets\/[^/]+\/withdrawals$/, paged([]))
    .get(/\/obligation-statement$/, { lines: [] });
  return api;
}

test.describe('Withdrawals', () => {
  for (const [role, path, who] of [['instructor', 'instructor', 'an instructor'], ['course_creator', 'course-creator', 'a course creator']] as const) {
  test(`${who} withdraws to M-Pesa with the SMS code and sees it paid`, async ({ page, baseURL }) => {
    const api = await instructorWallet(page, baseURL ?? '', true, RULES, [METHOD], role);
    api
      .on('POST', /\/api\/v1\/wallets\/[^/]+\/withdrawals$/, {
        withdrawal: withdrawal('AWAITING_CONFIRMATION'),
        verification: { sent_to: METHOD.masked_msisdn, expires_at: '2026-10-23T08:10:00Z', resend_available_at: '2026-10-23T08:01:00Z' },
      })
      .on('POST', /\/withdrawals\/wd-1\/confirm$/, withdrawal('PROCESSING', { confirmed_at: '2026-10-23T08:01:00Z' }))
      .get(/\/api\/v1\/wallets\/[^/]+\/withdrawals\/wd-1$/, withdrawal('PAID', { mpesa_receipt: 'TJL4DE02A5' }));
    await api.install(page);

    await page.goto(`/dashboard/${path}/wallet?tab=withdrawals`);
    await page.getByRole('button', { name: 'Withdraw', exact: true }).first().click();
    const sheet = page.getByRole('dialog');
    await sheet.getByLabel('Amount (KES)').fill('2000');
    await expect(sheet).toContainText('Left in purse');
    await expect(sheet).toContainText(`From: ${role === 'instructor' ? 'Instructor' : 'Course creator'} purse · available`);
    await expect(sheet).toContainText('KES 21,880');
    await sheet.getByRole('button', { name: 'Continue' }).click();

    await sheet.getByLabel('Confirmation code').fill('574851');
    await sheet.getByRole('button', { name: 'Confirm withdrawal' }).click();
    await expect(sheet).toContainText(`Sent to ${METHOD.masked_msisdn}`, { timeout: 15_000 });
    await expect(sheet).toContainText('TJL4DE02A5');

    const [request] = api.callsTo('POST', /\/api\/v1\/wallets\/[^/]+\/withdrawals$/);
    expect(request?.body).toMatchObject({ amount: 2000, payout_method_uuid: 'pm-1', purse: role === 'instructor' ? 'INSTRUCTOR' : 'COURSE_CREATOR' });
    expect((request?.body as { idempotency_key?: string }).idempotency_key).toBeTruthy();
    expect(api.callsTo('POST', /\/confirm$/)[0]?.body).toEqual({ code: '574851' });
  });
  }

  test('asks for a payout number before anything else', async ({ page, baseURL }) => {
    const api = await instructorWallet(page, baseURL ?? '', true, RULES, []);
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet');
    await page.getByRole('button', { name: 'Withdraw', exact: true }).first().click();

    const sheet = page.getByRole('dialog');
    await expect(sheet).toContainText('Add where to send your money');
    await expect(sheet.getByRole('button', { name: 'Add M-Pesa number' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Continue' })).toHaveCount(0);
  });

  test('says withdrawals are not open yet instead of offering the button', async ({ page, baseURL }) => {
    const api = await instructorWallet(page, baseURL ?? '', false, { ...RULES, withdrawals_enabled: false });
    await api.install(page);

    await page.goto('/dashboard/instructor/wallet?tab=withdrawals');

    await expect(page.getByText('Withdrawals to M-Pesa are not open yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toHaveCount(0);
  });
});

async function organisationWallet(page: Page, baseURL: string, approver: boolean, rows: unknown[]) {
  const api = await signedInAs(page, 'organisation_user', baseURL);
  api
    .get(new RegExp(`/api/v1/organisations/${ORG}/wallet$`), { wallet_uuid: 'ow', currency_code: 'KES', balance_amount: 250000,
      held_amount: 120000, available_amount: 130000, can_withdraw: approver })
    .get(/\/api\/v1\/wallets\/payout-rules$/, RULES)
    .get(new RegExp(`/api/v1/organisations/${ORG}/wallet/payout-approvers$`),
      approver ? [{ user_uuid: USER, name: 'Amina Wanjiru' }] : [])
    .get(new RegExp(`/api/v1/organisations/${ORG}/wallet/payout-methods$`), [METHOD])
    .get(new RegExp(`/api/v1/organisations/${ORG}/wallet/withdrawals$`), paged(rows));
  return api;
}

test.describe('Organisation withdrawals', () => {
  const large = withdrawal('AWAITING_SECOND_APPROVAL', { amount: 120000, net_amount: 120000, owner_type: 'ORGANISATION',
    owner_uuid: ORG, requested_by_user_uuid: 'someone-else', requester_name: 'Brian Otieno', confirmed_at: '2026-10-23T08:01:00Z' });

  test('a payout approver gives the second approval on a colleague’s large withdrawal', async ({ page, baseURL }) => {
    const api = await organisationWallet(page, baseURL ?? '', true, [large]);
    api.on('POST', new RegExp(`/api/v1/organisations/${ORG}/wallet/withdrawals/wd-1/approve$`), { ...large, status: 'SENDING' });
    await api.install(page);

    await page.goto('/dashboard/organisation/wallet?tab=withdrawals');
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('button', { name: 'Approve as second approver' }).click();

    await expect.poll(() => api.callsTo('POST', /\/withdrawals\/wd-1\/approve$/).length).toBe(1);
  });

  test('tells an admin who is not a payout approver why they cannot withdraw', async ({ page, baseURL }) => {
    const api = await organisationWallet(page, baseURL ?? '', false, [large]);
    await api.install(page);

    await page.goto('/dashboard/organisation/wallet?tab=withdrawals');

    await expect(page.getByText('Only payout approvers can withdraw from the organisation wallet.')).toBeVisible();
    await page.getByRole('button', { name: 'View' }).click();
    await expect(page.getByRole('button', { name: 'Approve as second approver' })).toHaveCount(0);
  });
});

test.describe('Admin payouts', () => {
  test('approves a first payout from the review queue', async ({ page, baseURL }) => {
    const flagged = adminRow('NEEDS_REVIEW', { review_flags: ['FIRST_PAYOUT_TO_NUMBER'], confirmed_at: '2026-10-23T08:01:00Z' });
    const api = await signedInAs(page, 'admin', baseURL ?? '');
    api
      .get(/\/api\/v1\/admin\/payouts\/summary$/, { payouts_configured: true, float_amount: 98500, float_reported_at: '2026-10-23T09:00:00Z',
        needs_review_count: 1, needs_review_amount: 2000, in_flight_count: 0, paid_today_amount: 0, failed_count: 0 })
      .get(/\/api\/v1\/admin\/payouts\/withdrawals$/, paged([flagged]))
      .on('POST', /\/api\/v1\/admin\/payouts\/withdrawals\/wd-1\/approve$/, { ...flagged, status: 'SENDING' });
    await api.install(page);

    await page.goto('/dashboard/admin/payouts');

    await expect(page.getByRole('region', { name: 'Summary' })).toContainText('KES 98,500');
    const row = page.getByRole('row').filter({ hasText: 'WD-2026-000001' });
    await expect(row).toContainText('First payout to this number');
    await expect(row).toContainText('KES 21,880');
    await expect(row).toContainText('after KES 21,880');
    await expect(row).toContainText('KES 2,000 held · 1');
    await row.getByRole('button', { name: 'Open' }).click();
    const walletCheck = page.getByRole('region', { name: 'Wallet check' });
    await expect(walletCheck).toContainText('Account balance');
    await expect(walletCheck).toContainText('Balance after this payout');
    await expect(walletCheck).toContainText('✓ matches');
    await page.getByRole('button', { name: 'Approve into its own batch' }).click();

    await expect.poll(() => api.callsTo('POST', /\/admin\/payouts\/withdrawals\/wd-1\/approve$/).length).toBe(1);
  });

  test('a rejection needs a reason the earner will read', async ({ page, baseURL }) => {
    const flagged = adminRow('NEEDS_REVIEW', { review_flags: ['ABOVE_REVIEW_LIMIT'], amount: 60000, net_amount: 60000 });
    const api = await signedInAs(page, 'admin', baseURL ?? '');
    api
      .get(/\/api\/v1\/admin\/payouts\/summary$/, { payouts_configured: true, needs_review_count: 1, needs_review_amount: 60000 })
      .get(/\/api\/v1\/admin\/payouts\/withdrawals$/, paged([flagged]))
      .on('POST', /\/api\/v1\/admin\/payouts\/withdrawals\/wd-1\/reject$/, { ...flagged, status: 'REJECTED' });
    await api.install(page);

    await page.goto('/dashboard/admin/payouts');
    await page.getByRole('row').filter({ hasText: 'WD-2026-000001' }).getByRole('button', { name: 'Open' }).click();
    await page.getByRole('button', { name: 'Reject', exact: true }).click();

    const confirm = page.getByRole('button', { name: 'Reject and refund' });
    await expect(confirm).toBeDisabled();
    await page.getByLabel('Reason the earner will see').fill('The name on this number does not match your profile.');
    await confirm.click();

    await expect.poll(() => api.callsTo('POST', /\/reject$/)[0]?.body).toEqual({
      reason: 'The name on this number does not match your profile.',
    });
  });
});

test.describe('Admin payout batches', () => {
  const FLOAT = { utility_funds: 0, working_funds: 98500, reported_at: '2026-10-23T09:00:00Z' };
  const batch = (extra: Record<string, unknown> = {}) => ({
    uuid: 'b-1', status: 'AWAITING_APPROVAL', created_by: 'other-admin', created_by_name: 'Kevin Otieno',
    submitted_by: 'other-admin', submitted_by_name: 'Kevin Otieno', submitted_at: '2026-10-23T09:00:00Z', row_count: 1,
    total_amount: 2000, paid_count: 0, failed_count: 0, in_flight_count: 0, created_date: '2026-10-23T08:30:00Z',
    can_approve: true, wallet_issue_count: 0, wallets_checked: 1, ...extra,
  });
  // GET /batches/{uuid} nests the batch beside its rows and float, as the API returns it.
  const detail = (extra: Record<string, unknown> = {}, payoutFloat: unknown = FLOAT,
    rows = [adminRow('NEEDS_REVIEW', { payout_batch_uuid: 'b-1' })]) => ({
    batch: batch(extra), withdrawals: rows, payout_float: payoutFloat,
  });

  async function admin(page: Page, baseURL: string) {
    const api = await signedInAs(page, 'admin', baseURL);
    api.get(/\/api\/v1\/admin\/payouts\/summary$/, { payouts_configured: true, needs_review_count: 1, needs_review_amount: 2000 });
    return api;
  }

  test('builds a batch from the withdrawals waiting for one', async ({ page, baseURL }) => {
    const api = await admin(page, baseURL ?? '');
    api
      .get(/\/api\/v1\/admin\/payouts\/withdrawals$/, paged([adminRow('NEEDS_REVIEW', { review_flags: ['FIRST_PAYOUT_TO_NUMBER'] })]))
      .on('POST', /\/api\/v1\/admin\/payouts\/batches$/, batch({ status: 'DRAFT' }))
      .get(/\/api\/v1\/admin\/payouts\/batches\/b-1$/, detail({ status: 'DRAFT' }));
    await api.install(page);

    await page.goto('/dashboard/admin/payouts');
    await page.getByRole('checkbox', { name: 'Select WD-2026-000001' }).click();
    const bar = page.getByRole('region', { name: 'Selection' });
    await expect(bar).toContainText('1 selected');
    await expect(bar).toContainText('KES 2,000');
    await bar.getByRole('button', { name: 'Create batch' }).click();

    await expect.poll(() => api.callsTo('POST', /\/admin\/payouts\/batches$/)[0]?.body).toEqual({ withdrawal_uuids: ['wd-1'] });
    await expect(page).toHaveURL(/\/dashboard\/admin\/payouts\/batches\/b-1$/);
    await expect(page.getByRole('button', { name: 'Submit for approval' })).toBeEnabled();
  });

  test('the admin who made a batch cannot approve it', async ({ page, baseURL }) => {
    const api = await admin(page, baseURL ?? '');
    api.get(/\/api\/v1\/admin\/payouts\/batches\/b-1$/, detail({ created_by: USER, submitted_by: USER, can_approve: false }));
    await api.install(page);

    await page.goto('/dashboard/admin/payouts/batches/b-1');
    await expect(page.getByRole('button', { name: 'Approve and pay' })).toBeDisabled();
    await expect(page.getByText('You made this batch — another admin must approve it.')).toBeVisible();
  });

  test('uses Working funds for B2C even when Utility is empty', async ({ page, baseURL }) => {
    const api = await admin(page, baseURL ?? '');
    api.get(
      /\/api\/v1\/admin\/payouts\/batches\/b-1$/,
      detail({ total_amount: 200 }, { ...FLOAT, working_funds: 500 })
    );
    await api.install(page);

    await page.goto('/dashboard/admin/payouts/batches/b-1');

    await expect(page.getByText('Working available to pay out')).toBeVisible();
    await expect(page.getByText('Utility account: KES 0')).toBeVisible();
    await expect(page.getByText(/Enough float/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve and pay' })).toBeEnabled();
  });

  test('an unknown float needs the approver to vouch for it', async ({ page, baseURL }) => {
    const api = await admin(page, baseURL ?? '');
    api
      .get(/\/api\/v1\/admin\/payouts\/batches\/b-1$/, detail({}, null))
      .on('POST', /\/api\/v1\/admin\/payouts\/batches\/b-1\/approve$/, batch({ status: 'RELEASED' }));
    await api.install(page);

    await page.goto('/dashboard/admin/payouts/batches/b-1');
    await expect(page.getByText('Float unknown').first()).toBeVisible();
    await page.getByRole('button', { name: 'Approve and pay' }).click();
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Approve and pay' });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole('checkbox').click();
    await confirm.click();

    await expect.poll(() => api.callsTo('POST', /\/batches\/b-1\/approve$/)[0]?.body).toEqual({
      override_unknown_float: true, acknowledge_wallet_issues: false,
    });
  });

  test('a wallet whose ledger disagrees is flagged and needs the approver’s check', async ({ page, baseURL }) => {
    const mismatch = adminRow('NEEDS_REVIEW', { payout_batch_uuid: 'b-1', wallet_flags: ['LEDGER_MISMATCH'],
      wallet_check: { ...WALLET_OK, ledger_balance: 21380, ledger_matches: false } });
    const api = await admin(page, baseURL ?? '');
    api
      .get(/\/api\/v1\/admin\/payouts\/batches\/b-1$/, detail({ wallet_issue_count: 1 }, FLOAT, [mismatch]))
      .on('POST', /\/api\/v1\/admin\/payouts\/batches\/b-1\/approve$/, batch({ status: 'RELEASED' }));
    await api.install(page);

    await page.goto('/dashboard/admin/payouts/batches/b-1');
    await expect(page.getByText('1 of 1 row has wallet issues')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: 'WD-2026-000001' });
    await expect(row).toContainText('Ledger mismatch');
    await page.getByRole('button', { name: 'Approve and pay' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('list', { name: 'Wallet issues' })).toContainText('Ledger mismatch');
    const confirm = dialog.getByRole('button', { name: 'Approve and pay' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel(/I’ve checked these wallets/).click();
    await confirm.click();

    await expect.poll(() => api.callsTo('POST', /\/batches\/b-1\/approve$/)[0]?.body).toEqual({
      override_unknown_float: false, acknowledge_wallet_issues: true,
    });
  });

  test('shows the server’s reason when approval is refused', async ({ page, baseURL }) => {
    const api = await admin(page, baseURL ?? '');
    api
      .get(/\/api\/v1\/admin\/payouts\/batches\/b-1$/, detail())
      .on('POST', /\/api\/v1\/admin\/payouts\/batches\/b-1\/approve$/, httpError(409, 'The payout float is below this batch’s total.'));
    await api.install(page);

    await page.goto('/dashboard/admin/payouts/batches/b-1');
    await expect(page.getByText(/Enough float/).first()).toBeVisible();
    await expect(page.getByText('The wallet covers its withdrawal · ledger matches')).toBeVisible();
    await page.getByRole('button', { name: 'Approve and pay' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Approve and pay' }).click();

    await expect(page.getByText('The payout float is below this batch’s total.')).toBeVisible();
  });
});
