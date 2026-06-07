'use client';

import { Student } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAllStudentsOptions } from '../services/client/@tanstack/react-query.gen';

export type StudentMap = Record<string, Student>;

export function useStudentMap(page = 0, pageSize = 1000) {
    const { data, isLoading } = useQuery(
        getAllStudentsOptions({
            query: { pageable: { page, size: pageSize } },
        })
    );

    const map: StudentMap = useMemo(() => {
        if (!data?.data?.content) return {};

        return data?.data?.content.reduce((acc: StudentMap, student: Student) => {
            if (student?.uuid) acc[student.uuid] = student;
            return acc;
        }, {});
    }, [data]);

    return { studentMap: map, studentsList: data?.data?.content || [], isLoading };
}
