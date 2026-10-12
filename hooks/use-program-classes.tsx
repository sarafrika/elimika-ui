import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForProgramOptions,
  getProgramCoursesOptions,
  getTrainingProgramByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition } from '../services/client/types.gen';
import type { ProgramBundledClass } from '../src/features/dashboard/courses/types';
import { toCardInstructor, toCount, useClassListingSummaries } from './use-class-listing-summaries';
import { useClassSchedule } from './use-class-schedule';

type StudentLike =
  | {
      uuid?: string | null;
    }
  | null
  | undefined;

// Seat counts, the learner's own enrolments, instructors and catalogue rows come from batched
// lookups. Listings load no schedules; `onlyClassUuid` (the enrolment page) loads that class's.
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
      data?.data
        ?.map(item => item?.class_definition)
        .filter((item): item is ClassDefinition => item !== undefined) ?? [],
    [data]
  );
  const classUuids = useMemo(
    () => classes.map(cls => cls.uuid).filter((uuid): uuid is string => !!uuid),
    [classes]
  );

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
        return {
          ...cls,
          course: cls.program_uuid ? programCourses : null,
          program: programData,
          instructor: toCardInstructor(summary, cls.default_instructor_uuid),
          schedule: isDetail ? detailSchedule.schedule : [],
          scheduleLoaded: isDetail && detailSchedule.isLoaded,
          sessionCount: isDetail && detailSchedule.isLoaded ? detailSchedule.sessionCount : null,
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
