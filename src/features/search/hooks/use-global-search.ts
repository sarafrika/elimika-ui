'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchErrors } from '@/hooks/use-search-query';
import { isBadRequest, isSearchUnavailable } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { toSearchTerm } from '@/lib/search/query';
import { isSearchType, type SearchType } from '@/lib/search/type-search';
import type { GlobalSearchHit } from '@/services/client';
import { globalSearchOptions } from '@/services/client/@tanstack/react-query.gen';

export type GlobalSearchGroup = {
  type: SearchType;
  hits: GlobalSearchHit[];
  /** All matches of this type, for "See all {n}". */
  total: number;
};

/**
 * `GET /api/v1/search`: the palette's grouped search across every type the caller may
 * see. Pass the debounced text; nothing is sent below two characters. A 400 or 503 is
 * never retried, and a 503 marks search unavailable for the other surfaces too.
 */
export function useGlobalSearch({
  q,
  types,
  limit = 5,
  enabled = true,
}: {
  q: string | null | undefined;
  types?: readonly SearchType[];
  limit?: number;
  enabled?: boolean;
}) {
  const term = toSearchTerm(q);
  const query = useQuery({
    ...globalSearchOptions({
      query: { q: term ?? '', limit, ...(types?.length ? { types: types.join(',') } : {}) },
    }),
    enabled: enabled && Boolean(term),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.live,
  });
  useSearchErrors(term, query.error);

  const groups = useMemo<GlobalSearchGroup[]>(() => {
    const data = query.data?.data;
    if (!data) return [];
    const byType = new Map<SearchType, GlobalSearchHit[]>();
    for (const hit of data.hits ?? []) {
      if (!isSearchType(hit.type)) continue;
      const list = byType.get(hit.type) ?? [];
      list.push(hit);
      byType.set(hit.type, list);
    }
    return [...byType.entries()].map(([type, hits]) => ({
      type,
      hits,
      total: Number(data.totals?.[type] ?? hits.length),
    }));
  }, [query.data]);

  return {
    ...query,
    term,
    groups,
    searchUnavailable: isSearchUnavailable(query.error),
    invalid: isBadRequest(query.error),
  };
}
