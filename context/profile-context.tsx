import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUserStore } from '@/store/use-user-store';
import { tanstackClient } from '@/services/api/tanstack-client';
import { QueryClient } from '@tanstack/react-query';

// Define the context type
interface ProfileContextType {
  user: any;
  student: any;
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const queryClient = new QueryClient();

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading, fetchCurrentUser } = useUserStore();
  const [student, setStudent] = useState<any>(null);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<any>(null);

  const fetchStudent = useCallback(async (userUuid?: string) => {
    if (!userUuid) return null;
    setIsStudentLoading(true);
    setStudentError(null);
    try {
      const queryOptions = tanstackClient.queryOptions('get', '/api/v1/students/search', {
        params: {
          query: {
            searchParams: { user_uuid_eq: String(userUuid) },
            pageable: {},
          },
        },
      });
      const resp = await queryClient.fetchQuery(queryOptions);
      setStudent(resp?.content?.[0] || null);
      setIsStudentLoading(false);
      return resp?.content?.[0] || null;
    } catch (err) {
      setStudentError(err);
      setIsStudentLoading(false);
      return null;
    }
  }, []);

  // Fetch both user and student on mount or when user changes
  useEffect(() => {
    fetchCurrentUser().then(freshUser => {
      const uuid = freshUser?.uuid || user?.uuid;
      if (uuid) fetchStudent(uuid);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uuid]);

  // Refetch both user and student
  const refetch = useCallback(async () => {
    const freshUser = await fetchCurrentUser();
    const uuid = freshUser?.uuid || user?.uuid;
    if (uuid) await fetchStudent(uuid);
  }, [fetchCurrentUser, fetchStudent, user?.uuid]);

  return (
    <ProfileContext.Provider
      value={{
        user,
        student,
        isLoading: isUserLoading || isStudentLoading,
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
