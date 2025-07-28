import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useUser } from './user-context';
import { searchInstructors, Instructor } from '@/services/client';

const InstructorContext = createContext<Instructor | null>(null);

export default function InstructorProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const [instructor, setInstructor] = useState<Instructor | null>(null);

  useEffect(() => {
    if (user?.uuid) {
      searchInstructors({
        query: {
          //@ts-ignore
          user_uuid_eq: user.uuid,
        },
      })
        .then(response => {
          if (response.data?.content && response.data.content.length > 0) {
            setInstructor(response.data.content[0] as Instructor);
          }
        })
        .catch(error => {
          console.error('Error fetching instructor data:', error);
        });
    }
  }, [user]);

  return <InstructorContext.Provider value={instructor}>{children}</InstructorContext.Provider>;
}

export function useInstructor() {
  return useContext(InstructorContext);
}