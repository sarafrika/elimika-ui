'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { toNumber } from '@/lib/metrics';
import { classifySearchError, type SearchIssue, toSearchTerm } from '@/lib/search/query';
import type { User } from '@/services/client';
import { searchOptions } from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';

export const PEOPLE_PAGE_SIZE = 20;

export type PeopleRole =
  | 'all'
  | 'student'
  | 'instructor'
  | 'course_creator'
  | 'organisation_user'
  | 'admin';

export type PeopleStatus = 'any' | 'active' | 'inactive';

interface PeopleFilters {
  role: PeopleRole;
  q: string;
  status: PeopleStatus;
  page: number;
  size?: number;
}

/**
 * Role and status filters. Free text is not one of them: it goes as `q` to the search
 * index, which matches names and emails alike, so there is no longer a guess at which
 * field the admin meant. The backend keeps `user_domain` working alongside `q`.
 */
function buildFilterParams({ role, status }: Pick<PeopleFilters, 'role' | 'status'>) {
  const params: Record<string, unknown> = {};

  if (role !== 'all') params.user_domain = role;
  if (status !== 'any') params.active_eq = status === 'active';

  return params;
}

interface PeopleResult {
  people: User[];
  total: number;
  pageCount: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  /** True when filters are set, so an empty result means "nothing matches". */
  isFiltered: boolean;
  /** Set when the typed search failed; the page shows a notice rather than blocking. */
  searchIssue: SearchIssue;
}

/** One page of people, filtered and paged on the server. */
export function usePeople(filters: PeopleFilters): PeopleResult {
  const size = filters.size ?? PEOPLE_PAGE_SIZE;
  const { role, status, page: pageIndex } = filters;
  const term = toSearchTerm(filters.q);
  const filterParams = useMemo(() => buildFilterParams({ role, status }), [role, status]);
  const searchParams = useMemo(
    () => (term ? { ...filterParams, q: term } : filterParams),
    [filterParams, term]
  );
  const sorted = { page: pageIndex, size, sort: ['createdDate,desc'] };

  // With a term the index ranks by relevance, so no sort is sent.
  const primary = useQuery({
    ...searchOptions({
      query: { searchParams, pageable: term ? { page: pageIndex, size } : sorted },
    }),
    ...listQuery,
  });

  const searchIssue = classifySearchError(primary.error, term);
  const unavailable = searchIssue === 'unavailable';

  // The index is down: the directory still answers without the term.
  const fallback = useQuery({
    ...searchOptions({ query: { searchParams: filterParams, pageable: sorted } }),
    ...listQuery,
    enabled: unavailable,
  });

  const query = unavailable ? fallback : primary;
  const activeParams = unavailable ? filterParams : searchParams;

  const page = useMemo(() => extractPage<User>(query.data), [query.data]);

  return {
    people: page.items,
    total: getTotalFromMetadata(page.metadata),
    pageCount: toNumber(page.metadata.totalPages ?? 0),
    isLoading: query.isLoading && !query.data,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    isFiltered: Object.keys(activeParams).length > 0,
    searchIssue,
  };
}

/** The backend sends a list of domains; the generated type says one. Handle both. */
export function personDomains(person: User): string[] {
  const raw = person.user_domain as unknown;
  if (Array.isArray(raw)) return raw.filter((entry): entry is string => Boolean(entry));
  return typeof raw === 'string' && raw ? [raw] : [];
}

/** Initials for the avatar, from whichever name fields came back. */
export function personInitials(person: User): string {
  const first = person.first_name?.trim()?.[0] ?? '';
  const last = person.last_name?.trim()?.[0] ?? '';
  const initials = `${first}${last}`.trim();
  if (initials) return initials.toUpperCase();
  return (person.full_name ?? person.email ?? '?').trim().slice(0, 2).toUpperCase();
}
