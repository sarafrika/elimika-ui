'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { RumReporter } from '@/components/perf/rum-reporter';
import { AuthSessionProvider } from '@/context/auth-session-provider';
import { TimeZoneProvider } from '@/context/timezone-context';
import { CLIENT_QUERY_CACHE_STORAGE_KEY, makeQueryClient } from '@/lib/query-client';
import { noteRenderedPathname } from '@/src/features/dashboard/lib/active-domain-storage';

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
  // API answers are never stored in the browser; drop any snapshot an older build left behind.
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(CLIENT_QUERY_CACHE_STORAGE_KEY);
    } catch {
      // Storage can be unavailable (private mode); there is nothing to clear then.
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {ownsSession ? (
        <AuthSessionProvider>
          <TimeZoneProvider>{children}</TimeZoneProvider>
        </AuthSessionProvider>
      ) : (
        <TimeZoneProvider>{children}</TimeZoneProvider>
      )}
      <RumReporter />
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
