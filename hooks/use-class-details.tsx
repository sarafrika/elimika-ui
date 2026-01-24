import { useQuery } from '@tanstack/react-query';
import { getClassDefinitionOptions, getClassScheduleOptions, getCourseByUuidOptions, getCourseLessonsOptions } from '../services/client/@tanstack/react-query.gen';

export const useClassDetails = (classId?: string) => {
    // 1️⃣ Fetch class definition
    const {
        data: classDefinitionData,
        isLoading: isLoadingClass,
        isError: isClassError,
    } = useQuery({
        ...getClassDefinitionOptions({
            path: { uuid: classId as string },
        }),
        enabled: !!classId,
    });

    const classDefinition = classDefinitionData?.data?.class_definition;
    const courseUuid = classDefinition?.course_uuid;

    // 2️⃣ Fetch class schedule
    const {
        data: classScheduleData,
        isLoading: isLoadingSchedule,
    } = useQuery({
        ...getClassScheduleOptions({
            path: { uuid: classId as string },
            query: { pageable: {} },
        }),
        enabled: !!classId,
    });

    // 3️⃣ Fetch course details
    const {
        data: courseDetailData,
        isLoading: isLoadingCourse,
    } = useQuery({
        ...getCourseByUuidOptions({
            path: { uuid: courseUuid as string },
        }),
        enabled: !!courseUuid,
    });

    // 4️⃣ Fetch course lessons
    const {
        data: courseLessonsData,
        isLoading: isLoadingLessons,
    } = useQuery({
        ...getCourseLessonsOptions({
            path: { courseUuid: courseUuid as string },
            query: { pageable: {} },
        }),
        enabled: !!courseUuid,
    });

    // 🧩 Combined loading state
    const isLoading =
        isLoadingClass ||
        isLoadingSchedule ||
        isLoadingCourse ||
        isLoadingLessons;

    return {
        data: {
            class: classDefinition,
            schedule: classScheduleData?.data?.content ?? [],
            course: courseDetailData?.data,
            lessons: courseLessonsData?.data?.content ?? [],
        },
        isLoading,
        isError: isClassError,
    };
};
