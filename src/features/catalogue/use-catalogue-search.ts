'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchErrors } from '@/hooks/use-search-query';
import { STALE_TIMES } from '@/lib/query-client';
import { client } from '@/services/client/client.gen';
import {
  CATALOGUE_SEARCH_URL,
  type CatalogueSearchPage,
  type CatalogueSearchQuery,
  isCatalogueSearchUnavailable,
  toCatalogueSearchPage,
} from './catalogue-search';

const BEARER = [{ scheme: 'bearer', type: 'http' }] as const;

/** `client.get<T>()` unwraps `T[keyof T]`, so the status-keyed shape is what it wants. */
type CatalogueSearchResponses = { 200: unknown };

/**
 * Swap point: once the client is regenerated this becomes the generated
 * `searchCatalogue…QueryKey` / `…Options` pair.
 */
export const catalogueSearchQueryKey = (query: CatalogueSearchQuery) =>
  ['catalogue-search', query] as const;

export async function fetchCatalogueSearch(
  query: CatalogueSearchQuery,
  signal?: AbortSignal
): Promise<CatalogueSearchPage> {
  const { data, error } = await client.get<CatalogueSearchResponses>({
    url: CATALOGUE_SEARCH_URL,
    query,
    security: BEARER,
    signal,
  });
  if (error) throw error;
  const page = toCatalogueSearchPage(data);
  if (!page) throw new Error('The catalogue search answered with an unexpected shape.');
  return page;
}

/**
 * The catalogue's one mixed list. A 503 with `q` marks search unavailable for every list
 * (so the term is dropped for a minute); `unavailable` tells the page to show its plain
 * catalogue list instead.
 */
export function useCatalogueSearch(query: CatalogueSearchQuery) {
  const result = useQuery({
    queryKey: catalogueSearchQueryKey(query),
    queryFn: ({ signal }) => fetchCatalogueSearch(query, signal),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.live,
  });
  useSearchErrors(query.q, result.error);

  return {
    ...result,
    unavailable: isCatalogueSearchUnavailable(result.error),
  };
}
