'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import type { GetAllClassDefinitionsData, ScheduledInstance } from '@/services/client';
import {
  getAllClassDefinitionsOptions,
  getClassSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';

// Bound the fallback to twelve requests including visible-card enrichment. A backend
// summary/view endpoint is needed for larger catalogues; never truncate their counts.
const BATCH_SIZE = 100;
const MAX_PAGES = 5;

type CatalogueQuery = Omit<GetAllClassDefinitionsData['query'], 'pageable'> & {
  searchParams?: Record<string, string>;
};

/** Load a complete, bounded catalogue so status filtering precedes UI pagination. */
export function useClassCatalogue(
  query: CatalogueQuery,
  {
    enabled = true,
    includeSchedules = true,
  }: { enabled?: boolean; includeSchedules?: boolean } = {}
) {
  const first = useQuery({
    ...getAllClassDefinitionsOptions({
      query: { ...query, pageable: { page: 0, size: BATCH_SIZE } },
    }),
    enabled,
    staleTime: STALE_TIMES.live,
  });
  const firstResponseFailed = Boolean(first.data?.error || first.data?.success === false);
  const firstPage = firstResponseFailed ? undefined : first.data?.data;
  const pageCount = firstPage?.metadata?.totalPages ?? 1;
  const tooLarge = pageCount > MAX_PAGES;
  const remaining = useQueries({
    queries: Array.from({ length: tooLarge ? 0 : Math.max(0, pageCount - 1) }, (_, index) => ({
      ...getAllClassDefinitionsOptions({
        query: { ...query, pageable: { page: index + 1, size: BATCH_SIZE } },
      }),
      enabled: enabled && first.isSuccess && !firstResponseFailed,
      staleTime: STALE_TIMES.live,
    })),
    combine: results => ({
      pages: results.map(result => result.data),
      pending: results.some(result => result.isPending),
      fetching: results.some(result => result.isFetching),
      error: results.find(result => result.error)?.error,
      refetch: () => Promise.all(results.map(result => result.refetch())),
    }),
  });
  const pages = useMemo(() => [first.data, ...remaining.pages], [first.data, remaining.pages]);
  const responseError = pages.find(page => page?.error || page?.success === false);
  const rows = useMemo(() => {
    const seen = new Set<string>();
    return pages
      .flatMap(page => (page?.error || page?.success === false ? [] : (page?.data?.content ?? [])))
      .filter(row => {
        const uuid = row.class_definition?.uuid;
        if (!uuid || seen.has(uuid)) return false;
        seen.add(uuid);
        return true;
      });
  }, [pages]);
  const listingsReady =
    first.isSuccess && !remaining.pending && !remaining.error && !tooLarge && !responseError;
  const batches = useMemo(() => {
    if (!enabled || !includeSchedules || !listingsReady) return [];
    const ids = rows.flatMap(row =>
      row.class_definition?.uuid ? [row.class_definition.uuid] : []
    );
    return Array.from({ length: Math.ceil(ids.length / BATCH_SIZE) }, (_, index) =>
      ids.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE)
    );
  }, [enabled, includeSchedules, listingsReady, rows]);
  const schedules = useQueries({
    queries: batches.slice(0, MAX_PAGES).map(ids => ({
      ...getClassSchedulesOptions({ query: { class_uuids: ids } }),
      staleTime: STALE_TIMES.live,
    })),
    combine: results => ({
      responses: results.map(result => result.data),
      pending: results.some(result => result.isPending),
      fetching: results.some(result => result.isFetching),
      error: results.find(result => result.error)?.error,
      refetch: () => Promise.all(results.map(result => result.refetch())),
    }),
  });
  const scheduleError = schedules.responses.find(
    response => response?.error || response?.success === false
  );
  const sessionsByClass = useMemo(() => {
    const map: Record<string, ScheduledInstance[]> = {};
    for (const response of schedules.responses) {
      if (response?.error || response?.success === false) continue;
      for (const session of response?.data ?? []) {
        const uuid = session.class_definition_uuid;
        if (uuid) (map[uuid] ??= []).push(session);
      }
    }
    return map;
  }, [schedules.responses]);
  const error =
    first.error ??
    remaining.error ??
    schedules.error ??
    (responseError ? new Error(responseError.message || 'Could not load classes.') : null) ??
    (scheduleError
      ? new Error(scheduleError.message || 'Could not load class schedules.')
      : null) ??
    (tooLarge
      ? new Error(
          'Too many classes to calculate status totals. Narrow your search or select a course.'
        )
      : null);

  return {
    rows,
    sessionsByClass,
    error,
    isError: Boolean(error),
    isLoading: enabled && !error && (first.isPending || remaining.pending || schedules.pending),
    isFetching: first.isFetching || remaining.fetching || schedules.fetching,
    refetch: () => Promise.all([first.refetch(), remaining.refetch(), schedules.refetch()]),
  };
}
