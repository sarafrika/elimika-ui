'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { classifySearchError, toSearchTerm } from '@/lib/search-query';
import type { Organisation } from '@/services/client';
import {
  getAllOrganisationsOptions,
  search2Options,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';

export const ORGANISATIONS_PAGE_SIZE = 20;

export interface OrganisationFilters {
  q?: string;
  /** 'verified' | 'unverified' — anything else means no filter. */
  verified?: string;
  /** 'active' | 'inactive' — anything else means no filter. */
  active?: string;
  page?: number;
}

/**
 * Builds the filter map. Only description, active, slug, location and admin_verified
 * are filterable; country is not, and sending it returns 400. Free text is not a
 * filter — it goes as `q`.
 */
function buildFilterParams({ verified, active }: Pick<OrganisationFilters, 'verified' | 'active'>) {
  const params: Record<string, unknown> = {};

  if (verified === 'verified') params.admin_verified = true;
  if (verified === 'unverified') params.admin_verified = false;
  if (active === 'active') params.active = true;
  if (active === 'inactive') params.active = false;

  return params;
}

/** Server-paged organisations for the directory. */
export function useOrganisations(filters: OrganisationFilters) {
  const page = filters.page ?? 0;
  const { verified, active } = filters;
  const term = toSearchTerm(filters.q);
  const filterParams = useMemo(() => buildFilterParams({ verified, active }), [verified, active]);
  const hasFilters = Object.keys(filterParams).length > 0;
  const pageable = { page, size: ORGANISATIONS_PAGE_SIZE };

  const searched = useQuery({
    ...search2Options({ query: { searchParams: { ...filterParams, q: term }, pageable } }),
    ...listQuery,
    enabled: Boolean(term),
  });

  const searchIssue = classifySearchError(searched.error, term);
  const searching = Boolean(term) && searchIssue !== 'unavailable';

  // The search endpoint returns 500 when it is given no criteria at all, so the
  // unfiltered directory reads the plain list instead. Without a usable term (none
  // typed, or the index is down) the filters alone decide which of the two answers.
  const listAll = useQuery({
    ...getAllOrganisationsOptions({ query: { pageable } }),
    ...listQuery,
    enabled: !searching && !hasFilters,
  });

  const filtered = useQuery({
    ...search2Options({ query: { searchParams: filterParams, pageable } }),
    ...listQuery,
    enabled: !searching && hasFilters,
  });

  const query = searching ? searched : hasFilters ? filtered : listAll;

  const { organisations, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<Organisation>(query.data);
    return {
      organisations: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { organisations, totalRows, pageCount, page, query, searchIssue };
}
