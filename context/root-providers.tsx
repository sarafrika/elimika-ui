'use client';

import { TimeZoneProvider } from '@/context/timezone-context';
import {
  CLIENT_QUERY_CACHE_BUSTER,
  CLIENT_QUERY_CACHE_MAX_AGE_MS,
  CLIENT_QUERY_CACHE_STORAGE_KEY,
  makeQueryClient,
} from '@/lib/query-client';
import { isVolatileGeneratedQuery } from '@/src/features/dashboard/workflow-query-invalidation';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';

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
      storage: typeof window === 'undefined' ? undefined : window.sessionStorage,
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
      <SessionProvider>
        <TimeZoneProvider>{children}</TimeZoneProvider>
      </SessionProvider>
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </PersistQueryClientProvider>
  );
}
