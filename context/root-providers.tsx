'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  PersistQueryClientProvider,
  removeOldestQuery,
} from '@tanstack/react-query-persist-client';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { RumReporter } from '@/components/perf/rum-reporter';
import { AuthSessionProvider } from '@/context/auth-session-provider';
import { TimeZoneProvider } from '@/context/timezone-context';
import { deserializeQueryCache, serializeQueryCache } from '@/lib/query-cache-serializer';
import {
  CLIENT_QUERY_CACHE_BUSTER,
  CLIENT_QUERY_CACHE_MAX_AGE_MS,
  CLIENT_QUERY_CACHE_STORAGE_KEY,
  makeQueryClient,
  STALE_TIMES,
} from '@/lib/query-client';
import { noteRenderedPathname } from '@/src/features/dashboard/lib/active-domain-storage';
import { isVolatileGeneratedQuery } from '@/src/features/dashboard/workflow-query-invalidation';

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(() =>
        import('@tanstack/react-query-devtools').then(m => ({
          default: m.ReactQueryDevtools,
        }))
      )
    : null;

export function RootProviders({ children }: { children: ReactNode }) {
  // The dashboard layout mounts its own provider seeded with the server session.
  const pathname = usePathname() ?? '';
  // Set in render so the new route's queries key on its own dashboard, not the last URL.
  noteRenderedPathname(pathname || null);
  const ownsSession = pathname !== '/dashboard' && !pathname.startsWith('/dashboard/');
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(() =>
    createSyncStoragePersister({
      key: CLIENT_QUERY_CACHE_STORAGE_KEY,
      storage: typeof window === 'undefined' ? undefined : window.sessionStorage,
      throttleTime: 1000,
      serialize: serializeQueryCache,
      deserialize: deserializeQueryCache,
      retry: removeOldestQuery,
    })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: CLIENT_QUERY_CACHE_BUSTER,
        maxAge: CLIENT_QUERY_CACHE_MAX_AGE_MS,
        persister,
      }}
      onSuccess={() => {
        // Restored workflow state older than the live tier is painted but not counted as
        // fresh; every other entry keeps its own staleTime tier.
        const liveCutoff = Date.now() - STALE_TIMES.live;
        void queryClient.invalidateQueries({
          predicate: query =>
            isVolatileGeneratedQuery(query.queryKey) && query.state.dataUpdatedAt < liveCutoff,
          refetchType: 'none',
        });
      }}
    >
      {ownsSession ? (
        <AuthSessionProvider>
          <TimeZoneProvider>{children}</TimeZoneProvider>
        </AuthSessionProvider>
      ) : (
        <TimeZoneProvider>{children}</TimeZoneProvider>
      )}
      <RumReporter />
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </PersistQueryClientProvider>
  );
}
