'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { isForbidden, isSearchUnavailable, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { searchApplyToTrainCatalogueOptions } from '@/services/client/@tanstack/react-query.gen';
import { type ApplyItem, toApplyItem } from './types';

export type CatalogueShow = 'all' | 'courses' | 'programmes';
export type CatalogueFit = 'open' | 'skills' | 'applied';

export type CatalogueFilters = {
  q: string;
  show: CatalogueShow;
  fit: CatalogueFit;
  category: string | null;
  page: number;
};

export const CATALOGUE_PAGE_SIZE = 24;

const count = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** The apply-to-train catalogue: search-only, so a 503 means no list at all. */
export function useApplyCatalogue(filters: CatalogueFilters, enabled = true) {
  const q = useDebouncedValue(filters.q.trim());
  const query = useQuery({
    ...searchApplyToTrainCatalogueOptions({
      query: {
        ...(q ? { q } : {}),
        show: filters.show,
        fit: filters.fit,
        ...(filters.category ? { category_uuid: [filters.category] } : {}),
        page: String(filters.page),
        size: String(CATALOGUE_PAGE_SIZE),
      },
    }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.live,
    retry: retryUnlessClientOrSearchError,
  });

  const data = query.data?.data;
  const items = useMemo(
    () => (data?.content ?? []).map(toApplyItem).filter((item): item is ApplyItem => item !== null),
    [data?.content]
  );
  const facets = useMemo(
    () => ({
      show: {
        all: count(data?.facets?.show?.all),
        courses: count(data?.facets?.show?.courses),
        programmes: count(data?.facets?.show?.programmes),
      },
      fit: {
        open: count(data?.facets?.fit?.open),
        skills: count(data?.facets?.fit?.skills),
        applied: count(data?.facets?.fit?.applied),
      },
      categories: (data?.facets?.category ?? [])
        .filter(row => row.uuid)
        .map(row => ({ uuid: row.uuid as string, name: row.name ?? 'Category', count: count(row.count) })),
    }),
    [data?.facets]
  );

  return {
    query,
    items,
    facets,
    totalPages: data?.metadata?.totalPages ?? 1,
    total: count(data?.metadata?.totalElements),
    unavailable: isSearchUnavailable(query.error),
    forbidden: isForbidden(query.error),
  };
}
