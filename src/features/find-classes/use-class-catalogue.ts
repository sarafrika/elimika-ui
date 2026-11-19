'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import type { GetAllClassDefinitionsData, ScheduledInstance } from '@/services/client';
import {
  getAllClassDefinitionsOptions,
  getClassDefinitionsForInstructorOptions,
  getClassDefinitionsForOrganisationOptions,
  getClassSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassShareScope } from './class-share';

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
    shareScope,
  }: { enabled?: boolean; includeSchedules?: boolean; shareScope?: ClassShareScope } = {}
) {
  const shared = useQueries({
    queries: (shareScope?.uuid ? [shareScope] : []).slice(0, 1).map(scope => ({
      ...(scope.kind === 'organisation'
        ? getClassDefinitionsForOrganisationOptions({
            path: { organisationUuid: scope.uuid },
          })
        : getClassDefinitionsForInstructorOptions({
            path: { instructorUuid: scope.uuid },
            query: { activeOnly: false },
          })),
      enabled,
      staleTime: STALE_TIMES.live,
    })),
    combine: results => ({
      response: results[0]?.data,
      pending: results.some(result => result.isPending),
      fetching: results.some(result => result.isFetching),
      success: results[0]?.isSuccess ?? false,
      error: results[0]?.error,
      refetch: () => Promise.all(results.map(result => result.refetch())),
    }),
  });
  const first = useQuery({
    ...getAllClassDefinitionsOptions({
      query: { ...query, pageable: { page: 0, size: BATCH_SIZE } },
    }),
    enabled: enabled && !shareScope,
    staleTime: STALE_TIMES.live,
  });
  const firstResponseFailed = Boolean(
    !shareScope && (first.data?.error || first.data?.success === false)
  );
  const firstPage = shareScope || firstResponseFailed ? undefined : first.data?.data;
  const pageCount = firstPage?.metadata?.totalPages ?? 1;
  const tooLarge =
    pageCount > MAX_PAGES ||
    Boolean(
      shareScope &&
        !shared.response?.error &&
        shared.response?.success !== false &&
        (shared.response?.data?.length ?? 0) > BATCH_SIZE * MAX_PAGES
    );
  const remaining = useQueries({
    queries: Array.from({ length: tooLarge ? 0 : Math.max(0, pageCount - 1) }, (_, index) => ({
      ...getAllClassDefinitionsOptions({
        query: { ...query, pageable: { page: index + 1, size: BATCH_SIZE } },
      }),
      enabled: enabled && !shareScope && first.isSuccess && !firstResponseFailed,
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
  const responseError = shareScope
    ? shared.response?.error || shared.response?.success === false
      ? shared.response
      : undefined
    : pages.find(page => page?.error || page?.success === false);
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const listings = shareScope
      ? shared.response?.error || shared.response?.success === false
        ? []
        : (shared.response?.data ?? [])
      : pages.flatMap(page =>
          page?.error || page?.success === false ? [] : (page?.data?.content ?? [])
        );
    return listings.filter(row => {
      const uuid = row.class_definition?.uuid;
      if (!uuid || seen.has(uuid)) return false;
      seen.add(uuid);
      return true;
    });
  }, [pages, shareScope, shared.response]);
  const listingSuccess = shareScope ? shared.success : first.isSuccess;
  const listingPending = shareScope ? shared.pending : first.isPending || remaining.pending;
  const listingError = shareScope ? shared.error : (first.error ?? remaining.error);
  const listingsReady =
    listingSuccess && !listingPending && !listingError && !tooLarge && !responseError;
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
    listingError ??
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
    isLoading: enabled && !error && (listingPending || schedules.pending),
    isFetching:
      (shareScope ? shared.fetching : first.isFetching || remaining.fetching) || schedules.fetching,
    refetch: () =>
      Promise.all([
        shareScope ? shared.refetch() : Promise.all([first.refetch(), remaining.refetch()]),
        schedules.refetch(),
      ]),
  };
}
