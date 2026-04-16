import { createContext, type ReactNode, useContext } from 'react';
import type { Student } from '../services/client';
import { useUserProfile } from './profile-context';

const StudentContext = createContext<Student | null>(null);
export default function StudentContextProvider({ children }: { children: ReactNode }) {
  const user = useUserProfile();
  return <StudentContext.Provider value={user?.student ?? null}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  const student = useContext(StudentContext);
  const user = useUserProfile();

  return student ?? user?.student ?? null;
}
