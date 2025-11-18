// DEPRECATED: This store has been replaced by TanStack Query-based user management
// Use useUserProfile() or useUserQuery() hooks instead

import { create } from 'zustand';
import { useUserProfile } from '@/context/profile-context';

export type UserState = {
  activeDomain: string | null;
  setActiveDomain: (domain: string) => void;
  clearActiveDomain: () => void;
};

// Simplified store that only manages UI state, not user data
export const useUserStore = create<UserState>(set => ({
  activeDomain: null,
  setActiveDomain: (domain: string) => set({ activeDomain: domain }),
  clearActiveDomain: () => set({ activeDomain: null }),
}));

// Legacy compatibility functions that redirect to new TanStack Query system
export const useLegacyUserStore = () => {
  const profile = useUserProfile();
  const { activeDomain, setActiveDomain, clearActiveDomain } = useUserStore();

  return {
    user: profile,
    domains: profile?.user_domain || [],
    activeDomain: activeDomain || profile?.user_domain?.[0] || null,
    isLoading: profile?.isLoading || false,
    error: null,
    setUser: () => {
    },
    setDomains: () => {
    },
    setActiveDomain,
    clearUser: () => {
      profile?.clearProfile?.();
      clearActiveDomain();
    },
    fetchCurrentUser: async () => {
      await profile?.invalidateQuery?.();
      return profile;
    },
  };
};
