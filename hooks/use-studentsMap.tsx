import { useQuery } from '@tanstack/react-query';
import { getStudentById } from '../services/client';

type StudentRecord = NonNullable<Awaited<ReturnType<typeof getStudentById>>['data']>;

export const useStudentsMap = (studentUuids: string[]) => {
  const query = useQuery({
    queryKey: ['students-batch', studentUuids],
    queryFn: async () => {
      if (!studentUuids?.length) return {};

      const results = await Promise.all(
        studentUuids.map(async (uuid) => {
          const res = await getStudentById({ path: { uuid } });
          console.log("raw student response:", uuid, res);
          return res?.data ?? null;
        })
      );

      const mapped: Record<string, StudentRecord> = {};

      for (const student of results) {
        if (student?.uuid) {
          mapped[student.uuid] = student;
        }
      }

      return mapped;
    },
    enabled: studentUuids?.length > 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    studentsMap: query.data || {},
    isLoading: query.isLoading,
    error: query.error,
  };
};
