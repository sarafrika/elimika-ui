'use client';

import { Course } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAllCoursesOptions } from '../services/client/@tanstack/react-query.gen';

export type CourseMap = Record<string, Course>;

export function useCoursesMap(page = 0, pageSize = 1000) {
    const { data, isLoading } = useQuery(
        getAllCoursesOptions({
            query: { pageable: { page, size: pageSize } },
        })
    );

    const map: CourseMap = useMemo(() => {
        if (!data?.data?.content) return {};

        return data?.data?.content.reduce((acc: CourseMap, course: Course) => {
            if (course?.uuid) acc[course.uuid] = course;
            return acc;
        }, {});
    }, [data]);

    return { courseMap: map, courseList: data?.data?.content || [], isLoading };
}