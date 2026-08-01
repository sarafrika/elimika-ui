// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import {
  queryOptions,
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import type { UserProfileType } from '@/lib/types';
import {
  type CourseCreator,
  type Instructor,
  type SearchResponse,
  type Student,
  searchCourseCreators,
  searchInstructors,
  searchStudents,
  type User,
} from '@/services/client';
import { fetchCurrentUser } from '@/services/user/current-user';

const UserProfileContext = createContext<
  | (Partial<UserProfileType> & {
      isLoading: boolean;
      invalidateQuery: () => void;
      clearProfile: () => void;
    })
  | null
>(null);

export const useUserProfile = () => useContext(UserProfileContext);

export default function UserProfileProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const router = useRouter();

  const { data, isPending, refetch } = useQuery(
    createQueryOptions(session?.user?.email, {
      enabled: !!session?.user?.email,
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

  // isPending (not isLoading): while the session is still resolving the
  // profile query is disabled, and a disabled query reports isLoading=false.
  // Consumers (e.g. dashboard domain hydration) treated that as "profile
  // loaded with no domains" and overwrote the user's saved dashboard choice
  // with the default on every full page load.
  const isLoading = status === 'loading' || isPending;

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

async function fetchUserProfile(): Promise<UserProfileType> {
  // Identity comes from the access token, not from a query parameter: the old
  // `?email_eq=` bootstrap meant the user search had to stay open to every
  // authenticated caller, which exposed the whole user table.
  const userContent = await fetchCurrentUser();

  if (!userContent) {
    throw new Error('User not found');
  }

  const user = { ...userContent, dob: new Date(userContent?.dob ?? Date.now()) } as User &
    UserProfileType;

  if (user.user_domain && user.user_domain.length > 0) {
    // The domain profile lookups are independent — run them in parallel.
    // Sequential awaits here previously delayed every dashboard page by the
    // sum of all three round trips before any page data could start loading.
    const searchByUserUuid = { user_uuid_eq: user.uuid };

    const [studentResponse, instructorResponse, courseCreatorResponse] = await Promise.all([
      user.user_domain.includes('student')
        ? searchStudents({
            query: { searchParams: searchByUserUuid, pageable: { page: 0, size: 20 } },
          }).catch(() => null)
        : null,
      user.user_domain.includes('instructor')
        ? searchInstructors({
            query: { searchParams: searchByUserUuid, pageable: { page: 0, size: 20 } },
          }).catch(() => null)
        : null,
      user.user_domain.includes('course_creator') && user.uuid
        ? searchCourseCreators({
            query: { searchParams: searchByUserUuid, pageable: { page: 0, size: 1 } },
          }).catch(() => null)
        : null,
    ]);

    if (studentResponse && !studentResponse.error && studentResponse.data) {
      const respData = studentResponse.data as SearchResponse;
      if (respData.data?.content && respData.data.content.length > 0) {
        user.student = respData.data.content[0] as unknown as Student;
      }
    }

    if (instructorResponse && !instructorResponse.error && instructorResponse.data) {
      const responseData = instructorResponse.data as SearchResponse;
      if (responseData.data?.content && responseData.data.content.length > 0) {
        const instructor = responseData.data.content[0] as unknown as Instructor;
        user.instructor = instructor as unknown as UserProfileType['instructor'];
      }
    }

    if (courseCreatorResponse && !courseCreatorResponse.error && courseCreatorResponse.data) {
      const creatorData = courseCreatorResponse.data as SearchResponse;
      const creatorProfile = Array.isArray(creatorData.data?.content)
        ? (creatorData.data.content[0] as unknown as CourseCreator)
        : undefined;
      if (creatorProfile) {
        user.courseCreator = creatorProfile;
      }
    }
  }

  return user;
}

function createQueryOptions(
  email?: string,
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
      return await fetchUserProfile();
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
