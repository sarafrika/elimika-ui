'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';
import {
  CLIENT_QUERY_CACHE_BUSTER,
  CLIENT_QUERY_CACHE_MAX_AGE_MS,
  CLIENT_QUERY_CACHE_STORAGE_KEY,
  makeQueryClient,
} from '@/lib/query-client';

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
    >
      <SessionProvider>{children}</SessionProvider>
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </PersistQueryClientProvider>
  );
}
