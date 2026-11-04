'use client';

/**
 * The admin payout-batch endpoints, all under /api/v1/admin/payouts.
 *
 *   GET    /batches?status=                        → paged PayoutBatch
 *   POST   /batches                                → PayoutBatch (DRAFT)
 *   GET    /batches/{batchUuid}                    → PayoutBatchDetail
 *   POST   /batches/{batchUuid}/withdrawals        add rows
 *   DELETE /batches/{batchUuid}/withdrawals/{uuid} remove a row
 *   POST   /batches/{batchUuid}/submit|approve|reject|return-to-draft|cancel
 *
 * They postdate the last client regeneration, so they are called through `client`
 * against the hand-written types in `../lib/payout-batches`, like
 * `src/features/course-record/use-course-metrics.ts`. Swap in the generated options
 * once `pnpm openapi-ts` has them.
 */

import { type QueryClient, useQuery } from '@tanstack/react-query';
import { apiMessage } from '@/components/wallet/payout-api';
import { client } from '@/services/client/client.gen';
import { listAdminWithdrawals } from '@/services/client/sdk.gen';
import { adminKeys } from '../lib/admin-keys';
import { listQuery, queueQuery } from '../lib/admin-queries';
import {
  isBatchLive,
  type BatchWithdrawal,
  type PayoutBatch,
  type PayoutBatchDetail,
} from '../lib/payout-batches';

const BEARER = [{ scheme: 'bearer', type: 'http' }] as const;
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const BASE = '/api/v1/admin/payouts/batches';
const LIVE_POLL_MS = 5_000;

type Envelope<T> = { 200: { success?: boolean; data?: T; message?: string; error?: unknown } };

export interface Paged<T> {
  content?: T[];
  metadata?: {
    totalElements?: number | string;
    totalPages?: number;
    pageNumber?: number;
    hasNext?: boolean;
  };
}

/** One page of batches in the given statuses. */
export function usePayoutBatches(statuses: string[], page: number, size: number, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.payoutBatchList({ statuses, page, size }),
    queryFn: async ({ signal }): Promise<Paged<PayoutBatch>> => {
      const { data, error } = await client.get<Envelope<Paged<PayoutBatch>>>({
        url: BASE,
        query: { status: statuses, pageable: { page, size } },
        security: BEARER,
        signal,
      });
      if (error) throw error;
      return data?.data ?? {};
    },
    enabled,
    ...queueQuery,
  });
}

/** One batch with its rows and the payout float; polls while money is moving. */
export function usePayoutBatch(batchUuid: string | undefined) {
  return useQuery({
    queryKey: adminKeys.payoutBatch(batchUuid ?? ''),
    queryFn: async ({ signal }): Promise<PayoutBatchDetail | undefined> => {
      const { data, error } = await client.get<Envelope<PayoutBatchDetail>>({
        url: `${BASE}/{batchUuid}`,
        path: { batchUuid: batchUuid ?? '' },
        security: BEARER,
        signal,
      });
      if (error) throw error;
      return data?.data;
    },
    enabled: Boolean(batchUuid),
    refetchInterval: query => (isBatchLive(query.state.data) ? LIVE_POLL_MS : false),
    ...listQuery,
  });
}

interface Result<T> {
  data?: T;
  error?: string;
}

async function send<T>(
  method: 'post' | 'delete',
  url: string,
  path: Record<string, string>,
  body: unknown,
  fallback: string
): Promise<Result<T>> {
  const { data, error } = await client[method]<Envelope<T>>({
    url,
    path,
    ...(body === undefined ? {} : { body, headers: JSON_HEADERS }),
    security: BEARER,
  });
  if (error) return { error: apiMessage(error, fallback) };
  return { data: data?.data };
}

/** Every batch change, each returning the server's message when refused. */
export const payoutBatchActions = {
  create: (withdrawalUuids: string[]) =>
    send<PayoutBatch>(
      'post',
      BASE,
      {},
      { withdrawal_uuids: withdrawalUuids },
      'Could not create the batch.'
    ),
  addRows: (batchUuid: string, withdrawalUuids: string[]) =>
    send<PayoutBatchDetail>(
      'post',
      `${BASE}/{batchUuid}/withdrawals`,
      { batchUuid },
      { withdrawal_uuids: withdrawalUuids },
      'Could not add those withdrawals.'
    ),
  removeRow: (batchUuid: string, withdrawalUuid: string) =>
    send<PayoutBatchDetail>(
      'delete',
      `${BASE}/{batchUuid}/withdrawals/{withdrawalUuid}`,
      { batchUuid, withdrawalUuid },
      undefined,
      'Could not remove that withdrawal.'
    ),
  submit: (batchUuid: string) =>
    send<PayoutBatch>(
      'post',
      `${BASE}/{batchUuid}/submit`,
      { batchUuid },
      undefined,
      'Could not submit the batch.'
    ),
  approve: (batchUuid: string, overrideUnknownFloat: boolean) =>
    send<PayoutBatch>(
      'post',
      `${BASE}/{batchUuid}/approve`,
      { batchUuid },
      { override_unknown_float: overrideUnknownFloat },
      'Could not approve the batch.'
    ),
  reject: (batchUuid: string, reason: string) =>
    send<PayoutBatch>(
      'post',
      `${BASE}/{batchUuid}/reject`,
      { batchUuid },
      { reason },
      'Could not reject the batch.'
    ),
  returnToDraft: (batchUuid: string) =>
    send<PayoutBatch>(
      'post',
      `${BASE}/{batchUuid}/return-to-draft`,
      { batchUuid },
      undefined,
      'Could not return the batch to draft.'
    ),
  cancel: (batchUuid: string) =>
    send<PayoutBatch>(
      'post',
      `${BASE}/{batchUuid}/cancel`,
      { batchUuid },
      undefined,
      'Could not cancel the batch.'
    ),
};

/** Most rows "select all matching" will gather; a batch larger than this is built in parts. */
export const SELECT_ALL_LIMIT = 1_000;
const SELECT_ALL_PAGE = 100;

/**
 * Every withdrawal waiting for a batch, for "select all matching". Runs only when the
 * admin asks, a page at a time, and stops at SELECT_ALL_LIMIT.
 */
export async function fetchAllUnbatched(): Promise<Result<BatchWithdrawal[]>> {
  const rows: BatchWithdrawal[] = [];
  for (let page = 0; rows.length < SELECT_ALL_LIMIT; page += 1) {
    const { data, error } = await listAdminWithdrawals({
      query: {
        status: ['NEEDS_REVIEW'],
        unbatched: true,
        pageable: { page, size: SELECT_ALL_PAGE },
      } as never,
    });
    if (error) return { error: apiMessage(error, 'Could not load every waiting withdrawal.') };
    const content = (data?.data?.content ?? []) as BatchWithdrawal[];
    rows.push(...content);
    const meta = data?.data?.metadata;
    const more =
      meta?.hasNext ??
      (meta?.totalPages !== undefined ? page + 1 < Number(meta.totalPages) : false);
    if (!more || content.length === 0) break;
  }
  return { data: rows.slice(0, SELECT_ALL_LIMIT) };
}

const PAYOUT_QUERY_IDS = new Set(['getPayoutSummary', 'listAdminWithdrawals', 'getPayoutSettings']);

/** Refresh every payout read after a withdrawal or batch decision. */
export function invalidatePayouts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({
      predicate: query =>
        PAYOUT_QUERY_IDS.has(String((query.queryKey[0] as { _id?: string } | undefined)?._id)),
    }),
    queryClient.invalidateQueries({ queryKey: adminKeys.payoutBatches() }),
  ]);
}
