import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUserStore } from '@/store/use-user-store';
import { useQuery } from '@tanstack/react-query';
import { searchStudentsOptions } from '@/services/client/@tanstack/react-query.gen';

interface ProfileContextType {
  user: any;
  student: any;
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading, fetchCurrentUser } = useUserStore();
  const [isRefetching, setIsRefetching] = useState(false);

  const {
    data: studentResponse,
    isLoading: isStudentLoading,
    error: studentError,
    refetch: refetchStudent,
  } = useQuery({
    ...searchStudentsOptions({
      query: {
        //@ts-ignore
        userUuid: user?.uuid || '',
        page: 0,
        size: 1,
      },
    }),
    enabled: !!user?.uuid,
    staleTime: 5 * 60 * 1000,
    select: (data) => data?.content?.[0] || null,
  });

  const student = studentResponse;

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    try {
      await fetchCurrentUser();
      await refetchStudent();
    } catch (error) {
      console.error('Error refetching profile data:', error);
    } finally {
      setIsRefetching(false);
    }
  }, [fetchCurrentUser, refetchStudent]);


  useEffect(() => {
    if (user?.uuid) {
      refetchStudent();
    }
  }, [user?.uuid, refetchStudent]);

  return (
    <ProfileContext.Provider
      value={{
        user,
        student,
        isLoading: isUserLoading || isStudentLoading || isRefetching,
        error: studentError,
        refetch,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used within a ProfileProvider');
  return ctx;
}