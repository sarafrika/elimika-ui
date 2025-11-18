import { search } from '@/services/api/actions';
import type { Student } from '@/services/api/schema';
import { useSession } from 'next-auth/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StudentStoreType = {
  student: Student | null;
  loading: boolean;
  getStudent: () => Promise<void>;
};

export const useStudentStore = create<StudentStoreType>()(
  persist(
    (set, _get) => ({
      student: null,
      loading: false,
      getStudent: async () => {
        try {
          const session = useSession();
          set({ loading: true });
          const studentResults = (await search('/api/v1/students/search', {
            user_uuid_eq: session.data?.user.uuid,
          })) as Student[];
          set({ loading: false, student: studentResults[0] });
        } catch (_e) {
          return undefined;
        }
      },
    }),
    {
      name: 'user-storage', // unique name for localStorage
      partialize: state => ({
        user: state.student,
      }),
    }
  )
);
