import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForCourseOptions,
  getClassRatingSummaryOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course } from '../services/client/types.gen';
import type { BundledClass } from '../src/features/dashboard/courses/types';
import { toCardInstructor, toCount, useClassListingSummaries } from './use-class-listing-summaries';
import { useClassSchedule } from './use-class-schedule';

type StudentLike =
  | {
      uuid?: string | null;
    }
  | null
  | undefined;

// Seat counts, instructors and catalogue rows come from batched lookups and listings load no
// schedules (each card fetches its own on demand). `onlyClassUuid` (the enrolment page) adds that
// class's full schedule, rating and enrolment list.
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
  const classUuids = useMemo(
    () => classes.map(cls => cls.uuid).filter((uuid): uuid is string => !!uuid),
    [classes]
  );

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid ?? '' } }),
    enabled: !!courseUuid,
    staleTime: STALE_TIMES.entity,
  });
  const course: Course | null = courseQuery.data?.data ?? null;

  const detailSchedule = useClassSchedule(onlyClassUuid, !!onlyClassUuid);

  const ratingQuery = useQuery({
    ...getClassRatingSummaryOptions({ path: { uuid: onlyClassUuid ?? '' } }),
    enabled: !!onlyClassUuid,
    staleTime: STALE_TIMES.live,
  });
  const enrolmentQuery = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: onlyClassUuid ?? '' } }),
    enabled: !!onlyClassUuid,
    staleTime: STALE_TIMES.live,
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

  const classRating = ratingQuery.data?.data ?? null;
  const classEnrollments = enrolmentQuery.data?.data;

  const bundledClassInfo: BundledClass[] = useMemo(
    () =>
      classes.map(cls => {
        const isDetail = !!cls.uuid && cls.uuid === onlyClassUuid;
        const summary = cls.uuid ? summaryMap[cls.uuid] : undefined;
        return {
          ...cls,
          course: cls.course_uuid && cls.course_uuid === courseUuid ? course : null,
          instructor: toCardInstructor(summary, cls.default_instructor_uuid),
          schedule: isDetail ? detailSchedule.schedule : [],
          scheduleLoaded: isDetail && detailSchedule.isLoaded,
          sessionCount: isDetail && detailSchedule.isLoaded ? detailSchedule.sessionCount : null,
          enrollments: isDetail ? (classEnrollments ?? []) : [],
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
          classRating: isDetail ? classRating : null,
          enrolledCount: toCount(summary?.enrolled_count),
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
      detailSchedule.isLoaded,
      detailSchedule.schedule,
      detailSchedule.sessionCount,
      enrolledClassUuids,
      onlyClassUuid,
      summaryMap,
    ]
  );

  const loading =
    isLoading ||
    isFetching ||
    courseQuery.isLoading ||
    detailSchedule.isLoading ||
    isSummariesLoading;

  return {
    classes: bundledClassInfo,
    loading,
    isError,
  };
}

export default useBundledClassInfo;
