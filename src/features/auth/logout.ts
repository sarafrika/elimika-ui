'use client';

import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { useCallback } from 'react';
import { CLIENT_QUERY_CACHE_STORAGE_KEY } from '@/lib/query-client';
import { appStore } from '@/store/app-store';
import { useCartStore } from '@/store/cart-store';
import { useStudentStore } from '@/store/student-store';
import { clearAllPersistedDashboardDomains } from '@/src/features/dashboard/lib/active-domain-storage';

type LogoutOptions = {
  callbackUrl?: string;
  clearDomain?: () => void;
  clearProfile?: () => void;
};

function clearPersistedStores() {
  appStore.setState({ data: {} });
  useCartStore.getState().clearCart();
  useStudentStore.setState({ student: null, loading: false });

  void appStore.persist.clearStorage();
  void useCartStore.persist.clearStorage();
  void useStudentStore.persist.clearStorage();
}

export function clearClientAuthCache(queryClient: QueryClient) {
  queryClient.clear();
  clearPersistedStores();
  clearAllPersistedDashboardDomains();
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(CLIENT_QUERY_CACHE_STORAGE_KEY);
  }
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useCallback(
    async ({ callbackUrl = '/', clearDomain, clearProfile }: LogoutOptions = {}) => {
      clearClientAuthCache(queryClient);
      clearDomain?.();
      clearProfile?.();
      await signOut({ callbackUrl });
    },
    [queryClient]
  );
}
