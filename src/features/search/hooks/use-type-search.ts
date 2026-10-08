'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchErrors } from '@/hooks/use-search-query';
import { isBadRequest, isSearchUnavailable } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { toSearchTerm } from '@/lib/search/query';
import { type TypeSearchArgs, typeSearchOptions } from '@/lib/search/type-search';

/**
 * `GET /api/v1/search/{type}`: one type's page of hits with facets. Without `q` the page
 * lists by filter and sort. A 400 (unknown filter, facet or sort) or 503 is never
 * retried; a 503 marks search unavailable for a minute so callers fall back to their
 * plain listing.
 */
export function useTypeSearch({ enabled = true, ...args }: TypeSearchArgs & { enabled?: boolean }) {
  const q = toSearchTerm(args.q);
  const query = useQuery({
    ...typeSearchOptions({ ...args, q }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.live,
  });
  useSearchErrors(q, query.error);

  const page = query.data?.data;
  const facets = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    for (const [attribute, counts] of Object.entries(page?.facets ?? {})) {
      result[attribute] = Object.fromEntries(
        Object.entries(counts).map(([value, count]) => [value, Number(count)])
      );
    }
    return result;
  }, [page?.facets]);

  return {
    ...query,
    hits: page?.content ?? [],
    metadata: page?.metadata,
    facets,
    searchUnavailable: isSearchUnavailable(query.error),
    invalid: isBadRequest(query.error),
  };
}
