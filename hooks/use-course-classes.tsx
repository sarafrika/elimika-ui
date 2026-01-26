import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getClassDefinitionsForCourseOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getInstructorByUuidOptions,
  getStudentScheduleOptions,
  listCatalogItemsOptions,
} from '../services/client/@tanstack/react-query.gen';

function useBundledClassInfo(courseUuid?: string, startDate?: any, endDate?: any, student?: any) {
  const { data, isLoading, isError, isFetching } = useQuery({
    ...getClassDefinitionsForCourseOptions({ path: { courseUuid: courseUuid ?? '' } }),
    enabled: !!courseUuid,
  });
  const classes = data?.data?.map(item => item?.class_definition) ?? [];

  const courseQueries = useQueries({
    queries:
      classes.map((cls: any) => ({
        ...getCourseByUuidOptions({ path: { uuid: cls.course_uuid } }),
        enabled: !!cls.course_uuid,
      })) || [],
  });

  const scheduleQueries = useQueries({
    queries:
      classes.map((cls: any) => ({
        ...getClassScheduleOptions({ path: { uuid: cls.uuid as string }, query: { pageable: {} } }),
        enabled: !!cls.course_uuid,
      })) || [],
  });

  const instructorQueries = useQueries({
    queries:
      classes.map((cls: any) => ({
        ...getInstructorByUuidOptions({ path: { uuid: cls.default_instructor_uuid } }),
        enabled: !!cls.default_instructor_uuid,
      })) || [],
  });

  // Fetch catalogue items
  const { data: catalogueData } = useQuery(listCatalogItemsOptions({}));
  const catalogueItems = catalogueData?.data ?? [];

  // Build a lookup map for catalogue by class_definition_uuid
  const catalogueMap = Object.fromEntries(
    catalogueItems.map((item: any) => [item.class_definition_uuid, item])
  );

  const { data: enrollmentsData } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: startDate ?? '2024-10-10', end: endDate ?? '2030-10-10' },
    }),
    enabled: !!student?.uuid,
  });
  const enrollments = enrollmentsData?.data ?? [];

  const courses = courseQueries.map(q => q.data?.data ?? null);
  // @ts-expect-error
  const instructors = instructorQueries.map(q => q.data?.data ?? null);
  const schedules = scheduleQueries.map(q => q.data?.data?.content ?? null);

  const bundledClassInfo = classes.map((cls: any, i: number) => {
    const classEnrollments = enrollments.filter((en: any) => en.class_definition_uuid === cls.uuid);

    return {
      ...cls,
      course: courses[i],
      instructor: instructors[i],
      schedule: schedules[i],
      enrollments: classEnrollments,
      catalogue: catalogueMap[cls.uuid] ?? null,
    };
  });

  // Compute combined loading states
  const isCoursesLoading = courseQueries.some(q => q.isLoading || q.isFetching);
  const isInstructorsLoading = instructorQueries.some(q => q.isLoading || q.isFetching);
  const isSchedulesLoading = scheduleQueries.some(q => q.isLoading || q.isFetching);

  const loading =
    isLoading || isFetching || isCoursesLoading || isInstructorsLoading || isSchedulesLoading;

  return {
    classes: bundledClassInfo,
    loading,
    isError,
  };
}

export default useBundledClassInfo;
