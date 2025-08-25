// DEPRECATED: This context has been replaced by TanStack Query-based user management
// Use useUserProfile() from profile-context.tsx instead

'use client';
import { useUserProfile } from './profile-context';

// Legacy compatibility export - redirects to new system
export function useUser() {
  const profile = useUserProfile();

  return {
    ...profile,
    updateSession: (userData: any) => {
      // This is now handled automatically by TanStack Query
      // You can use profile.invalidateQuery() to refresh user data
      profile?.invalidateQuery?.();
    },
  };
}
