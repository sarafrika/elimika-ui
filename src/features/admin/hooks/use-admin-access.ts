'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type { User } from '@/services/client';
import {
  getAdminEligibleUsersOptions,
  getAdminUsersOptions,
  getOrganizationAdminUsersOptions,
  getSystemAdminUsersOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';

/**
 * The admin lists page in memory on the server, so a page size here only slices what
 * has already been built. One generous page keeps it to a single call per tab.
 */
const LIST_SIZE = 200;
const ELIGIBLE_SIZE = 20;

/** Shortest search that is worth sending to an endpoint that scans every user. */
export const ELIGIBLE_MIN_QUERY = 2;

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
 * Everyone holding admin access of any kind. The endpoint requires a `filters` map but
 * the service ignores it and pages in memory, so the console sends an empty map and
 * filters on the client.
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
 * People who could be granted access. The endpoint loads every user and checks each one
 * server-side, so it only runs once the caller has typed enough to narrow it.
 */
export function useEligibleUsers(search: string) {
  const term = search.trim();
  const enabled = term.length >= ELIGIBLE_MIN_QUERY;

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
