import type { Page } from '@playwright/test';
import { MockApi, paged } from '../support/api';
import { type E2eRole, signIn } from '../support/session';

export const USER = '00000000-0000-4000-8000-000000000001';
export const ORG = '00000000-0000-4000-8000-0000000000f1';
export const COURSE = '00000000-0000-4000-8000-0000000000c1';
export const CLASS = '00000000-0000-4000-8000-0000000000d1';
export const INSTRUCTOR = '00000000-0000-4000-8000-0000000000e1';
export const CHILD_A = '00000000-0000-4000-8000-0000000000a1';
export const CHILD_B = '00000000-0000-4000-8000-0000000000a2';

/** A class sale share and the platform fee charged on it, newest first, as the API returns them. */
export const shareWithFee = (balanceAfter: number, share: number, fee: number, title: string) => [
  { uuid: 'fee-1', transaction_type: 'PLATFORM_FEE', amount: fee, currency_code: 'KES', balance_after: balanceAfter,
    reference: 'order-31:line-1:delivery:fee', description: `Platform fee - Class sale share - ${title}`, created_date: '2026-10-20T11:05:00Z' },
  { uuid: 'sale-1', transaction_type: 'SALE', amount: share, currency_code: 'KES', balance_after: balanceAfter + fee,
    reference: 'order-31:line-1:delivery', description: `Class sale share - ${title}`, created_date: '2026-10-20T11:05:00Z' },
];

export const order = (id: string, displayId: string, status: string, total: number, title: string, createdAt: string, studentUuid?: string) => ({
  id, display_id: displayId, payment_status: status, currency_code: 'KES', subtotal: total, total, created_at: createdAt,
  items: [{ id: `${id}-line`, title, quantity: 1, total, metadata: studentUuid ? { student_uuid: studentUuid } : {} }],
});

/** Signs in as `role`, installs the shell mocks every dashboard page needs, and returns the API to extend. */
export async function signedInAs(page: Page, role: E2eRole, baseURL: string, wallet = 0) {
  const organisation = role === 'organisation_user';
  await signIn(page.context(), { uuid: USER, name: 'Amina Wanjiru', email: 'amina@e2e.test', domains: [role],
    organisationUuid: organisation ? ORG : undefined }, baseURL);
  const user = {
    uuid: USER, first_name: 'Amina', last_name: 'Wanjiru', email: 'amina@e2e.test', user_domain: [role], active: true,
    organisation_affiliations: organisation ? [{ organisation_uuid: ORG, organisation_name: 'Eldoret Institute', active: true, admin_verified: true }] : [],
  };
  const api = new MockApi()
    .get(/\/api\/v1\/users\/me$/, user)
    .get(/\/api\/v1\/me\/bootstrap$/, { user, profiles: {}, active_organisation: organisation ? { uuid: ORG, name: 'Eldoret Institute' } : null,
      wallet: { currency_code: 'KES', balance_amount: wallet }, notifications: null })
    .get(/\/api\/v1\/instructors\/search/, paged([{ uuid: INSTRUCTOR, user_uuid: USER, full_name: 'C. Chebet', admin_verified: true }]))
    .get(/\/api\/v1\/course-creators\/search/, paged([{ uuid: 'cc-1', user_uuid: USER, full_name: 'Amina Wanjiru', admin_verified: true }]))
    .get(/\/api\/v1\/organisations\/[^/]+$/, { uuid: ORG, name: 'Eldoret Institute', admin_verified: true })
    .get(/\/api\/v1\/organisations\/search/, paged([{ uuid: ORG, name: 'Eldoret Institute', admin_verified: true }]))
    .get(/\/api\/v1\/wallets\/[^/]+$/, { uuid: 'w1', user_uuid: USER, owner_type: 'USER', owner_uuid: USER, currency_code: 'KES', balance_amount: wallet });
  return api;
}
