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

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: STALE_TIMES.entity,
      },
    },
  });
}
