import { QueryClient } from '@tanstack/react-query';

/**
 * staleTime tiers. Pick the slowest tier the data can tolerate — every tier
 * step down multiplies refetch traffic across the app.
 */
export const STALE_TIMES = {
  /** Reference data that rarely changes: categories, difficulty levels, course catalog. */
  reference: 1000 * 60 * 30,
  /** Entity data edited by its owner: profiles, course details. */
  entity: 1000 * 60 * 5,
  /** Live operational data: enrollments, schedules, notifications. */
  live: 1000 * 60,
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
