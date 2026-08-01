import { localDate } from '@/lib/date';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getClassDefinitionsForCourseOptions,
  getClassRatingSummaryOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
  getInstructorByUuidOptions,
  listCatalogItemsOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course, Instructor } from '../services/client/types.gen';
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
      start: localDate(startDate ?? '2024-10-10'),
      end: localDate(endDate ?? '2030-10-10'),
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
        ...getClassScheduleOptions({
          path: { uuid: cls.uuid as string },
          query: { pageable: { size: 1000 } },
        }),
        enabled: !!cls.course_uuid,
      })) || [],
  });

  const classRatingSummaryQueries = useQueries({
    queries:
      classes.map(cls => ({
        ...getClassRatingSummaryOptions({ path: { uuid: cls.uuid as string } }),
        enabled: !!cls.uuid,
      })) || [],
  });

  const classEnrolmentQueries = useQueries({
    queries:
      classes.map(cls => ({
        ...getEnrollmentsForClassOptions({ path: { uuid: cls.uuid as string } }),
        enabled: !!cls.uuid,
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
    () => Object.fromEntries(catalogueItems.map(item => [item.class_definition_uuid, item])),
    [catalogueItems]
  );

  const courses: Array<Course | null> = courseQueries.map(q => q.data?.data ?? null);
  const instructors: Array<Instructor | null> = instructorQueries.map(q => q.data ?? null);
  const schedules = scheduleQueries.map(q => q.data?.data?.content ?? []);
  const classRatingSummary = classRatingSummaryQueries.map(q => q.data?.data ?? null);
  const classEnrollments = classEnrolmentQueries.map(q => q.data?.data ?? null);

  const bundledClassInfo: BundledClass[] = useMemo(
    () =>
      classes.map((cls, i) => {
        return {
          ...cls,
          course: courses[i] ?? null,
          instructor: instructors[i] ?? null,
          schedule: schedules[i] ?? [],
          enrollments: classEnrollments[i] ?? [],
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
          classRating: classRatingSummary[i] ?? null,
        };
      }),
    [catalogueMap, classes, courses, classEnrollments, instructors, schedules]
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
