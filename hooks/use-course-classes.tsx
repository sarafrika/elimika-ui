import { useQueries, useQuery } from '@tanstack/react-query';
import {
    getClassDefinitionsForCourseOptions,
    getCourseByUuidOptions,
    getInstructorByUuidOptions,
    previewRecurringClassScheduleOptions,
} from '../services/client/@tanstack/react-query.gen';

function useCourseClassesWithDetails(courseUuid?: string, startDate?: any, endDate?: any) {
    const { data, isLoading, isError, isFetching } = useQuery({
        ...getClassDefinitionsForCourseOptions({ path: { courseUuid: courseUuid ?? '' } }), enabled: !!courseUuid,
    });
    const classes = data?.data ?? [];

    const courseQueries = useQueries({
        queries:
            classes.map((cls: any) => ({
                ...getCourseByUuidOptions({
                    path: { uuid: cls.course_uuid },
                }),
                enabled: !!cls.course_uuid,
            })) || [],
    });

    const instructorQueries = useQueries({
        queries:
            classes.map((cls: any) => ({
                ...getInstructorByUuidOptions({
                    path: { uuid: cls.default_instructor_uuid },
                }),
                enabled: !!cls.default_instructor_uuid,
            })) || [],
    });

    // Fetch schedules for each class using useQueries
    const scheduleQueries = useQueries({
        queries:
            classes.map((cls: any) => ({
                ...previewRecurringClassScheduleOptions({
                    path: { uuid: cls.uuid }, query: { startDate, endDate }
                }),
                enabled: !!cls.uuid && !!startDate && !!endDate,
            })) || [],
    });

    const courses = courseQueries.map((q) => q.data?.data ?? null);
    // @ts-ignore
    const instructors = instructorQueries.map((q) => q.data?.data ?? null);
    const schedules = scheduleQueries.map((q) => q.data?.data ?? null);

    const classesWithCourseAndInstructor = classes.map((cls: any, i: number) => ({
        ...cls,
        course: courses[i],
        instructor: instructors[i],
        schedule: schedules[i], // added schedule here
    }));

    const isCoursesLoading = courseQueries.some((q) => q.isLoading || q.isFetching);
    const isInstructorsLoading = instructorQueries.some((q) => q.isLoading || q.isFetching);
    const isSchedulesLoading = scheduleQueries.some((q) => q.isLoading || q.isFetching);

    const loading = isLoading || isFetching || isCoursesLoading || isInstructorsLoading || isSchedulesLoading;

    return {
        classes: classesWithCourseAndInstructor,
        loading,
        isError,
    };
}

export default useCourseClassesWithDetails;