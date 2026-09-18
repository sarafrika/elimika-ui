'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractPage } from '@/lib/api-helpers';
import type { AdminActivityEvent, AdminDashboardStats } from '@/services/client';
import {
  getDashboardActivityOptions,
  getDashboardStatisticsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { queueQuery } from '../lib/admin-queries';

/** How many activity rows Home shows before sending the admin to the full log. */
const ACTIVITY_PAGE_SIZE = 12;

/**
 * Platform counts behind Home. Treated as a queue: an admin watches these change while
 * deciding, so they revalidate on focus rather than sitting on a long cache.
 */
export function useAdminStatistics() {
  const query = useQuery({
    ...getDashboardStatisticsOptions(),
    ...queueQuery,
  });

  const statistics = useMemo(
    () => extractEntity<AdminDashboardStats>(query.data),
    [query.data]
  );

  return { statistics, query };
}

/** The most recent admin requests, newest first. */
export function useAdminActivity(limit: number = ACTIVITY_PAGE_SIZE) {
  const query = useQuery({
    ...getDashboardActivityOptions({ query: { pageable: { page: 0, size: limit } } }),
    ...queueQuery,
  });

  const events = useMemo(
    () => extractPage<AdminActivityEvent>(query.data).items,
    [query.data]
  );

  return { events, query };
}
