import { useQuery } from '@tanstack/react-query';
import { getStudentById } from '../services/client';

export const useStudentsMap = (studentUuids: string[]) => {
    const query = useQuery({
        queryKey: ['students-batch', studentUuids],
        queryFn: async () => {
            if (!studentUuids?.length) return {};

            const results = await Promise.all(
                studentUuids.map((uuid) =>
                    getStudentById({ path: { uuid } })
                        .then((res) => res?.data?.data)
                        .catch(() => null)
                )
            );

            const mapped: Record<string, any> = {};

            results.forEach((student) => {
                if (student?.uuid) {
                    mapped[student.uuid] = student;
                }
            });

            return mapped;
        },
        enabled: studentUuids?.length > 0,
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    return {
        studentsMap: query.data || {},
        isLoading: query.isLoading,
        error: query.error,
    };
};
