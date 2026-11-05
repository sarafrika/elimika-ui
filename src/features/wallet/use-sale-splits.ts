'use client';

/**
 * The order-split and purse endpoints, which postdate the last client regeneration:
 *
 *   GET  /api/v1/wallets/{userUuid}/sales?purse=&page=&size=      → paged SaleSplit
 *   GET  /api/v1/wallets/{userUuid}/sales/{splitUuid}             → SaleSplit
 *   GET  /api/v1/organisations/{organisationUuid}/wallet/sales    → paged SaleSplit
 *   GET  /api/v1/organisations/{organisationUuid}/wallet/sales/{splitUuid}
 *   POST /api/v1/wallets/{userUuid}/purse-transfers               move between own purses
 *
 * They are called through `client` against the hand-written types in `./sale-splits` and
 * `./purses`, like `src/features/admin/hooks/use-payout-batches.ts`. Swap in the generated
 * options once `pnpm openapi-ts` has them.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiMessage } from '@/components/wallet/payout-api';
import { scopeReady, type WalletScope } from '@/components/wallet/wallet-scope';
import { STALE_TIMES } from '@/lib/query-client';
import { client } from '@/services/client/client.gen';
import type { Purse } from './purses';
import { type SaleSplit, WALLET_SALES_KEY } from './sale-splits';

const BEARER = [{ scheme: 'bearer', type: 'http' }] as const;
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const PAGE_SIZE = 25;

type Envelope<T> = { 200: { success?: boolean; data?: T; message?: string; error?: unknown } };

interface Paged<T> {
  content?: T[];
  metadata?: { totalElements?: number | string; totalPages?: number; hasNext?: boolean };
}

export const saleSplitKeys = {
  list: (scope: WalletScope) => [WALLET_SALES_KEY, 'list', scopeKey(scope)] as const,
  detail: (scope: WalletScope, splitUuid: string) => [WALLET_SALES_KEY, 'detail', scopeKey(scope), splitUuid] as const,
};

function scopeKey(scope: WalletScope) {
  return scope.kind === 'user'
    ? { user: scope.userUuid, purse: scope.purse ?? null }
    : { organisation: scope.organisationUuid, purse: scope.purse ?? null };
}

function salesUrl(scope: WalletScope, splitUuid?: string) {
  const base = scope.kind === 'user' ? '/api/v1/wallets/{userUuid}/sales' : '/api/v1/organisations/{organisationUuid}/wallet/sales';
  return splitUuid ? `${base}/{splitUuid}` : base;
}

function salesPath(scope: WalletScope, splitUuid?: string): Record<string, string> {
  const owner: Record<string, string> =
    scope.kind === 'user' ? { userUuid: scope.userUuid } : { organisationUuid: scope.organisationUuid };
  return splitUuid ? { ...owner, splitUuid } : owner;
}

/** The scope's sold lines, newest first, for its purse. */
export function useSaleSplits(scope: WalletScope, enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey: saleSplitKeys.list(scope),
    queryFn: async ({ pageParam, signal }): Promise<Paged<SaleSplit>> => {
      const { data, error } = await client.get<Envelope<Paged<SaleSplit>>>({
        url: salesUrl(scope),
        path: salesPath(scope),
        query: { ...(scope.purse ? { purse: scope.purse } : {}), page: pageParam, size: PAGE_SIZE },
        security: BEARER,
        signal,
      });
      if (error) throw error;
      return data?.data ?? {};
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      (last.metadata?.hasNext ?? (last.content?.length ?? 0) === PAGE_SIZE) ? pages.length : undefined,
    enabled: enabled && scopeReady(scope),
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const rows: SaleSplit[] = (query.data?.pages ?? []).flatMap(page => page.content ?? []);
  return {
    rows,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}

/** One sold line's split; paints from the list row while the detail loads. */
export function useSaleSplit(scope: WalletScope, splitUuid: string | null, initial?: SaleSplit) {
  return useQuery({
    queryKey: saleSplitKeys.detail(scope, splitUuid ?? ''),
    queryFn: async ({ signal }): Promise<SaleSplit | null> => {
      const { data, error } = await client.get<Envelope<SaleSplit>>({
        url: salesUrl(scope, splitUuid ?? ''),
        path: salesPath(scope, splitUuid ?? ''),
        query: scope.purse ? { purse: scope.purse } : undefined,
        security: BEARER,
        signal,
      });
      if (error) throw error;
      return data?.data ?? null;
    },
    placeholderData: initial,
    enabled: Boolean(splitUuid) && scopeReady(scope),
    staleTime: STALE_TIMES.live,
    retry: false,
  });
}

export interface PurseTransferBody {
  from_purse: Purse;
  to_purse: Purse;
  amount: number;
  currency_code?: string;
  reference?: string;
  description?: string;
}

export interface PurseTransferResult {
  transfer_reference?: string;
  amount?: number | string;
  currency_code?: string;
  from_wallet?: unknown;
  to_wallet?: unknown;
}

/** Moves money between the person's own purses; returns the server's message when refused. */
export async function movePurseMoney(
  userUuid: string,
  body: PurseTransferBody
): Promise<{ data?: PurseTransferResult; error?: string }> {
  const { data, error } = await client.post<Envelope<PurseTransferResult>>({
    url: '/api/v1/wallets/{userUuid}/purse-transfers',
    path: { userUuid },
    body,
    headers: JSON_HEADERS,
    security: BEARER,
  });
  if (error) return { error: apiMessage(error, 'Could not move the money.') };
  return { data: data?.data };
}
