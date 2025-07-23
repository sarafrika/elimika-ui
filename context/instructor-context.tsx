import { Instructor } from '@/services/api/schema';
import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { useUser } from './user-context';
import { search } from '@/services/api/actions';

const InstructrorContext = createContext<Instructor | null>(null);
export default function InstructorProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    if (user) {
      search('/api/v1/instructors/search', { user_uuid_eq: user?.uuid }).then(result => {
        if (result.length > 0) {
          setInstructor(result[0]);
        }
      });
    }
  }, [user]);
  return <InstructrorContext.Provider value={instructor}>{children}</InstructrorContext.Provider>;
}

export function useInstructor() {
  return useContext(InstructrorContext);
}
