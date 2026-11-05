'use client';

/**
 * How a sold line was split, for admins:
 *
 *   GET /api/v1/admin/sales/orders/{orderId}/splits → SaleSplit[] (one per line)
 *   GET /api/v1/admin/sales/splits/{splitUuid}      → SaleSplit
 *
 * They postdate the last client regeneration, so they are called through `client` against
 * the hand-written types in `src/features/wallet/sale-splits`, like `./use-payout-batches`.
 * Swap in the generated options once `pnpm openapi-ts` has them.
 */

import { useQuery } from '@tanstack/react-query';
import { client } from '@/services/client/client.gen';
import type { SaleSplit } from '@/src/features/wallet/sale-splits';
import { adminKeys } from '../lib/admin-keys';
import { listQuery } from '../lib/admin-queries';

const BEARER = [{ scheme: 'bearer', type: 'http' }] as const;

type Envelope<T> = { 200: { success?: boolean; data?: T; message?: string; error?: unknown } };

/** Every line's split on one order. */
export function useAdminOrderSplits(orderId: string | undefined) {
  return useQuery({
    queryKey: adminKeys.orderSplits(orderId ?? ''),
    queryFn: async ({ signal }): Promise<SaleSplit[]> => {
      const { data, error } = await client.get<Envelope<SaleSplit[] | { content?: SaleSplit[] }>>({
        url: '/api/v1/admin/sales/orders/{orderId}/splits',
        path: { orderId: orderId ?? '' },
        security: BEARER,
        signal,
      });
      if (error) throw error;
      const body = data?.data;
      return Array.isArray(body) ? body : (body?.content ?? []);
    },
    enabled: Boolean(orderId),
    ...listQuery,
  });
}

/** One split, opened from a wallet ledger row. */
export function useAdminSaleSplit(splitUuid: string | null) {
  return useQuery({
    queryKey: adminKeys.saleSplit(splitUuid ?? ''),
    queryFn: async ({ signal }): Promise<SaleSplit | null> => {
      const { data, error } = await client.get<Envelope<SaleSplit>>({
        url: '/api/v1/admin/sales/splits/{splitUuid}',
        path: { splitUuid: splitUuid ?? '' },
        security: BEARER,
        signal,
      });
      if (error) throw error;
      return data?.data ?? null;
    },
    enabled: Boolean(splitUuid),
    ...listQuery,
  });
}
