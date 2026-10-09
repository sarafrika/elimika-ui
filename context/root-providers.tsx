'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  type PersistQueryClientOptions,
  PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import dynamic from 'next/dynamic';
import { SessionProvider } from 'next-auth/react';
import { type ReactNode, useState } from 'react';
import { RumReporter } from '@/components/perf/rum-reporter';
import { TimeZoneProvider } from '@/context/timezone-context';
import {
  CLIENT_QUERY_CACHE_BUSTER,
  CLIENT_QUERY_CACHE_MAX_AGE_MS,
  CLIENT_QUERY_CACHE_STORAGE_KEY,
  makeQueryClient,
  PERSIST_MAX_QUERY_BYTES,
  PERSIST_MAX_TOTAL_BYTES,
  PERSISTED_QUERY_IDS,
  PERSISTED_QUERY_KEY_ROOTS,
} from '@/lib/query-client';
import {
  getGeneratedQueryId,
  isVolatileGeneratedQuery,
} from '@/src/features/dashboard/workflow-query-invalidation';

function isAllowListedKey(queryKey: readonly unknown[]) {
  const id = getGeneratedQueryId(queryKey);
  if (id) return PERSISTED_QUERY_IDS.has(id);
  const root = queryKey[0];
  return typeof root === 'string' && PERSISTED_QUERY_KEY_ROOTS.has(root);
}

function fitsPersistBudget(data: unknown) {
  try {
    const serialized = JSON.stringify(data);
    return serialized === undefined || serialized.length <= PERSIST_MAX_QUERY_BYTES;
  } catch {
    return false;
  }
}

// Each persist tick serialises on the main thread, so only small shell/reference data is kept.
// The status check is defaultShouldDehydrateQuery inlined: the persister pins another query-core.
type PersistedQuery = Parameters<
  NonNullable<NonNullable<PersistQueryClientOptions['dehydrateOptions']>['shouldDehydrateQuery']>
>[0];

function shouldPersistQuery(query: PersistedQuery) {
  return (
    query.state.status === 'success' &&
    isAllowListedKey(query.queryKey) &&
    !isVolatileGeneratedQuery(query.queryKey) &&
    fitsPersistBudget(query.state.data)
  );
}

// Drops a snapshot over the total budget instead of writing it; storage errors never throw.
function createBudgetedStorage(
  storage: Storage
): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  return {
    getItem: key => storage.getItem(key),
    removeItem: key => storage.removeItem(key),
    setItem: (key, value) => {
      try {
        if (value.length > PERSIST_MAX_TOTAL_BYTES) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        // Quota or private-mode failures leave the in-memory cache untouched.
      }
    },
  };
}

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(() =>
        import('@tanstack/react-query-devtools').then(m => ({
          default: m.ReactQueryDevtools,
        }))
      )
    : null;

export function RootProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(() =>
    createSyncStoragePersister({
      key: CLIENT_QUERY_CACHE_STORAGE_KEY,
      storage:
        typeof window === 'undefined' ? undefined : createBudgetedStorage(window.sessionStorage),
      throttleTime: 1000,
    })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: CLIENT_QUERY_CACHE_BUSTER,
        maxAge: CLIENT_QUERY_CACHE_MAX_AGE_MS,
        persister,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
      onSuccess={() => {
        // Workflow state changes on the server between visits, so its restored copy may be
        // painted but never counted as fresh; every other entry keeps its own staleTime tier.
        void queryClient.invalidateQueries({
          predicate: query => isVolatileGeneratedQuery(query.queryKey),
          refetchType: 'none',
        });
      }}
    >
      <SessionProvider refetchOnWindowFocus={false}>
        <TimeZoneProvider>{children}</TimeZoneProvider>
        <RumReporter />
      </SessionProvider>
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </PersistQueryClientProvider>
  );
}
