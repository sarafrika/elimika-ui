'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

/** Re-stamp the session token's identity after onboarding or a role change. */
export function useRefreshSessionIdentity() {
  const { update } = useSession();
  return useCallback(async () => {
    try {
      await update({});
    } catch {
      // Not fatal: the server guards confirm a stale token against `/me` before bouncing.
    }
  }, [update]);
}
