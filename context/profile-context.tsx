'use client';

import type { UserProfileType } from '@/lib/types';
import { type CourseCreator, type Instructor, search, searchCourseCreators, searchInstructors, type SearchResponse, searchStudents, type Student, type User } from '@/services/client';
import { queryOptions, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useEffect } from 'react';

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

  const { data, isLoading, refetch } = useQuery(
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

  return (
    <UserProfileContext.Provider
      value={{
        ...(data ?? {}),
        isLoading,
        invalidateQuery: async () => {
          await qc.invalidateQueries({ queryKey: ['profile'] });
          await refetch();
        },
        clearProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
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
        sort: [],
      },
    },
  });

  const userData = userResponse.data as SearchResponse;
  if (userData.error || !userData.data?.content || userData.data.content.length === 0) {
    throw new Error('User not found');
  }

  const userContent = userData.data.content[0];
  const user = { ...userContent, dob: new Date(userContent?.dob ?? Date.now()) } as User &
    UserProfileType;

  if (user.user_domain && user.user_domain.length > 0) {
    // Add student data if user is a student
    if (user.user_domain.includes('student')) {
      const searchResponse = await searchStudents({
        query: {
          searchParams: {
            user_uuid_eq: user.uuid,
          },
          pageable: {
            page: 0,
            size: 20,
            sort: [],
          },
        },
      });

      const respData = searchResponse.data as SearchResponse;
      if (!respData.error && respData.data?.content && respData.data.content.length > 0) {
        user.student = respData.data.content[0] as unknown as Student;
      }
    }

    // Add instructor data if user is an instructor (lean payload only)
    if (user.user_domain.includes('instructor')) {
      const instructorSearchResponse = await searchInstructors({
        query: {
          searchParams: {
            user_uuid_eq: user.uuid,
          },
          pageable: {
            page: 0,
            size: 20,
            sort: [],
          },
        },
      });

      const responseData = instructorSearchResponse.data as SearchResponse;
      if (
        !responseData.error &&
        responseData.data?.content &&
        responseData.data.content.length > 0
      ) {
        const instructor = responseData.data.content[0] as unknown as Instructor;
        user.instructor = instructor as unknown as UserProfileType['instructor'];
      }
    }

    // Add course creator data if user is a course creator
    if (user.user_domain.includes('course_creator') && user.uuid) {
      try {
        const courseCreatorResponse = await searchCourseCreators({
          query: {
            searchParams: {
              user_uuid_eq: user.uuid,
            },
            pageable: {
              page: 0,
              size: 1,
              sort: [],
            },
          },
        });

        const creatorData = courseCreatorResponse.data as SearchResponse;
        const creatorProfile = Array.isArray(creatorData.data?.content)
          ? (creatorData.data.content[0] as unknown as CourseCreator)
          : undefined;
        if (creatorProfile) {
          user.courseCreator = creatorProfile;
        }
      } catch (_error) {
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
