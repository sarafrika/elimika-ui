'use client';

import { useQuery } from '@tanstack/react-query';
import {
  listOrganisationPayoutMethodsOptions,
  listPayoutApproversOptions,
  listPayoutMethodsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  addOrganisationPayoutMethod,
  addPayoutApprover,
  addPayoutMethod,
  makeOrganisationPayoutMethodDefault,
  makePayoutMethodDefault,
  removeOrganisationPayoutMethod,
  removePayoutApprover,
  removePayoutMethod,
  resendOrganisationPayoutMethodCode,
  resendPayoutMethodCode,
  verifyOrganisationPayoutMethod,
  verifyPayoutMethod,
} from '@/services/client/sdk.gen';
import type { PayoutApprover, PayoutMethod, VerificationCode } from '@/services/client/types.gen';
import { scopeReady, type WalletScope } from './wallet-scope';

export const PAYOUT_QUERY_IDS = ['listPayoutMethods', 'listOrganisationPayoutMethods', 'listPayoutApprovers'];

/** The server's own words for a refusal, e.g. "That code is not right. 3 tries left." */
export function apiMessage(error: unknown, fallback: string) {
  const body = error as { message?: string; error?: { message?: string } | string; reason?: string } | undefined;
  if (typeof body?.error === 'string' && body.error) return body.error;
  if (typeof body?.error === 'object' && body.error?.message) return body.error.message;
  return body?.message || body?.reason || fallback;
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

/** The scope's payout numbers, default first. */
export function usePayoutMethods(scope: WalletScope, enabled: boolean) {
  const ready = enabled && scopeReady(scope);
  const user = useQuery({
    ...listPayoutMethodsOptions({ path: { userUuid: scope.kind === 'user' ? scope.userUuid : '' } }),
    enabled: ready && scope.kind === 'user',
  });
  const org = useQuery({
    ...listOrganisationPayoutMethodsOptions({
      path: { organisationUuid: scope.kind === 'organisation' ? scope.organisationUuid : '' },
    }),
    enabled: ready && scope.kind === 'organisation',
  });
  const active = scope.kind === 'user' ? user : org;
  const methods: PayoutMethod[] = active.data?.data ?? [];
  return { methods, isLoading: active.isLoading, isError: active.isError, refetch: active.refetch };
}

/** An organisation's payout approvers. */
export function usePayoutApprovers(organisationUuid: string, enabled: boolean) {
  const query = useQuery({
    ...listPayoutApproversOptions({ path: { organisationUuid } }),
    enabled: enabled && Boolean(organisationUuid),
  });
  const approvers: PayoutApprover[] = query.data?.data ?? [];
  return { approvers, isLoading: query.isLoading, refetch: query.refetch };
}

/** Every payout change for the scope, each returning the server's message when refused. */
export function payoutActions(scope: WalletScope) {
  const user = scope.kind === 'user' ? { userUuid: scope.userUuid } : null;
  const org = scope.kind === 'organisation' ? { organisationUuid: scope.organisationUuid } : null;
  return {
    add: (body: { msisdn: string; label?: string; confirms_registered_name: boolean }) =>
      unwrap<{ payout_method?: PayoutMethod; verification?: VerificationCode }>(
        user ? addPayoutMethod({ path: user, body }) : addOrganisationPayoutMethod({ path: org!, body }),
        'Could not add the number.'
      ),
    resend: (methodUuid: string) =>
      unwrap<VerificationCode>(
        user
          ? resendPayoutMethodCode({ path: { ...user, methodUuid } })
          : resendOrganisationPayoutMethodCode({ path: { ...org!, methodUuid } }),
        'Could not send a new code.'
      ),
    verify: (methodUuid: string, code: string) =>
      unwrap<PayoutMethod>(
        user
          ? verifyPayoutMethod({ path: { ...user, methodUuid }, body: { code } })
          : verifyOrganisationPayoutMethod({ path: { ...org!, methodUuid }, body: { code } }),
        'Could not verify the number.'
      ),
    makeDefault: (methodUuid: string) =>
      unwrap<PayoutMethod>(
        user
          ? makePayoutMethodDefault({ path: { ...user, methodUuid } })
          : makeOrganisationPayoutMethodDefault({ path: { ...org!, methodUuid } }),
        'Could not change the default.'
      ),
    remove: (methodUuid: string) =>
      unwrap<void>(
        user
          ? removePayoutMethod({ path: { ...user, methodUuid } })
          : removeOrganisationPayoutMethod({ path: { ...org!, methodUuid } }),
        'Could not remove the number.'
      ),
  };
}

export function approverActions(organisationUuid: string) {
  return {
    add: (userUuid: string) =>
      unwrap<PayoutApprover>(
        addPayoutApprover({ path: { organisationUuid }, body: { user_uuid: userUuid } }),
        'Could not add the approver.'
      ),
    remove: (userUuid: string) =>
      unwrap<void>(removePayoutApprover({ path: { organisationUuid, userUuid } }), 'Could not remove the approver.'),
  };
}
