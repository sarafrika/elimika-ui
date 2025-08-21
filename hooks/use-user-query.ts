import { User } from '@/services/client';
import { search } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useUserQuery() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['user', session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) {
        return null;
      }

      const resp = await search({ 
        query: { 
          searchParams: { email_eq: session.user.email }, 
          pageable: { page: 0, size: 100 } 
        } 
      });

      if (resp.error) {
        throw new Error('Failed to fetch user data');
      }

      const results = resp.data.data?.content;
      return results?.[0] || null;
    },
    enabled: status === 'authenticated' && !!session?.user?.email,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useUserDomains() {
  const userQuery = useUserQuery();
  
  const userDomains = userQuery.data?.user_domain || [];
  const activeDomain = userDomains[0] || null;

  return {
    domains: userDomains,
    activeDomain,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
  };
}