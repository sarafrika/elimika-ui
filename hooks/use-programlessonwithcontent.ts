import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
    getAllContentTypesOptions,
    getCourseLessonsOptions,
    getLessonContentOptions,
} from '../services/client/@tanstack/react-query.gen';

export function useProgramLessonsWithContent({ programUuid, programCourses }: { programUuid: string, programCourses: any }) {
    // Flatten all courses in the program
    const courseList = programCourses || [];

    // Fetch lessons for each course
    const courseLessonsQueries = useQueries({
        queries: courseList.map(course => ({
            ...getCourseLessonsOptions({
                path: { courseUuid: course.uuid },
                query: { pageable: {} },
            }),
            enabled: !!course.uuid,
            queryKey: ['courseLessons', course.uuid],
        })),
    });

    // For each course, fetch content for each lesson
    const allLessonContentQueries = useQueries({
        queries: courseLessonsQueries.flatMap((q, courseIndex) => {
            const lessons = q.data?.data?.content || [];
            return lessons.map(lesson => ({
                ...getLessonContentOptions({
                    path: {
                        courseUuid: courseList[courseIndex].uuid,
                        lessonUuid: lesson.uuid,
                    },
                }),
                enabled: !!lesson.uuid,
                queryKey: ['lessonContent', lesson.uuid],
            }));
        }),
    });

    // Aggregate loading states
    const isLessonsLoading = courseLessonsQueries.some(q => q.isLoading);
    const isLessonsFetching = courseLessonsQueries.some(q => q.isFetching);

    const isLessonContentLoading = allLessonContentQueries.some(q => q.isLoading);
    const isLessonContentFetching = allLessonContentQueries.some(q => q.isFetching);

    const isAllDataLoading = isLessonsLoading || isLessonContentLoading;
    const isAllDataFetching = isLessonsFetching || isLessonContentFetching;

    // Map lessons with content per course
    let contentIndex = 0; // keep track of content query index
    const coursesWithLessons = courseList.map((course, courseIndex) => {
        const lessons = courseLessonsQueries[courseIndex].data?.data?.content || [];
        const lessonsWithContent = lessons.map(lesson => {
            const content = allLessonContentQueries[contentIndex]?.data;
            contentIndex += 1;
            return { lesson, content };
        });
        return { course, lessons: lessonsWithContent };
    });

    // Fetch content types (same as course hook)
    const { data: contentTypeList, isFetching: contentTypeFetching } = useQuery(
        getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
    );

    const contentTypeData = useMemo(() => {
        const content = contentTypeList?.data?.content;
        return Array.isArray(content) ? content : [];
    }, [contentTypeList]);

    const contentTypeMap = useMemo(() => {
        return Object.fromEntries(contentTypeData.map(ct => [ct.uuid, ct.name.toLowerCase()]));
    }, [contentTypeData]);

    return {
        isLoading: isAllDataLoading,
        isFetching: isAllDataFetching || contentTypeFetching,
        coursesWithLessons,
        contentTypes: contentTypeData,
        contentTypeMap,
    };
}
