import {
  type DefaultError,
  type DefaultedQueryObserverOptions,
  QueryClient,
  type QueryKey,
  type QueryObserverOptions,
} from '@tanstack/react-query';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { scopeQueryOptionsToActingDomain } from '@/src/features/dashboard/lib/acting-domain-query-scope';

/**
 * staleTime tiers cap how long an answer is reused before the next mount refetches it
 * behind the paint — not how long it may be shown unasked. Pick the slowest tier that fits.
 */
export const STALE_TIMES = {
  /** Reference data that rarely changes: categories, difficulty levels, course catalog. */
  reference: 1000 * 60 * 30,
  /** Entity data edited by its owner: profiles, course details. */
  entity: 1000 * 60 * 5,
  /** Live operational data: enrollments, schedules, notifications. */
  live: 1000 * 60,
} as const;

/** Approval state changes on someone else's click; approval reads re-ask this often. */
export const APPROVAL_REFETCH_INTERVAL_MS = 5 * 60_000;

/** Spread into approval-related queries: the 5-minute poll plus a refetch on window focus. */
export const APPROVAL_QUERY_FRESHNESS = {
  refetchInterval: APPROVAL_REFETCH_INTERVAL_MS,
  refetchOnWindowFocus: true,
} as const;

export const CLIENT_QUERY_CACHE_STORAGE_KEY = 'elimika-query-cache-v1';
export const CLIENT_QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 30;
export const CLIENT_QUERY_CACHE_BUSTER = 'elimika-query-cache:2026-10-09';

/** One quick retry for a network blip or 5xx, instead of React Query's 1s/2s/4s backoff. */
export const QUERY_RETRY_DELAY_MS = 500;

/** Reference reads that default to the reference tier when the call site sets no staleTime. */
const REFERENCE_QUERY_IDS: ReadonlySet<string> = new Set([
  'getAllCategories',
  'getCategoryByUuid',
  'getRootCategories',
  'getSubCategories',
  'searchCategories',
  'getAllGradingLevels',
  'getAllDifficultyLevels',
  'getAllContentTypes',
  'searchContentTypes',
  'getMediaContentTypes',
  'checkMimeTypeSupport',
  'listDocumentTypes',
  'listCurrencies',
  'getDefaultCurrency',
  'listTiers',
  'listRules',
  'getRule',
]);

function withReferenceStaleTime<T extends { queryKey?: QueryKey; staleTime?: unknown }>(
  options: T
): T {
  if (options.staleTime !== undefined) return options;
  const head = options.queryKey?.[0] as { _id?: unknown } | undefined;
  const id = head && typeof head === 'object' ? head._id : undefined;
  return typeof id === 'string' && REFERENCE_QUERY_IDS.has(id)
    ? { ...options, staleTime: STALE_TIMES.reference }
    : options;
}

/** Every query passes through here, so a domain switch needs no cache wipe. */
class ActingDomainQueryClient extends QueryClient {
  override defaultQueryOptions<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options:
      | QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>
      | DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  ): DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
    return super.defaultQueryOptions(
      options._defaulted
        ? options
        : scopeQueryOptionsToActingDomain(withReferenceStaleTime(options))
    );
  }
}

export function makeQueryClient() {
  return new ActingDomainQueryClient({
    defaultOptions: {
      queries: {
        gcTime: CLIENT_QUERY_CACHE_MAX_AGE_MS,
        staleTime: STALE_TIMES.entity,
        retry: retryUnlessClientOrSearchError,
        retryDelay: QUERY_RETRY_DELAY_MS,
      },
    },
  });
}
