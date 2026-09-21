'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type { Organisation } from '@/services/client';
import { search2Options } from '@/services/client/@tanstack/react-query.gen';
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
 * Builds the search map. Only name, description, active, slug, location and
 * admin_verified are filterable; country is not, and sending it returns 400.
 */
function buildSearchParams({ q, verified, active }: OrganisationFilters) {
  const params: Record<string, unknown> = {};

  const term = q?.trim();
  if (term) params.name_like = term;
  if (verified === 'verified') params.admin_verified = true;
  if (verified === 'unverified') params.admin_verified = false;
  if (active === 'active') params.active = true;
  if (active === 'inactive') params.active = false;

  return params;
}

/** Server-paged organisations for the directory. */
export function useOrganisations(filters: OrganisationFilters) {
  const page = filters.page ?? 0;

  const query = useQuery({
    ...search2Options({
      query: {
        searchParams: buildSearchParams(filters),
        pageable: { page, size: ORGANISATIONS_PAGE_SIZE },
      },
    }),
    ...listQuery,
  });

  const { organisations, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<Organisation>(query.data);
    return {
      organisations: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { organisations, totalRows, pageCount, page, query };
}
