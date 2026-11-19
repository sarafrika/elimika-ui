'use client';

import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { isForbidden, isSearchUnavailable, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { searchApplyToTrainCatalogueOptions } from '@/services/client/@tanstack/react-query.gen';
import { type CatalogueFilters, catalogueRequests, mergeCataloguePages } from './catalogue-model';

export { CATALOGUE_PAGE_SIZE, type CatalogueFilters, type CatalogueFit, type CatalogueShow } from './catalogue-model';

/** Search-only, with at most two requests per page to include every application status. */
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
  return {
    query,
    ...catalogue,
    unavailable: isSearchUnavailable(query.error),
    forbidden: isForbidden(query.error),
  };
}
