import { QueryClient } from '@tanstack/react-query';

/**
 * staleTime tiers cap how long an answer is reused before the next mount refetches it
 * behind the paint — not how long it may be shown unasked. Pick the slowest tier that fits.
 */
export const STALE_TIMES = {
  /** Reference data that rarely changes: categories, difficulty levels, course catalog. */
  reference: 1000 * 60 * 30,
  /** Entity data edited by its owner: profiles, course details. */
  entity: 1000 * 60 * 5,
  /** Live operational data: enrollments, schedules, notifications. */
  live: 1000 * 60,
} as const;

/** Approval state changes on someone else's click; approval reads re-ask this often. */
export const APPROVAL_REFETCH_INTERVAL_MS = 5 * 60_000;

/** Spread into approval-related queries: the 5-minute poll plus a refetch on window focus. */
export const APPROVAL_QUERY_FRESHNESS = {
  refetchInterval: APPROVAL_REFETCH_INTERVAL_MS,
  refetchOnWindowFocus: true,
} as const;

export const CLIENT_QUERY_CACHE_STORAGE_KEY = 'elimika-query-cache-v1';
export const CLIENT_QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 30;
export const CLIENT_QUERY_CACHE_BUSTER = 'elimika-query-cache:2026-06-24';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: CLIENT_QUERY_CACHE_MAX_AGE_MS,
        staleTime: STALE_TIMES.entity,
      },
    },
  });
}
