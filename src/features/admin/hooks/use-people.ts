'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { toNumber } from '@/lib/metrics';
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

export interface PeopleFilters {
  role: PeopleRole;
  q: string;
  status: PeopleStatus;
  page: number;
  size?: number;
}

/**
 * The users search only filters on fields it marks filterable, so a typed query has to
 * pick one. A term with a space is a name (`full_name_like`); anything else is matched
 * against the email, which is what an admin pastes when chasing one account.
 */
function buildSearchParams({ role, q, status }: PeopleFilters) {
  const params: Record<string, unknown> = {};
  const term = q.trim();

  if (term) {
    if (term.includes(' ')) params.full_name_like = term;
    else if (term.includes('@')) params.email_like = term;
    else params.full_name_like = term;
  }

  if (role !== 'all') params.user_domain = role;
  if (status !== 'any') params.active_eq = status === 'active';

  return params;
}

export interface PeopleResult {
  people: User[];
  total: number;
  pageCount: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  /** True when filters are set, so an empty result means "nothing matches". */
  isFiltered: boolean;
}

/** One page of people, filtered and paged on the server. */
export function usePeople(filters: PeopleFilters): PeopleResult {
  const size = filters.size ?? PEOPLE_PAGE_SIZE;
  const searchParams = useMemo(() => buildSearchParams(filters), [filters]);

  const query = useQuery({
    ...searchOptions({
      query: {
        searchParams,
        pageable: { page: filters.page, size, sort: ['createdDate,desc'] },
      },
    }),
    ...listQuery,
  });

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
    isFiltered: Object.keys(searchParams).length > 0,
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
