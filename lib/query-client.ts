import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });

  if (typeof window !== 'undefined') {
    persistQueryClient({
      queryClient,
      persister: createSyncStoragePersister({ storage: window.localStorage }),
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    });
  }

  return queryClient;
}
