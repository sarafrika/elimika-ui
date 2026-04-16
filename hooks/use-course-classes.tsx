import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getClassDefinitionsForCourseOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getInstructorByUuidOptions,
  getStudentScheduleOptions,
  listCatalogItemsOptions,
} from '../services/client/@tanstack/react-query.gen';
import type {
  ClassDefinition,
  Course,
  Instructor,
  StudentSchedule,
} from '../services/client/types.gen';
import type { BundledClass } from '../src/features/dashboard/courses/types';

type StudentLike =
  | {
      uuid?: string | null;
    }
  | null
  | undefined;

function useBundledClassInfo(
  courseUuid?: string,
  startDate?: string,
  endDate?: string,
  student?: StudentLike
) {
  const studentUuid = student?.uuid ?? undefined;
  const scheduleRange = useMemo(
    () => ({
      start: startDate ? new Date(startDate) : new Date('2024-10-10'),
      end: endDate ? new Date(endDate) : new Date('2030-10-10'),
    }),
    [endDate, startDate]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    ...getClassDefinitionsForCourseOptions({ path: { courseUuid: courseUuid ?? '' } }),
    enabled: !!courseUuid,
  });
  const classes: ClassDefinition[] =
    data?.data
      ?.map(item => item?.class_definition)
      .filter((item): item is ClassDefinition => item !== undefined) ?? [];

  const courseQueries = useQueries({
    queries:
      classes.map(cls => ({
        ...getCourseByUuidOptions({ path: { uuid: cls.course_uuid ?? '' } }),
        enabled: !!cls.course_uuid,
      })) || [],
  });

  const scheduleQueries = useQueries({
    queries:
      classes.map(cls => ({
        ...getClassScheduleOptions({ path: { uuid: cls.uuid as string }, query: { pageable: {} } }),
        enabled: !!cls.course_uuid,
      })) || [],
  });

  const instructorQueries = useQueries({
    queries:
      classes.map(cls => ({
        ...getInstructorByUuidOptions({ path: { uuid: cls.default_instructor_uuid ?? '' } }),
        enabled: !!cls.default_instructor_uuid,
      })) || [],
  });

  // Fetch catalogue items
  const { data: catalogueData } = useQuery(listCatalogItemsOptions({}));
  const catalogueItems = catalogueData?.data ?? [];

  // Build a lookup map for catalogue by class_definition_uuid
  const catalogueMap = useMemo(
    () =>
      Object.fromEntries(catalogueItems.map(item => [item.class_definition_uuid, item])),
    [catalogueItems]
  );

  const { data: enrollmentsData } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentUuid as string },
      query: { start: scheduleRange.start, end: scheduleRange.end },
    }),
    enabled: !!studentUuid,
  });
  const enrollments: StudentSchedule[] = enrollmentsData?.data ?? [];

  const courses: Array<Course | null> = courseQueries.map(q => q.data?.data ?? null);
  const instructors: Array<Instructor | null> = instructorQueries.map(q => q.data ?? null);
  const schedules = scheduleQueries.map(q => q.data?.data?.content ?? []);

  const bundledClassInfo: BundledClass[] = useMemo(
    () =>
      classes.map((cls, i) => {
        const classEnrollments = enrollments.filter(en => en.class_definition_uuid === cls.uuid);

        return {
          ...cls,
          course: courses[i] ?? null,
          instructor: instructors[i] ?? null,
          schedule: schedules[i] ?? [],
          enrollments: classEnrollments,
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
        };
      }),
    [catalogueMap, classes, courses, enrollments, instructors, schedules]
  );

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
