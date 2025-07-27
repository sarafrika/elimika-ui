import { Instructor } from '@/services/api/schema';
import { createContext, ReactNode, useContext } from 'react';
import { useUserProfile } from './profile-context';

const InstructrorContext = createContext<Instructor | null>(null);
export default function InstructorProvider({ children }: { children: ReactNode }) {
  const user = useUserProfile();
  return <InstructrorContext.Provider value={user!.instructor as Instructor}>{children}</InstructrorContext.Provider>;
}

export function useInstructor() {
  return useContext(InstructrorContext);
}
