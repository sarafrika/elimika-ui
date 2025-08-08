import { queryOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
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

const UserProfileContext = createContext<Partial<UserProfileType> & {
  isLoading: boolean,
  invalidateQuery: () => void,
  clearProfile: () => void,
  setActiveDomain: (domain: DomainTypes) => void,
  activeDomain: string | null
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

  const [profile, setProfile] = useState<UserProfileType | null>(sessionData ?? data);
  const [activeDomain, setActiveDomain] = useState<DomainTypes | null>(null);

  if (data && !isError) sessionStorage.setItem("profile", JSON.stringify(data));

  useEffect(() => {
    if (status === "unauthenticated") clearProfile();
    else if (status === "authenticated" && data && !isError && !profile) {
      setProfile(data);

      if (!activeDomain && data.user_domain && data.user_domain.length > 0) {
        const domain = data.user_domain[0];
        if (domain === "instructor" || domain === "student" || domain === "organisation") {
          setActiveDomain(domain);
        }
        else setActiveDomain(null);
      }
    }
  }, [status, isLoading]);

  function clearProfile() {
    sessionStorage.removeItem("profile");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return <UserProfileContext.Provider value={
    {
      ...(profile ?? {}),
      isLoading,
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
}

function createQueryOptions(options?: Omit<UseQueryOptions<UserProfileType>, "queryKey" | "queryFn" | "staleTime">) {
  return queryOptions({
    ...options,
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then(response => {
      if (response.status < 200 || response.status > 299)
        throw new Error(response.statusText);

      return response.json();
    }),
    staleTime: 1000 * 60 * 60 // 1hour
  })
}