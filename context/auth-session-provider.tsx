'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

// API calls authenticate server-side via the proxy, so the client copy only needs a slow
// heartbeat; refetching on every tab focus cost a /api/auth/session round trip each time.
const SESSION_REFETCH_INTERVAL_SECONDS = 5 * 60;

/**
 * next-auth session for the client. Passing `session` (read on the server) seeds the
 * context so the first paint is authenticated without fetching /api/auth/session.
 */
export function AuthSessionProvider({
  session,
  children,
}: {
  session?: Session | null;
  children: ReactNode;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={SESSION_REFETCH_INTERVAL_SECONDS}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
