import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForCourseOptions,
  getClassRatingSummaryOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course } from '../services/client/types.gen';
import type { BundledClass } from '../src/features/dashboard/courses/types';
import { useInstructorsByIds } from './use-batched-lookups';
import { toCount, useClassListingSummaries } from './use-class-listing-summaries';

type StudentLike =
  | {
    uuid?: string | null;
  }
  | null
  | undefined;

const SCHEDULE_PAGE_SIZE = 200;
// Keeps the page inside its request budget when a listing has unusually many classes.
const MAX_SCHEDULED_CLASSES = 12;

// Seat counts, instructors and catalogue rows come from batched lookups. `onlyClassUuid` (the
// enrolment page) narrows schedules to that class and adds its rating and full enrolment list.
function useBundledClassInfo(courseUuid?: string, student?: StudentLike, onlyClassUuid?: string) {
  const studentUuid = student?.uuid ?? undefined;

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
  // Inactive classes are never listed, so their schedules are not worth a request.
  const scheduleClasses = useMemo(
    () =>
      classes.filter(
        (cls): cls is ClassDefinition & { uuid: string } =>
          !!cls.uuid &&
          (onlyClassUuid === undefined ? cls.is_active !== false : cls.uuid === onlyClassUuid)
      ),
    [classes, onlyClassUuid]
  );
  const classUuids = useMemo(
    () => classes.map(cls => cls.uuid).filter((uuid): uuid is string => !!uuid),
    [classes]
  );

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid ?? '' } }),
    enabled: !!courseUuid,
  });
  const course: Course | null = courseQuery.data?.data ?? null;

  const scheduleState = useQueries({
    queries: scheduleClasses.slice(0, MAX_SCHEDULED_CLASSES).map(cls => ({
      ...getClassScheduleOptions({
        path: { uuid: cls.uuid },
        query: { pageable: { size: SCHEDULE_PAGE_SIZE } },
      }),
      staleTime: STALE_TIMES.live,
    })),
    combine: results => ({
      schedules: results.map(q => q.data?.data?.content ?? []),
      isLoading: results.some(q => q.isLoading || q.isFetching),
    }),
  });

  const ratingQuery = useQuery({
    ...getClassRatingSummaryOptions({ path: { uuid: onlyClassUuid ?? '' } }),
    enabled: !!onlyClassUuid,
  });
  const enrolmentQuery = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: onlyClassUuid ?? '' } }),
    enabled: !!onlyClassUuid,
  });

  const {
    summaryMap,
    enrolledClassUuids,
    catalogueMap,
    isLoading: isSummariesLoading,
  } = useClassListingSummaries(
    classUuids,
    courseUuid ? { course_uuid: courseUuid } : undefined,
    studentUuid
  );

  const instructorIds = useMemo(
    () =>
      scheduleClasses
        .map(cls => cls.default_instructor_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [scheduleClasses]
  );
  const { instructorMap, isLoading: isInstructorsLoading } = useInstructorsByIds(instructorIds);

  const scheduleIndex = useMemo(
    () => new Map(scheduleClasses.map((cls, index) => [cls.uuid, index])),
    [scheduleClasses]
  );
  const { schedules } = scheduleState;
  const classRating = ratingQuery.data?.data ?? null;
  const classEnrollments = enrolmentQuery.data?.data;

  const bundledClassInfo: BundledClass[] = useMemo(
    () =>
      classes.map(cls => {
        const i = cls.uuid ? scheduleIndex.get(cls.uuid) : undefined;
        const isDetail = !!cls.uuid && cls.uuid === onlyClassUuid;
        const found = cls.default_instructor_uuid
          ? instructorMap[cls.default_instructor_uuid]
          : undefined;
        return {
          ...cls,
          course: cls.course_uuid && cls.course_uuid === courseUuid ? course : null,
          // Card consumers still read the old `{ data }` response envelope.
          instructor: found ? { ...found, data: found } : null,
          schedule: i === undefined ? [] : (schedules[i] ?? []),
          enrollments: isDetail ? (classEnrollments ?? []) : [],
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
          classRating: isDetail ? classRating : null,
          enrolledCount: cls.uuid ? toCount(summaryMap[cls.uuid]?.enrolled_count) : null,
          isStudentEnrolled: cls.uuid ? enrolledClassUuids.has(cls.uuid) : false,
        };
      }),
    [
      catalogueMap,
      classes,
      classEnrollments,
      classRating,
      course,
      courseUuid,
      enrolledClassUuids,
      instructorMap,
      onlyClassUuid,
      scheduleIndex,
      schedules,
      summaryMap,
    ]
  );

  const isCoursesLoading = courseQuery.isLoading || courseQuery.isFetching;

  const loading =
    isLoading ||
    isFetching ||
    isCoursesLoading ||
    isInstructorsLoading ||
    scheduleState.isLoading ||
    isSummariesLoading;

  return {
    classes: bundledClassInfo,
    loading,
    isError,
  };
}

export default useBundledClassInfo;
