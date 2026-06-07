'use client';

import { Instructor } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAllInstructorsOptions } from '../services/client/@tanstack/react-query.gen';

export type InstructorMap = Record<string, Instructor>;

export function useInstructorsMap(page = 0, pageSize = 1000) {
    const { data, isLoading } = useQuery({
        ...getAllInstructorsOptions({
            query: { pageable: { page, size: pageSize } },
        }),
    }
    );

    const map: InstructorMap = useMemo(() => {
        if (!data?.data?.content) return {};

        return data?.data?.content.reduce((acc: InstructorMap, instructor: Instructor) => {
            if (instructor?.uuid) acc[instructor.uuid] = instructor;
            return acc;
        }, {});
    }, [data]);

    return { instructorMap: map, instructorList: data?.data?.content || [], isLoading };
}