import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForProgramOptions,
  getClassScheduleOptions,
  getProgramCoursesOptions,
  getTrainingProgramByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition } from '../services/client/types.gen';
import type { ProgramBundledClass } from '../src/features/dashboard/courses/types';
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

// Seat counts, the learner's own enrolments, instructors and catalogue rows come from batched
// lookups; `onlyClassUuid` (the enrolment page) narrows schedules to that one class.
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

  const { data: pCourses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programUuid ?? '' } }),
    enabled: !!programUuid,
  });

  const { data: program } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid ?? '' } }),
    enabled: !!programUuid,
  });

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

  const instructorIds = useMemo(
    () =>
      scheduleClasses
        .map(cls => cls.default_instructor_uuid)
        .filter((uuid): uuid is string => !!uuid),
    [scheduleClasses]
  );
  const { instructorMap, isLoading: isInstructorsLoading } = useInstructorsByIds(instructorIds);

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

  const scheduleIndex = useMemo(
    () => new Map(scheduleClasses.map((cls, index) => [cls.uuid, index])),
    [scheduleClasses]
  );
  const { schedules } = scheduleState;
  const programCourses = pCourses?.data ?? null;
  const programData = program?.data ?? null;

  const bundledClassInfo: ProgramBundledClass[] = useMemo(
    () =>
      classes.map(cls => {
        const i = cls.uuid ? scheduleIndex.get(cls.uuid) : undefined;
        const found = cls.default_instructor_uuid
          ? instructorMap[cls.default_instructor_uuid]
          : undefined;
        return {
          ...cls,
          course: cls.program_uuid ? programCourses : null,
          program: programData,
          // Card consumers still read the old `{ data }` response envelope.
          instructor: found ? { ...found, data: found } : null,
          schedule: i === undefined ? [] : (schedules[i] ?? []),
          enrollments: [],
          catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
          enrolledCount: cls.uuid ? toCount(summaryMap[cls.uuid]?.enrolled_count) : null,
          isStudentEnrolled: cls.uuid ? enrolledClassUuids.has(cls.uuid) : false,
        };
      }),
    [
      catalogueMap,
      classes,
      enrolledClassUuids,
      instructorMap,
      programCourses,
      programData,
      scheduleIndex,
      schedules,
      summaryMap,
    ]
  );

  const loading =
    isLoading ||
    isFetching ||
    isInstructorsLoading ||
    scheduleState.isLoading ||
    isSummariesLoading;

  return {
    classes: bundledClassInfo,
    loading,
    isError,
    program: programData,
  };
}

export default useProgramBundledClassInfo;
