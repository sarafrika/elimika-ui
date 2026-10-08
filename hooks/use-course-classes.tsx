import { localDate } from '@/lib/date';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useInstructorsByIds } from './use-batched-lookups';
import {
  getClassDefinitionsForCourseOptions,
  getClassRatingSummaryOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
  listCatalogItemsOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course } from '../services/client/types.gen';
import type { BundledClass } from '../src/features/dashboard/courses/types';

type StudentLike =
  | {
    uuid?: string | null;
  }
  | null
  | undefined;

const SCHEDULE_PAGE_SIZE = 200;

/** `onlyClassUuid` limits the per-class schedule, rating, enrolment and instructor lookups. */
function useBundledClassInfo(
  courseUuid?: string,
  startDate?: string,
  endDate?: string,
  student?: StudentLike,
  onlyClassUuid?: string
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
  const classes: ClassDefinition[] = useMemo(
    () =>
      data?.data
        ?.map(item => item?.class_definition)
        .filter((item): item is ClassDefinition => item !== undefined) ?? [],
    [data]
  );
  const detailClasses = useMemo(
    () =>
      classes.filter(
        (cls): cls is ClassDefinition & { uuid: string } =>
          !!cls.uuid && (onlyClassUuid === undefined || cls.uuid === onlyClassUuid)
      ),
    [classes, onlyClassUuid]
  );

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid ?? '' } }),
    enabled: !!courseUuid,
  });
  const course: Course | null = courseQuery.data?.data ?? null;

  const scheduleQueries = useQueries({
    queries: detailClasses.map(cls => ({
      ...getClassScheduleOptions({
        path: { uuid: cls.uuid },
        query: { pageable: { size: SCHEDULE_PAGE_SIZE } },
      }),
      enabled: !!cls.course_uuid,
    })),
  });

  const classRatingSummaryQueries = useQueries({
    queries: detailClasses.map(cls => ({
      ...getClassRatingSummaryOptions({ path: { uuid: cls.uuid } }),
      enabled: !!cls.uuid,
    })),
  });

  const classEnrolmentQueries = useQueries({
    queries: detailClasses.map(cls => ({
      ...getEnrollmentsForClassOptions({ path: { uuid: cls.uuid } }),
      enabled: !!cls.uuid,
    })),
  });

  const instructorIds = useMemo(
    () =>
      detailClasses
        .map(cls => cls.default_instructor_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [detailClasses]
  );
  const { instructorMap, isLoading: isInstructorsLoading } = useInstructorsByIds(instructorIds);

  // Fetch catalogue items
  const { data: catalogueData } = useQuery(listCatalogItemsOptions({}));
  const catalogueItems = catalogueData?.data ?? [];

  // Build a lookup map for catalogue by class_definition_uuid
  const catalogueMap = useMemo(
    () => Object.fromEntries(catalogueItems.map(item => [item.class_definition_uuid, item])),
    [catalogueItems]
  );

  const detailIndex = useMemo(
    () => new Map(detailClasses.map((cls, index) => [cls.uuid, index])),
    [detailClasses]
  );
  const schedules = scheduleQueries.map(q => q.data?.data?.content ?? []);
  const classRatingSummary = classRatingSummaryQueries.map(q => q.data?.data ?? null);
  const classEnrollments = classEnrolmentQueries.map(q => q.data?.data ?? null);

  const bundledClassInfo: BundledClass[] = useMemo(
    () =>
      classes.map(cls => {
        const i = cls.uuid ? detailIndex.get(cls.uuid) : undefined;
        const found = cls.default_instructor_uuid
          ? instructorMap[cls.default_instructor_uuid]
          : undefined;
        return {
          ...cls,
          course: cls.course_uuid && cls.course_uuid === courseUuid ? course : null,
          // Card consumers still read the old `{ data }` response envelope.
          instructor: found ? { ...found, data: found } : null,
          schedule: i === undefined ? [] : (schedules[i] ?? []),
          enrollments: i === undefined ? [] : (classEnrollments[i] ?? []),
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
          classRating: i === undefined ? null : (classRatingSummary[i] ?? null),
        };
      }),
    [
      catalogueMap,
      classes,
      course,
      courseUuid,
      classEnrollments,
      classRatingSummary,
      detailIndex,
      instructorMap,
      schedules,
    ]
  );

  // Compute combined loading states
  const isCoursesLoading = courseQuery.isLoading || courseQuery.isFetching;
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
