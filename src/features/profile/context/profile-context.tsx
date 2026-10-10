// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import {
  type QueryClient,
  queryOptions,
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { SessionIdentity } from 'next-auth';
import { useSession } from 'next-auth/react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { STALE_TIMES } from '@/lib/query-client';
import type { UserProfileType } from '@/lib/types';
import { fetchCurrentUser } from '@/services/user/current-user';
import { fetchSessionBootstrap } from '@/services/user/session-bootstrap';
import {
  fetchDomainRows,
  mergeDomainProfiles,
  userDomains,
} from '@/src/features/profile/lib/load-domain-profiles';
import { seedSessionBootstrap } from '@/src/features/profile/lib/seed-session-bootstrap';

const UserProfileContext = createContext<
  | (Partial<UserProfileType> & {
      isLoading: boolean;
      invalidateQuery: () => void;
      clearProfile: () => void;
    })
  | null
>(null);

export const useUserProfile = () => useContext(UserProfileContext);

export default function UserProfileProvider({
  children,
  initialProfile,
  initialUpdatedAt,
}: {
  children: ReactNode;
  /** Profile read during the server render; seeds the query so mount fetches nothing. */
  initialProfile?: UserProfileType | null;
  initialUpdatedAt?: number;
}) {
  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const router = useRouter();

  const email =
    session?.user?.email ?? (status === 'unauthenticated' ? undefined : initialProfile?.email);
  const seed =
    initialProfile && email && initialProfile.email?.toLowerCase() === email.toLowerCase()
      ? initialProfile
      : undefined;

  const { data, isPending, refetch } = useQuery(
    createQueryOptions(qc, email, session?.identity, {
      enabled: !!email,
      initialData: seed,
      initialDataUpdatedAt: seed ? initialUpdatedAt : undefined,
    })
  );

  const clearProfile = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['profile'] });
  }, [qc]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      clearProfile();
      router.replace('/');
    }
  }, [status, clearProfile, router]);

  const invalidateQuery = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['profile'] });
    await refetch();
  }, [qc, refetch]);

  // isPending, not isLoading: a disabled query reports isLoading=false, which read as "no domains"
  // and overwrote the saved dashboard choice. A server-seeded profile need not wait on the session.
  const isLoading = (status === 'loading' && !seed) || isPending;

  const value = useMemo(
    () => ({
      ...(data ?? {}),
      isLoading,
      invalidateQuery,
      clearProfile,
    }),
    [data, isLoading, invalidateQuery, clearProfile]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

// /me/bootstrap seeds the wallet and unread-count caches in the same hop; /users/me is the fallback.
async function fetchUser(qc: QueryClient) {
  const bootstrap = await fetchSessionBootstrap();
  if (!bootstrap?.user) return fetchCurrentUser();
  seedSessionBootstrap(qc, bootstrap);
  return bootstrap.user;
}

async function fetchUserProfile(
  qc: QueryClient,
  identity?: SessionIdentity
): Promise<UserProfileType> {
  // Identity comes from the access token, not from a query parameter: the old
  // `?email_eq=` bootstrap exposed the whole user table to every caller.
  const knownDomains = identity?.uuid && identity.domains?.length ? identity.domains : null;
  const [userContent, stampedRows] = await Promise.all([
    fetchUser(qc),
    knownDomains ? fetchDomainRows(identity.uuid, knownDomains) : null,
  ]);

  if (!userContent) {
    throw new Error('User not found');
  }

  // A stale session stamp (other user, or a domain added since) must not drop a row.
  const domains = userDomains(userContent);
  const stampFits =
    stampedRows &&
    userContent.uuid === identity?.uuid &&
    domains.every(domain => knownDomains?.includes(domain));
  if (stampedRows && !stampFits) {
    logger.info('profile bootstrap: session stamp stale, refetching domain rows', {
      stampedDomains: knownDomains,
      domains,
    });
  }
  const rows = stampFits
    ? {
        student: domains.includes('student') ? stampedRows.student : undefined,
        instructor: domains.includes('instructor') ? stampedRows.instructor : undefined,
        courseCreator: domains.includes('course_creator') ? stampedRows.courseCreator : undefined,
      }
    : userContent.uuid
      ? await fetchDomainRows(userContent.uuid, domains)
      : {};
  return mergeDomainProfiles(userContent, rows);
}

function createQueryOptions(
  qc: QueryClient,
  email?: string,
  identity?: SessionIdentity,
  options?: Omit<UseQueryOptions<UserProfileType>, 'queryKey' | 'queryFn' | 'staleTime'>
) {
  return queryOptions({
    ...options,
    // Still keyed by email: the identity lookup no longer needs it, but the cache
    // entry must still be per-session so a sign-out cannot serve the previous
    // user's profile.
    queryKey: ['profile', email],
    queryFn: async () => {
      if (!email) {
        throw new Error('Email is required to fetch profile');
      }
      return await fetchUserProfile(qc, identity);
    },
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: query => {
      const user = query.state.data;
      if (!user) return false;
      const isInstructorPending = user.instructor && user.instructor.admin_verified === false;
      const isCreatorPending = user.courseCreator && user.courseCreator.admin_verified === false;
      const isOrgPending = user.organisation_affiliations?.some(a => a.admin_verified === false);
      if (isInstructorPending || isCreatorPending || isOrgPending) {
        return 30_000;
      }
      return false;
    },
  });
}
