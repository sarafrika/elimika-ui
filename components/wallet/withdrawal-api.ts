'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getPayoutRulesOptions,
  listOrganisationWithdrawalsInfiniteOptions,
  listWithdrawalsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  approveOrganisationWithdrawal,
  cancelOrganisationWithdrawal,
  cancelWithdrawal,
  confirmOrganisationWithdrawal,
  confirmWithdrawal,
  getOrganisationWithdrawal,
  getWithdrawal,
  requestOrganisationWithdrawal,
  requestWithdrawal,
  resendOrganisationWithdrawalCode,
  resendWithdrawalCode,
} from '@/services/client/sdk.gen';
import type { PayoutRules, VerificationCode, Withdrawal } from '@/services/client/types.gen';
import { apiMessage } from './payout-api';
import { scopeReady, type WalletScope } from './wallet-scope';

export const WITHDRAWAL_QUERY_IDS = ['listWithdrawals', 'listOrganisationWithdrawals'];
const PAGE_SIZE = 25;

export const WITHDRAWAL_STATUS: Record<string, { label: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'muted' }> =
  {
    AWAITING_CONFIRMATION: { label: 'Waiting for code', tone: 'muted' },
    AWAITING_SECOND_APPROVAL: { label: 'Needs a second approver', tone: 'warning' },
    NEEDS_REVIEW: { label: 'Waiting for Elimika', tone: 'warning' },
    SENDING: { label: 'Sending', tone: 'info' },
    PROCESSING: { label: 'With M-Pesa', tone: 'info' },
    PAID: { label: 'Paid', tone: 'success' },
    FAILED: { label: 'Failed · returned', tone: 'danger' },
    REJECTED: { label: 'Not approved · returned', tone: 'danger' },
    CANCELLED: { label: 'Cancelled', tone: 'muted' },
    EXPIRED: { label: 'Expired', tone: 'muted' },
  };

export const REVIEW_FLAG_LABELS: Record<string, string> = {
  ABOVE_REVIEW_LIMIT: 'Above the review limit',
  FIRST_PAYOUT_TO_NUMBER: 'First payout to this number',
  NAME_MISMATCH: 'M-Pesa name did not match',
};

export const IN_FLIGHT = new Set(['SENDING', 'PROCESSING']);
export const WAITING = new Set(['AWAITING_SECOND_APPROVAL', 'NEEDS_REVIEW']);

/** Limits, the M-Pesa charge and the new-number hold. */
export function usePayoutRules(enabled: boolean) {
  const query = useQuery({ ...getPayoutRulesOptions(), enabled, staleTime: 5 * 60 * 1000 });
  const rules: PayoutRules | undefined = query.data?.data;
  return { rules, isLoading: query.isLoading };
}

/** The scope's withdrawals, newest first, optionally filtered by status. */
export function useWithdrawals(scope: WalletScope, statuses: string[] | undefined, enabled: boolean) {
  const query = { status: statuses?.length ? statuses : undefined, pageable: { page: 0, size: PAGE_SIZE } } as never;
  const ready = enabled && scopeReady(scope);
  const next = (last: { data?: { content?: unknown[]; metadata?: { hasNext?: boolean } } }, pages: unknown[]) =>
    (last.data?.metadata?.hasNext ?? (last.data?.content?.length ?? 0) === PAGE_SIZE) ? pages.length : undefined;
  const user = useInfiniteQuery({
    ...listWithdrawalsInfiniteOptions({ path: { userUuid: scope.kind === 'user' ? scope.userUuid : '' }, query }),
    initialPageParam: 0,
    getNextPageParam: next,
    enabled: ready && scope.kind === 'user',
  });
  const org = useInfiniteQuery({
    ...listOrganisationWithdrawalsInfiniteOptions({
      path: { organisationUuid: scope.kind === 'organisation' ? scope.organisationUuid : '' },
      query,
    }),
    initialPageParam: 0,
    getNextPageParam: next,
    enabled: ready && scope.kind === 'organisation',
  });
  const active = scope.kind === 'user' ? user : org;
  const rows: Withdrawal[] = (active.data?.pages ?? []).flatMap(page => page.data?.content ?? []);
  return {
    rows,
    isLoading: active.isLoading,
    isError: active.isError,
    hasNextPage: active.hasNextPage,
    isFetchingNextPage: active.isFetchingNextPage,
    fetchNextPage: () => void active.fetchNextPage(),
    refetch: () => void active.refetch(),
  };
}

interface Result<T> {
  data?: T;
  error?: string;
}

async function unwrap<T>(call: Promise<{ data?: unknown; error?: unknown }>, fallback: string): Promise<Result<T>> {
  const { data, error } = await call;
  if (error) return { error: apiMessage(error, fallback) };
  return { data: (data as { data?: T } | undefined)?.data };
}

/** Every withdrawal step for the scope; each returns the server's own message when refused. */
export function withdrawalActions(scope: WalletScope) {
  const user = scope.kind === 'user' ? { userUuid: scope.userUuid } : null;
  const org = scope.kind === 'organisation' ? { organisationUuid: scope.organisationUuid } : null;
  return {
    request: (body: { amount: number; payout_method_uuid: string; idempotency_key: string }) =>
      unwrap<{ withdrawal?: Withdrawal; verification?: VerificationCode }>(
        user ? requestWithdrawal({ path: user, body }) : requestOrganisationWithdrawal({ path: org!, body }),
        'Could not start the withdrawal.'
      ),
    resend: (withdrawalUuid: string) =>
      unwrap<VerificationCode>(
        user
          ? resendWithdrawalCode({ path: { ...user, withdrawalUuid } })
          : resendOrganisationWithdrawalCode({ path: { ...org!, withdrawalUuid } }),
        'Could not send a new code.'
      ),
    confirm: (withdrawalUuid: string, code: string) =>
      unwrap<Withdrawal>(
        user
          ? confirmWithdrawal({ path: { ...user, withdrawalUuid }, body: { code } })
          : confirmOrganisationWithdrawal({ path: { ...org!, withdrawalUuid }, body: { code } }),
        'Could not confirm the withdrawal.'
      ),
    get: (withdrawalUuid: string) =>
      unwrap<Withdrawal>(
        user
          ? getWithdrawal({ path: { ...user, withdrawalUuid } })
          : getOrganisationWithdrawal({ path: { ...org!, withdrawalUuid } }),
        'Could not load the withdrawal.'
      ),
    cancel: (withdrawalUuid: string) =>
      unwrap<Withdrawal>(
        user
          ? cancelWithdrawal({ path: { ...user, withdrawalUuid } })
          : cancelOrganisationWithdrawal({ path: { ...org!, withdrawalUuid } }),
        'Could not cancel the withdrawal.'
      ),
    approve: (withdrawalUuid: string) =>
      org
        ? unwrap<Withdrawal>(
            approveOrganisationWithdrawal({ path: { ...org, withdrawalUuid } }),
            'Could not approve the withdrawal.'
          )
        : Promise.resolve<Result<Withdrawal>>({ error: 'Only organisation withdrawals need a second approver.' }),
  };
}
