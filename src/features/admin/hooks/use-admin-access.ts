'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { MIN_SEARCH_TERM_LENGTH, toSearchTerm } from '@/lib/search/query';
import type { User } from '@/services/client';
import {
  getAdminEligibleUsersOptions,
  getAdminUsersOptions,
  getOrganizationAdminUsersOptions,
  getSystemAdminUsersOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';

/**
 * The admin lists are paged in the database. Admin accounts are few, so one generous
 * page keeps it to a single call per tab and the console filters that page locally.
 */
const LIST_SIZE = 200;
const ELIGIBLE_SIZE = 20;

/** Shortest search worth sending; the same two-character minimum as every `q` search. */
export const ELIGIBLE_MIN_QUERY = MIN_SEARCH_TERM_LENGTH;

export interface AdminListResult {
  people: User[];
  total: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

function toResult(query: {
  data: unknown;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}): AdminListResult {
  const { items, metadata } = extractPage<User>(query.data);
  return {
    people: items,
    total: getTotalFromMetadata(metadata) || items.length,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Everyone holding admin access of any kind. The endpoint requires a `filters` map; the
 * console sends an empty one, lets the server page the list in the database, and filters
 * the loaded page on the client.
 */
export function useAdminUsers(): AdminListResult {
  const query = useQuery({
    ...getAdminUsersOptions({ query: { filters: {}, pageable: { page: 0, size: LIST_SIZE } } }),
    ...listQuery,
  });

  return useMemo(() => toResult(query), [query]);
}

/** Global platform admins — the people this screen can grant and remove. */
export function useSystemAdmins(): AdminListResult {
  const query = useQuery({
    ...getSystemAdminUsersOptions({ query: { pageable: { page: 0, size: LIST_SIZE } } }),
    ...listQuery,
  });

  return useMemo(() => toResult(query), [query]);
}

/** Admins scoped to an organisation. Their role is changed on that organisation. */
export function useOrganisationAdmins(): AdminListResult {
  const query = useQuery({
    ...getOrganizationAdminUsersOptions({ query: { pageable: { page: 0, size: LIST_SIZE } } }),
    ...listQuery,
  });

  return useMemo(() => toResult(query), [query]);
}

/**
 * People who could be granted access. The endpoint keeps its `search=` parameter but
 * answers a term from the people index (typo-tolerant; 503 when search is unavailable),
 * so it only runs once a term of two or more characters has settled.
 */
export function useEligibleUsers(search: string | undefined) {
  const term = toSearchTerm(search) ?? '';
  const enabled = term.length > 0;

  const query = useQuery({
    ...getAdminEligibleUsersOptions({
      query: { search: term, pageable: { page: 0, size: ELIGIBLE_SIZE } },
    }),
    ...listQuery,
    enabled,
  });

  return useMemo(
    () => ({
      people: extractPage<User>(query.data).items,
      isLoading: enabled && query.isLoading,
      error: query.error,
      enabled,
    }),
    [query.data, query.isLoading, query.error, enabled]
  );
}
