'use client';

import { type QueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getOrganisationWalletOptions,
  getWalletOptions,
  listAuditInfiniteOptions,
  listOrganisationWalletAuditInfiniteOptions,
  listOrganisationWalletStatementsOptions,
  listOrganisationWalletTransactionsInfiniteOptions,
  listStatementsOptions,
  listTransactions1InfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { exportOrganisationWalletTransactions, exportTransactions } from '@/services/client/sdk.gen';
import type { WalletAuditEvent, WalletStatement, WalletTransaction } from '@/services/client/types.gen';

/** Whose wallet a page shows: the signed-in person's, or an organisation's for its managers. */
export type WalletScope = { kind: 'user'; userUuid: string } | { kind: 'organisation'; organisationUuid: string };

const PAGE_SIZE = 25;
const WALLET_QUERY_IDS = new Set([
  'getWallet',
  'getOrganisationWallet',
  'listTransactions1',
  'listOrganisationWalletTransactions',
  'listStatements',
  'listOrganisationWalletStatements',
  'listAudit',
  'listOrganisationWalletAudit',
]);

export const scopeReady = (scope: WalletScope) =>
  scope.kind === 'user' ? Boolean(scope.userUuid) : Boolean(scope.organisationUuid);

const userPath = (scope: WalletScope) => ({ userUuid: scope.kind === 'user' ? scope.userUuid : '' });
const orgPath = (scope: WalletScope) => ({
  organisationUuid: scope.kind === 'organisation' ? scope.organisationUuid : '',
});

/** The API takes plain ISO dates; the generated types say Date, so pass the string through. */
const isoDate = (value?: string) => value as unknown as Date | undefined;

export interface WalletFigures {
  currency: string;
  balance: number;
  held: number;
  available: number;
  canWithdraw: boolean;
  shares: number;
  fees: number;
  sales: number;
  transferredOut: number;
}

/** Balance, held, available and lifetime totals for the scope, read from the server. */
export function useWalletFigures(scope: WalletScope) {
  const enabled = scopeReady(scope);
  const user = useQuery({ ...getWalletOptions({ path: userPath(scope) }), enabled: enabled && scope.kind === 'user' });
  const org = useQuery({
    ...getOrganisationWalletOptions({ path: orgPath(scope) }),
    enabled: enabled && scope.kind === 'organisation',
  });
  const query = scope.kind === 'user' ? user : org;
  const data = query.data?.data;
  const n = (value: number | bigint | string | null | undefined) => Number(value ?? 0);
  const figures: WalletFigures | null = data
    ? {
        currency: data.currency_code ?? 'KES',
        balance: n(data.balance_amount),
        held: n(data.held_amount),
        available: n(data.available_amount ?? data.balance_amount),
        canWithdraw: Boolean(data.can_withdraw),
        shares: n(data.shares_total),
        fees: n(data.platform_fees_total),
        sales: n(data.sales_count),
        transferredOut: n(data.transferred_out_total),
      }
    : null;
  return { figures, isLoading: query.isLoading || !enabled, isError: query.isError, refetch: query.refetch };
}

interface PageLike<T> {
  data?: { content?: T[]; metadata?: { hasNext?: boolean; totalElements?: number | bigint } };
}

function nextPage<T>(last: PageLike<T>, pages: PageLike<T>[]) {
  const metadata = last.data?.metadata;
  const more = metadata?.hasNext ?? (last.data?.content?.length ?? 0) === PAGE_SIZE;
  return more ? pages.length : undefined;
}

/** Ledger rows newest first, filtered on the server so every page counts. */
export function useWalletTransactions(scope: WalletScope, types: string[] | undefined, enabled: boolean) {
  const query = { type: types?.length ? types : undefined, pageable: { page: 0, size: PAGE_SIZE } } as never;
  const ready = enabled && scopeReady(scope);
  const user = useInfiniteQuery({
    ...listTransactions1InfiniteOptions({ path: userPath(scope), query }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    enabled: ready && scope.kind === 'user',
  });
  const org = useInfiniteQuery({
    ...listOrganisationWalletTransactionsInfiniteOptions({ path: orgPath(scope), query }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    enabled: ready && scope.kind === 'organisation',
  });
  const active = scope.kind === 'user' ? user : org;
  const rows: WalletTransaction[] = (active.data?.pages ?? []).flatMap(page => page.data?.content ?? []);
  const total = Number(active.data?.pages.at(0)?.data?.metadata?.totalElements ?? rows.length);
  return { rows, total, ...pick(active) };
}

/** Monthly statements, newest month first. */
export function useWalletStatements(scope: WalletScope, enabled: boolean, months = 12) {
  const ready = enabled && scopeReady(scope);
  const user = useQuery({
    ...listStatementsOptions({ path: userPath(scope), query: { months } }),
    enabled: ready && scope.kind === 'user',
  });
  const org = useQuery({
    ...listOrganisationWalletStatementsOptions({ path: orgPath(scope), query: { months } }),
    enabled: ready && scope.kind === 'organisation',
  });
  const active = scope.kind === 'user' ? user : org;
  const statements: WalletStatement[] = active.data?.data ?? [];
  return { statements, isLoading: active.isLoading, isError: active.isError, refetch: active.refetch };
}

/** The append-only audit trail, newest first. */
export function useWalletAudit(scope: WalletScope, enabled: boolean) {
  const query = { pageable: { page: 0, size: PAGE_SIZE } } as never;
  const ready = enabled && scopeReady(scope);
  const user = useInfiniteQuery({
    ...listAuditInfiniteOptions({ path: userPath(scope), query }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    enabled: ready && scope.kind === 'user',
  });
  const org = useInfiniteQuery({
    ...listOrganisationWalletAuditInfiniteOptions({ path: orgPath(scope), query }),
    initialPageParam: 0,
    getNextPageParam: nextPage,
    enabled: ready && scope.kind === 'organisation',
  });
  const active = scope.kind === 'user' ? user : org;
  const events: WalletAuditEvent[] = (active.data?.pages ?? []).flatMap(page => page.data?.content ?? []);
  return { events, ...pick(active) };
}

function pick(query: {
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
}) {
  return {
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => void query.fetchNextPage(),
    refetch: () => void query.refetch(),
  };
}

/** Downloads every matching row as CSV from the server; returns false when it could not. */
export async function downloadWalletCsv(
  scope: WalletScope,
  filter: { types?: string[]; from?: string; to?: string },
  filename: string
): Promise<boolean> {
  const query = { type: filter.types?.length ? filter.types : undefined, from: isoDate(filter.from), to: isoDate(filter.to) } as never;
  const { data, error } =
    scope.kind === 'user'
      ? await exportTransactions({ path: userPath(scope), query, parseAs: 'text' })
      : await exportOrganisationWalletTransactions({ path: orgPath(scope), query, parseAs: 'text' });
  if (error || typeof data !== 'string') return false;
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

/** Refreshes every wallet figure and list after money moves. */
export function invalidateWallet(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: query => WALLET_QUERY_IDS.has(String((query.queryKey[0] as { _id?: string } | undefined)?._id)),
  });
}
