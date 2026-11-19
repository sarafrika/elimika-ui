import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForProgramOptions,
  getClassSchedulesOptions,
  getProgramCoursesOptions,
  getTrainingProgramByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition, ScheduledInstance } from '../services/client/types.gen';
import type { ProgramBundledClass } from '../src/features/dashboard/courses/types';
import { toCardInstructor, toCount, useClassListingSummaries } from './use-class-listing-summaries';
import { useClassSchedule } from './use-class-schedule';

const MAX_SCHEDULE_BATCHES = 5;

type StudentLike =
  | {
      uuid?: string | null;
    }
  | null
  | undefined;

// Seat counts, the learner's own enrolments, instructors and catalogue rows come from batched
// lookups. Listings batch undated classes' schedules; the enrolment page loads its class's.
function useProgramBundledClassInfo(
  programUuid?: string,
  student?: StudentLike,
  onlyClassUuid?: string
) {
  const studentUuid = student?.uuid ?? undefined;

  const { data, isLoading, isError, isFetching } = useQuery({
    ...getClassDefinitionsForProgramOptions({ path: { programUuid: programUuid ?? '' } }),
    enabled: !!programUuid,
  });
  const classes: ClassDefinition[] = useMemo(
    () =>
      (data?.error || data?.success === false ? [] : data?.data)
        ?.map(item => item?.class_definition)
        .filter((item): item is ClassDefinition => item !== undefined) ?? [],
    [data]
  );
  const classUuids = useMemo(
    () => classes.map(cls => cls.uuid).filter((uuid): uuid is string => !!uuid),
    [classes]
  );

  // Fill missing end dates in the background. Opening enrollment review does
  // not depend on this secondary request completing on the listing page.
  const scheduleBatches = useMemo(() => {
    if (onlyClassUuid) return [];
    const ids = classes.flatMap(cls =>
      cls.uuid && !cls.academic_period_end_date ? [cls.uuid] : []
    );
    const batches: string[][] = [];
    for (let index = 0; index < Math.min(ids.length, MAX_SCHEDULE_BATCHES * 100); index += 100)
      batches.push(ids.slice(index, index + 100));
    return batches;
  }, [classes, onlyClassUuid]);
  const listingSchedules = useQueries({
    queries: scheduleBatches.slice(0, MAX_SCHEDULE_BATCHES).map(ids => ({
      ...getClassSchedulesOptions({ query: { class_uuids: ids } }),
      enabled: ids.length > 0,
      staleTime: STALE_TIMES.live,
    })),
    combine: results => {
      const map = new Map<string, ScheduledInstance[]>();
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        if (!result?.isSuccess || result.data?.error || result.data?.success === false) continue;
        for (const uuid of scheduleBatches[index] ?? []) map.set(uuid, []);
        for (const session of result.data?.data ?? []) {
          if (session.class_definition_uuid) map.get(session.class_definition_uuid)?.push(session);
        }
      }
      return { map };
    },
  });

  const { data: pCourses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programUuid ?? '' } }),
    enabled: !!programUuid,
    staleTime: STALE_TIMES.entity,
  });

  const { data: program } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid ?? '' } }),
    enabled: !!programUuid,
    staleTime: STALE_TIMES.entity,
  });

  const detailSchedule = useClassSchedule(onlyClassUuid, !!onlyClassUuid);

  const {
    summaryMap,
    enrolledClassUuids,
    catalogueMap,
    isLoading: isSummariesLoading,
  } = useClassListingSummaries(
    classUuids,
    programUuid ? { program_uuid: programUuid } : undefined,
    studentUuid
  );

  const programCourses = pCourses?.data ?? null;
  const programData = program?.data ?? null;

  const bundledClassInfo: ProgramBundledClass[] = useMemo(
    () =>
      classes.map(cls => {
        const isDetail = !!cls.uuid && cls.uuid === onlyClassUuid;
        const summary = cls.uuid ? summaryMap[cls.uuid] : undefined;
        const schedule = cls.uuid ? listingSchedules.map.get(cls.uuid) : undefined;
        return {
          ...cls,
          course: cls.program_uuid ? programCourses : null,
          program: programData,
          instructor: toCardInstructor(summary, cls.default_instructor_uuid),
          schedule: isDetail ? detailSchedule.schedule : (schedule ?? []),
          scheduleLoaded: isDetail ? detailSchedule.isLoaded : schedule !== undefined,
          sessionCount:
            isDetail && detailSchedule.isLoaded
              ? detailSchedule.sessionCount
              : (schedule?.length ?? null),
          enrollments: [],
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
          enrolledCount: toCount(summary?.enrolled_count),
          isStudentEnrolled: cls.uuid ? enrolledClassUuids.has(cls.uuid) : false,
        };
      }),
    [
      catalogueMap,
      classes,
      detailSchedule.isLoaded,
      detailSchedule.schedule,
      detailSchedule.sessionCount,
      enrolledClassUuids,
      onlyClassUuid,
      programCourses,
      programData,
      summaryMap,
      listingSchedules.map,
    ]
  );

  const loading = isLoading || isFetching || detailSchedule.isLoading || isSummariesLoading;

  return {
    classes: bundledClassInfo,
    loading,
    isError,
    program: programData,
  };
}

export default useProgramBundledClassInfo;
