'use client';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const value = useMemo(() => ({ session, status }), [session, status]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionWrapper() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProviderWrapper');
  }
  return context;
}
