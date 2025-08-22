"use client"
import { UserDomain, UserProfileType } from '@/lib/types';
import {
  getInstructorEducation,
  getInstructorExperience,
  getInstructorMemberships,
  getInstructorSkills,
  Instructor,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership,
  InstructorSkill,
  search,
  searchInstructors,
  SearchResponse,
  searchStudents,
  Student,
  User
} from '@/services/client';
import { queryOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ELIMIKA_DASHBOARD_STORAGE_KEY } from '../lib/utils';

type ExtendedInstructor = Instructor & {
  educations: InstructorEducation[];
  experience: InstructorExperience[];
  membership: InstructorProfessionalMembership[];
  skills: InstructorSkill[];
}

const UserProfileContext = createContext<Partial<UserProfileType> & {
  isLoading: boolean,
  invalidateQuery: () => void,
  clearProfile: () => void,
  setActiveDomain: (domain: UserDomain) => void,
  activeDomain: string | null,
  updateProfile: (data: UserProfileType) => void
} | null>(null);

export const useUserProfile = () => useContext(UserProfileContext);

export default function UserProfileProvider({ children }: { children: ReactNode }) {

  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(createQueryOptions(session?.user?.email, {
    enabled: !!session?.user?.email
  }));

  const [activeDomain, setActiveDomain] = useState<UserDomain | null>(null);

  // Update active domain when profile data changes
  useEffect(() => {
    if (data && !isError && data.user_domain && data.user_domain.length > 0) {
      let defaultDomain = localStorage.getItem(ELIMIKA_DASHBOARD_STORAGE_KEY);
      const domain = (defaultDomain || data.user_domain[0]) as UserDomain;
      if (domain !== null) {
        setActiveDomain(domain);
      }
    }
  }, [data, isError]);

  useEffect(() => {
    if (status === "unauthenticated") {
      clearProfile();
      setActiveDomain(null);
    }
  }, [status]);

  useEffect(() => {
    setActiveDomain(localStorage.getItem(ELIMIKA_DASHBOARD_STORAGE_KEY) as UserDomain | null)
  }, [])

  function clearProfile() {
    void qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return <UserProfileContext.Provider value={
    {
      ...(data ?? {}),
      isLoading,
      invalidateQuery: async () => {
        await qc.invalidateQueries({ queryKey: ["profile"] });
        await refetch();
      },
      clearProfile,
      setActiveDomain: (domain: UserDomain) => setActiveDomain(domain),
      activeDomain,
      updateProfile: async (data) => {
        // setProfile(data);
        sessionStorage.setItem("profile", JSON.stringify(data));
        await qc.invalidateQueries({ queryKey: ["profile"] });
        await refetch();
      }
    }}>
    {children}
  </UserProfileContext.Provider>
}

async function fetchUserProfile(email: string): Promise<UserProfileType> {
  // First, search for the user by email
  const userResponse = await search({
    query: {
      searchParams: {
        email_eq: email
      },
      pageable: {
        page: 0,
        size: 1,
        sort: []
      }
    }
  });

  const userData = userResponse.data as SearchResponse;
  if (userData.error || !userData.data?.content || userData.data.content.length === 0) {
    throw new Error('User not found');
  }

  const userContent = userData.data.content[0];
  const user = { ...userContent, dob: new Date(userContent?.dob ?? Date.now()) } as User & UserProfileType;

  if (user.user_domain && user.user_domain.length > 0) {
    // Add student data if user is a student
    if (user.user_domain.includes("student")) {
      const searchResponse = await searchStudents({
        query: {
          searchParams: {
            user_uuid_eq: user.uuid
          },
          pageable: {
            page: 0,
            size: 20,
            sort: []
          }
        }
      });

      const respData = searchResponse.data as SearchResponse;
      if (!respData.error && respData.data?.content && respData.data.content.length > 0) {
        user.student = respData.data.content[0] as unknown as Student;
      }
    }

    // Add instructor data if user is an instructor
    if (user.user_domain.includes("instructor")) {
      const instructorSearchResponse = await searchInstructors({
        query: {
          searchParams: {
            user_uuid_eq: user.uuid
          },
          pageable: {
            page: 0,
            size: 20,
            sort: []
          }
        }
      });

      const responseData = instructorSearchResponse.data as SearchResponse;
      if (!responseData.error && responseData.data?.content && responseData.data.content.length > 0) {
        const instructor = responseData.data.content[0] as unknown as Instructor;
        user.instructor = {
          ...instructor,
          educations: [] as InstructorEducation[],
          experience: [] as InstructorExperience[],
          membership: [] as InstructorProfessionalMembership[],
          skills: [] as InstructorSkill[]
        } as ExtendedInstructor;

        // Add instructor education
        try {
          const instructorEducation = await getInstructorEducation({
            path: { instructorUuid: instructor.uuid! }
          });
          if (!instructorEducation.error && instructorEducation.data?.data && user.instructor) {
            user.instructor.educations = instructorEducation.data.data as unknown as InstructorEducation[];
          }
        } catch (error) {
          console.warn('Failed to fetch instructor education:', error);
        }

        // Add instructor experience
        try {
          const instructorExperience = await getInstructorExperience({
            path: { instructorUuid: instructor.uuid! },
            query: {
              pageable: {
                page: 0,
                size: 20,
                sort: []
              }
            }
          });
          const expResp = instructorExperience.data as SearchResponse;
          if (!expResp.error && expResp.data?.content && user.instructor) {
            user.instructor.experience = expResp.data.content as unknown as InstructorExperience[];
          }
        } catch (error) {
          console.warn('Failed to fetch instructor experience:', error);
        }

        // Add instructor memberships
        try {
          const instructorMembership = await getInstructorMemberships({
            path: { instructorUuid: instructor.uuid! },
            query: {
              pageable: {
                page: 0,
                size: 20,
                sort: []
              }
            }
          });
          const memResp = instructorMembership.data as SearchResponse;
          if (!memResp.error && memResp.data?.content && user.instructor) {
            user.instructor.membership = memResp.data.content as unknown as InstructorProfessionalMembership[];
          }
        } catch (error) {
          console.warn('Failed to fetch instructor memberships:', error);
        }

        // Add instructor skills
        try {
          const instructorSkills = await getInstructorSkills({
            path: { instructorUuid: instructor.uuid! },
            query: {
              pageable: {
                page: 0,
                size: 20,
                sort: []
              }
            }
          });
          const skillsResp = instructorSkills.data as SearchResponse;
          if (!skillsResp.error && skillsResp.data?.content && user.instructor) {
            user.instructor.skills = skillsResp.data.content as unknown as InstructorSkill[];
          }
        } catch (error) {
          console.warn('Failed to fetch instructor skills:', error);
        }
      }
    }
  }

  return user;
}

function createQueryOptions(email?: string, options?: Omit<UseQueryOptions<UserProfileType>, "queryKey" | "queryFn" | "staleTime">) {
  return queryOptions({
    ...options,
    queryKey: ["profile", email],
    queryFn: async () => {
      if (!email) {
        throw new Error('Email is required to fetch profile');
      }
      return await fetchUserProfile(email);
    },
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })
}