import { QueryClientProvider, queryOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Instructor, InstructorEducation, InstructorExperience, InstructorProfessionalMembership, InstructorSkill, Organisation, Student, User } from '../services/client';

type DomainTypes = "instructor" | "student" | "organisation"

export type UserProfileType = User & {
  student?: Student,
  instructor?: Instructor & {
    educations: InstructorEducation[],
    experience: InstructorExperience[],
    membership: InstructorProfessionalMembership[],
    skills: InstructorSkill
  },
  organization?: Organisation
}

const UserProfileContext = createContext<UserProfileType & {
  isLoading: boolean,
  invalidateQuery: () => void,
  clearProfile: () => void,
  setActiveDomain: (domain: DomainTypes) => void,
  activeDomain: DomainTypes
} | null>(null);

export const useUserProfile = () => useContext(UserProfileContext);

export default function UserProfileProvider({ children }: { children: ReactNode }) {

  const { status } = useSession();
  const sessionData = typeof sessionStorage !== "undefined" ?
    JSON.parse(sessionStorage.getItem("profile") ?? "null") : null;

  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(createQueryOptions({
    enabled: sessionData === null
  }));

  const profile = { ...(sessionData ?? data), isLoading };
  const [activeDomain, setActiveDomain] = useState<DomainTypes | null>(profile && profile.user_domain && profile.user_domain.length > 0 ? profile.user_domain[0] : null)

  useEffect(() => {
    if (status === "unauthenticated") clearProfile();
  }, [status]);

  function clearProfile() {
    sessionStorage.removeItem("profile");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  if (data && !isError) sessionStorage.setItem("profile", JSON.stringify(data));

  return <QueryClientProvider client={qc}>
    <UserProfileContext.Provider value={
      {
        ...profile,
        invalidateQuery: async () => {
          await qc.invalidateQueries({ queryKey: ["profile"] });
          await refetch();
        },
        clearProfile,
        setActiveDomain: (domain: DomainTypes) => setActiveDomain(domain),
        activeDomain
      }}>
      {children}
    </UserProfileContext.Provider>
  </QueryClientProvider>
}

function createQueryOptions(options?: Omit<UseQueryOptions, "queryKey" | "queryFn" | "staleTime">) {
  return queryOptions({
    ...options,
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then(response => {
      if (response.status < 200 || response.status > 299)
        throw new Error(response.statusText)

      return response.json();
    }),
    staleTime: 1000 * 60 * 60 // 1hour
  })
}