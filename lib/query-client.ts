import {
  type DefaultError,
  type DefaultedQueryObserverOptions,
  notifyManager,
  QueryClient,
  type QueryKey,
  type QueryObserverOptions,
} from '@tanstack/react-query';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { scopeQueryOptionsToActingDomain } from '@/src/features/dashboard/lib/acting-domain-query-scope';

/**
 * Every API answer is stale the moment it arrives: each mount and focus asks the server again.
 * The tiers stay as names so call sites read the same; none of them reuses an answer.
 */
export const STALE_TIMES = {
  reference: 0,
  entity: 0,
  live: 0,
} as const;

/** Approval state changes on someone else's click; approval reads re-ask this often. */
export const APPROVAL_REFETCH_INTERVAL_MS = 5 * 60_000;

/** Spread into approval-related queries: the 5-minute poll plus a refetch on window focus. */
export const APPROVAL_QUERY_FRESHNESS = {
  refetchInterval: APPROVAL_REFETCH_INTERVAL_MS,
  refetchOnWindowFocus: true,
} as const;

/** Where older builds stored a snapshot of API answers; only ever cleared now. */
export const CLIENT_QUERY_CACHE_STORAGE_KEY = 'elimika-query-cache-v1';
/** How long an unmounted query's last answer is kept in memory to paint while it refetches. */
export const CLIENT_QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 5;

/** One quick retry for a network blip or 5xx, instead of React Query's 1s/2s/4s backoff. */
export const QUERY_RETRY_DELAY_MS = 500;

/**
 * Every query passes through here, so a domain switch needs no cache wipe, and no call site's
 * own staleTime can make the app reuse an answer instead of asking the server.
 */
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
    const defaulted = super.defaultQueryOptions(
      options._defaulted ? options : scopeQueryOptionsToActingDomain(options)
    );
    return { ...defaulted, staleTime: 0 };
  }
}

let queryNotifySchedulerInstalled = false;
const pendingQueryNotifications: Array<() => void> = [];

/** MessageChannel tasks are not throttled in hidden tabs; setTimeout(0) is aligned to 1 s there. */
export function installQueryNotifyScheduler() {
  if (queryNotifySchedulerInstalled) return;
  if (typeof window === 'undefined' || typeof MessageChannel === 'undefined') return;
  queryNotifySchedulerInstalled = true;
  const channel = new MessageChannel();
  channel.port1.onmessage = () => {
    for (const callback of pendingQueryNotifications.splice(0)) callback();
  };
  notifyManager.setScheduler(callback => {
    pendingQueryNotifications.push(callback);
    if (pendingQueryNotifications.length === 1) channel.port2.postMessage(null);
  });
}

export function makeQueryClient() {
  installQueryNotifyScheduler();
  return new ActingDomainQueryClient({
    defaultOptions: {
      queries: {
        gcTime: CLIENT_QUERY_CACHE_MAX_AGE_MS,
        staleTime: 0,
        retry: retryUnlessClientOrSearchError,
        retryDelay: QUERY_RETRY_DELAY_MS,
      },
    },
  });
}
