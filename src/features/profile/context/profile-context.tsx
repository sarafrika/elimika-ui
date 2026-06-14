'use client';

import {
  queryOptions,
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import type { UserProfileType } from '@/lib/types';
import {
  type CourseCreator,
  type Instructor,
  type SearchResponse,
  type Student,
  search,
  searchCourseCreators,
  searchInstructors,
  searchStudents,
  type User,
} from '@/services/client';

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

async function fetchUserProfile(email: string): Promise<UserProfileType> {
  // First, search for the user by email
  const userResponse = await search({
    query: {
      searchParams: {
        email_eq: email,
      },
      pageable: {
        page: 0,
        size: 1,
      },
    },
  });

  if (userResponse.error || !userResponse.data) {
    throw new Error('User not found');
  }
  const userData = userResponse.data as SearchResponse;
  if (!userData.data?.content || userData.data.content.length === 0) {
    throw new Error('User not found');
  }

  const userContent = userData.data.content[0];
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
    queryKey: ['profile', email],
    queryFn: async () => {
      if (!email) {
        throw new Error('Email is required to fetch profile');
      }
      return await fetchUserProfile(email);
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
