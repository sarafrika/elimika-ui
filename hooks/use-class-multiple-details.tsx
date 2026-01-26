import { useQueries } from '@tanstack/react-query';
import {
    getClassDefinitionOptions,
    getCourseByUuidOptions
} from '../services/client/@tanstack/react-query.gen';

export const useMultipleClassDetails = (classUuids: string[] = []) => {
    // 1️⃣ Class definitions
    const classDefinitionQueries = useQueries({
        queries: classUuids.map(uuid => ({
            ...getClassDefinitionOptions({
                path: { uuid },
            }),
            enabled: !!uuid,
        })),
    });

    const classDefinitions = classDefinitionQueries
        .map(q => q.data?.data?.class_definition)
        .filter(Boolean);

    // 2️⃣ Schedules (per class)
    //   const scheduleQueries = useQueries({
    //     queries: classUuids.map(uuid => ({
    //       ...getClassScheduleOptions({
    //         path: { uuid },
    //         query: { pageable: {} },
    //       }),
    //       enabled: !!uuid,
    //     })),
    //   });

    // 3️⃣ Enrollments (if different endpoint, swap here)
    //   const enrollmentQueries = useQueries({
    //     queries: classUuids.map(uuid => ({
    //       ...getClassScheduleOptions({
    //         path: { uuid },
    //         query: { pageable: {} },
    //       }),
    //       enabled: !!uuid,
    //     })),
    //   });

    // 4️⃣ Courses
    const courseQueries = useQueries({
        queries: classDefinitions.map(def => ({
            ...getCourseByUuidOptions({
                path: { uuid: def.course_uuid },
            }),
            enabled: !!def?.course_uuid,
        })),
    });

    // 5️⃣ Course lessons
    //   const lessonQueries = useQueries({
    //     queries: classDefinitions.map(def => ({
    //       ...getCourseLessonsOptions({
    //         path: { courseUuid: def.course_uuid },
    //         query: { pageable: {} },
    //       }),
    //       enabled: !!def?.course_uuid,
    //     })),
    //   });

    const isLoading = [
        ...classDefinitionQueries,
        ...courseQueries,
        // ...scheduleQueries,
        // ...enrollmentQueries,
        // ...lessonQueries,
    ].some(q => q.isLoading);

    return {
        data: classUuids.map((uuid, index) => ({
            class: classDefinitions[index],
            course: courseQueries[index]?.data?.data ?? null,
            //   schedule: scheduleQueries[index]?.data?.data?.content ?? [],
            //   enrollments: enrollmentQueries[index]?.data?.data?.content ?? [],
            //   lessons: lessonQueries[index]?.data?.data?.content ?? [],
        })),
        isLoading,
    };
};
