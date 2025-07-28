import { createContext, ReactNode, useContext } from 'react';
import { Student } from '../services/client';
import { useUserProfile } from './profile-context';

const StudentContext = createContext<Student | null>(null);
export default function StudentContextProvider({ children }: { children: ReactNode }) {
  const user = useUserProfile();
  return <StudentContext.Provider value={user!.student!}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  return useContext(StudentContext);
}
