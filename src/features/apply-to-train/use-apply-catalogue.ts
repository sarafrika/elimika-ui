'use client';

import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { isForbidden, isSearchUnavailable, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { searchApplyToTrainCatalogueOptions } from '@/services/client/@tanstack/react-query.gen';
import { type CatalogueFilters, catalogueRequests, mergeCataloguePages } from './catalogue-model';

export { CATALOGUE_PAGE_SIZE, type CatalogueFilters, type CatalogueFit, type CatalogueShow } from './catalogue-model';

/** Two catalogue searches at most, with batched intro-video lookups scoped to the page. */
export function useApplyCatalogue(filters: CatalogueFilters, enabled = true) {
  const q = useDebouncedValue(filters.q.trim());
  const requests = catalogueRequests(filters, q);
  const query = useQueries({
    queries: requests.slice(0, 2).map(query => ({
      ...searchApplyToTrainCatalogueOptions({ query }),
      enabled,
      placeholderData: keepPreviousData,
      staleTime: STALE_TIMES.live,
      retry: retryUnlessClientOrSearchError,
    })),
    combine: results => {
      const failed = results.find(result => result.data?.error || result.data?.success === false);
      return {
        pages: results.flatMap(result =>
          result.data?.error || result.data?.success === false || !result.data?.data
            ? []
            : [result.data.data]
        ),
        isLoading: results.some(result => result.isLoading),
        isPlaceholderData: results.some(result => result.isPlaceholderData),
        error: results.find(result => result.error)?.error ?? (
          failed ? new Error(failed.data?.message || 'Could not load the catalogue.') : null
        ),
        refetch: () => Promise.all(results.map(result => result.refetch())),
      };
    },
  });
  const catalogue = useMemo(() => mergeCataloguePages(query.pages), [query.pages]);
  // Catalogue summaries omit intro videos. Resolve only the current page's items in batches.
  const courseIds = useMemo(
    () =>
      enabled
        ? catalogue.items.filter(item => item.kind === 'course').map(item => item.uuid)
        : [],
    [catalogue.items, enabled]
  );
  const programIds = useMemo(
    () =>
      enabled
        ? catalogue.items.filter(item => item.kind === 'program').map(item => item.uuid)
        : [],
    [catalogue.items, enabled]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);
  const items = useMemo(
    () =>
      catalogue.items.map(item => ({
        ...item,
        introVideoUrl:
          item.kind === 'program'
            ? programMap[item.uuid]?.intro_video_url ?? null
            : courseMap[item.uuid]?.intro_video_url ?? null,
      })),
    [catalogue.items, courseMap, programMap]
  );
  return {
    query,
    ...catalogue,
    items,
    unavailable: isSearchUnavailable(query.error),
    forbidden: isForbidden(query.error),
  };
}
