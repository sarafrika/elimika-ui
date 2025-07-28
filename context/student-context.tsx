import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useUser } from './user-context';
import { searchStudents, Student } from '@/services/client';

const StudentContext = createContext<Student | null>(null);

export default function StudentContextProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (user?.uuid) {
      searchStudents({
        query: {
          //@ts-ignore
          user_uuid_eq: user.uuid,
        },
      })
        .then(response => {
          if (response.data?.content && response.data.content.length > 0) {
            setStudent(response.data.content[0] as Student);
          }
        })
        .catch(error => {
          console.error('Error fetching student data:', error);
        });
    }
  }, [user]);

  return <StudentContext.Provider value={student}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  return useContext(StudentContext);
}