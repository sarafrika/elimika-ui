import { STALE_TIMES } from '@/lib/query-client';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getClassDefinitionsForCourseOptions,
  getClassRatingSummaryOptions,
  getClassSchedulesOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course, ScheduledInstance } from '../services/client/types.gen';
import type { BundledClass } from '../src/features/dashboard/courses/types';
import { ACTIVE_ENROLLMENT_STATUSES } from '../src/features/dashboard/instructor-overview/overview-enrollments';
import { toCardInstructor, toCount, useClassListingSummaries } from './use-class-listing-summaries';
import { useClassSchedule } from './use-class-schedule';

// Backend cap on class_uuids for GET /classes/schedules (ClassScheduleBatchService.MAX_BATCH_SIZE).
const MAX_CLASSES_PER_CALL = 100;
const MAX_SCHEDULE_BATCHES = 5;

type StudentLike =
  | {
    uuid?: string | null;
  }
  | null
  | undefined;

// Seat counts, instructors and catalogue rows come from batched lookups. Learner listings batch
// schedules for classes with no end date in one call; `onlyClassUuid` (the enrolment page) adds
// that class's full schedule, rating and enrolment list.
function useBundledClassInfo(courseUuid?: string, student?: StudentLike, onlyClassUuid?: string) {
  const studentUuid = student?.uuid ?? undefined;
  const { activeDomain } = useUserDomain();
  const isLearnerDomain = activeDomain === 'student' || activeDomain === 'parent';

  const { data, isLoading, isError, isFetching } = useQuery({
    ...getClassDefinitionsForCourseOptions({ path: { courseUuid: courseUuid ?? '' } }),
    enabled: !!courseUuid,
  });
  const classes: ClassDefinition[] = useMemo(
    () =>
      data?.error || data?.success === false
        ? []
        : (data?.data
          ?.map(item => item?.class_definition)
          .filter((item): item is ClassDefinition => item !== undefined) ?? []),
    [data]
  );
  // The enrolment page summarises only its own class; listings summarise every class.
  const classUuids = useMemo(
    () =>
      onlyClassUuid
        ? [onlyClassUuid]
        : classes.map(cls => cls.uuid).filter((uuid): uuid is string => !!uuid),
    [classes, onlyClassUuid]
  );

  // End state gates enrolment for learners, so undated classes need their schedule up front.
  const undatedClassUuids = useMemo(() => {
    if (onlyClassUuid || !isLearnerDomain) return [];
    const undated = new Set(
      classes.filter(cls => !cls.academic_period_end_date).map(cls => cls.uuid)
    );
    return classUuids.filter(uuid => undated.has(uuid)).sort();
  }, [classUuids, classes, isLearnerDomain, onlyClassUuid]);
  const schedulesTooLarge = undatedClassUuids.length > MAX_CLASSES_PER_CALL * MAX_SCHEDULE_BATCHES;
  const scheduleBatches = useMemo(
    () =>
      schedulesTooLarge
        ? []
        : Array.from(
          { length: Math.ceil(undatedClassUuids.length / MAX_CLASSES_PER_CALL) },
          (_, index) =>
            undatedClassUuids.slice(
              index * MAX_CLASSES_PER_CALL,
              (index + 1) * MAX_CLASSES_PER_CALL
            )
        ),
    [undatedClassUuids, schedulesTooLarge]
  );

  const schedulesQuery = useQueries({
    queries: scheduleBatches.slice(0, MAX_SCHEDULE_BATCHES).map(ids => ({
      ...getClassSchedulesOptions({ query: { class_uuids: ids } }),
      staleTime: STALE_TIMES.live,
    })),
    combine: results => {
      const map = new Map<string, ScheduledInstance[]>();
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        if (!result?.isSuccess || result.data?.error || result.data?.success === false) continue;
        for (const uuid of scheduleBatches[index] ?? []) map.set(uuid, []);
        for (const instance of result.data?.data ?? []) {
          if (instance.class_definition_uuid)
            map.get(instance.class_definition_uuid)?.push(instance);
        }
      }
      return {
        map,
        isPending: results.some(result => result.isPending),
        isError: results.some(
          result => result.isError || result.data?.error || result.data?.success === false
        ),
      };
    },
  });
  const batchedSchedules = schedulesQuery.map;

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
    isError: isSummariesError,
  } = useClassListingSummaries(
    classUuids,
    courseUuid ? { course_uuid: courseUuid } : undefined,
    onlyClassUuid ? undefined : studentUuid
  );

  const classRating = ratingQuery.data?.data ?? null;
  const classEnrollments = enrolmentQuery.data?.data;
  // On the enrolment page the class's own enrolment list (shared with the page) answers this.
  const enrolledInDetail = useMemo(
    () =>
      !!studentUuid &&
      (classEnrollments ?? []).some(
        item =>
          item.student_uuid === studentUuid &&
          ACTIVE_ENROLLMENT_STATUSES.has(String(item.status ?? 'ENROLLED').toUpperCase())
      ),
    [classEnrollments, studentUuid]
  );

  const bundledClassInfo: BundledClass[] = useMemo(
    () =>
      classes.map(cls => {
        const isDetail = !!cls.uuid && cls.uuid === onlyClassUuid;
        const summary = cls.uuid ? summaryMap[cls.uuid] : undefined;
        const batched = cls.uuid ? batchedSchedules.get(cls.uuid) : undefined;
        return {
          ...cls,
          course: cls.course_uuid && cls.course_uuid === courseUuid ? course : null,
          instructor: toCardInstructor(summary, cls.default_instructor_uuid),
          schedule: isDetail ? detailSchedule.schedule : (batched ?? []),
          scheduleLoaded: isDetail ? detailSchedule.isLoaded : batched !== undefined,
          sessionCount: isDetail
            ? detailSchedule.isLoaded
              ? detailSchedule.sessionCount
              : null
            : (batched?.length ?? null),
          enrollments: isDetail ? (classEnrollments ?? []) : [],
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
          classRating: isDetail ? classRating : null,
          enrolledCount: toCount(summary?.enrolled_count),
          isStudentEnrolled: isDetail
            ? enrolledInDetail
            : cls.uuid
              ? enrolledClassUuids.has(cls.uuid)
              : false,
        };
      }),
    [
      batchedSchedules,
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
      enrolledInDetail,
      onlyClassUuid,
      summaryMap,
    ]
  );

  const loading =
    isLoading ||
    isFetching ||
    courseQuery.isLoading ||
    detailSchedule.isLoading ||
    schedulesQuery.isPending ||
    isSummariesLoading;

  return {
    classes: bundledClassInfo,
    loading,
    isError:
      isError ||
      Boolean(data?.error || data?.success === false) ||
      schedulesTooLarge ||
      schedulesQuery.isError ||
      isSummariesError,
  };
}

export default useBundledClassInfo;
