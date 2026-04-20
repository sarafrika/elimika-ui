import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getClassDefinitionsForProgramOptions,
  getClassScheduleOptions,
  getInstructorByUuidOptions,
  getProgramCoursesOptions,
  getStudentScheduleOptions,
  listCatalogItemsOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Instructor, StudentSchedule } from '../services/client/types.gen';
import type { ProgramBundledClass } from '../src/features/dashboard/courses/types';

type StudentLike =
  | {
    uuid?: string | null;
  }
  | null
  | undefined;

function useProgramBundledClassInfo(
  programUuid?: string,
  startDate?: string,
  endDate?: string,
  student?: StudentLike
) {
  const scheduleStart = startDate ? new Date(startDate) : new Date('2024-10-10');
  const scheduleEnd = endDate ? new Date(endDate) : new Date('2030-10-10');

  // Fetch class definitions
  const { data, isLoading, isError, isFetching } = useQuery({
    ...getClassDefinitionsForProgramOptions({ path: { programUuid: programUuid ?? '' } }),
    enabled: !!programUuid,
  });
  const classes: ClassDefinition[] =
    data?.data
      ?.map(item => item?.class_definition)
      .filter((item): item is ClassDefinition => item !== undefined) ?? [];

  // Fetch program courses
  const { data: pCourses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programUuid as string } }),
    enabled: !!programUuid,
  });

  // Extract unique instructor UUIDs to avoid duplicate fetches
  const uniqueInstructorUuids = useMemo(() => {
    const uuids = new Set<string>();
    classes.forEach(cls => {
      if (cls.default_instructor_uuid) {
        uuids.add(cls.default_instructor_uuid);
      }
    });
    return Array.from(uuids);
  }, [classes]);

  // Fetch schedules for each class
  const scheduleQueries = useQueries({
    queries: classes.map(cls => ({
      ...getClassScheduleOptions({ path: { uuid: cls.uuid as string }, query: { pageable: {} } }),
      enabled: !!cls.uuid,
    })),
  });

  // Fetch unique instructors only
  const instructorQueries = useQueries({
    queries: uniqueInstructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  // Fetch catalogue items
  const { data: catalogueData } = useQuery(listCatalogItemsOptions({}));
  const catalogueItems = catalogueData?.data ?? [];

  // Build a lookup map for catalogue by class_definition_uuid
  const catalogueMap = useMemo(
    () => Object.fromEntries(catalogueItems.map(item => [item.class_definition_uuid, item])),
    [catalogueItems]
  );

  // Fetch student enrollments
  const { data: enrollmentsData } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: scheduleStart, end: scheduleEnd },
    }),
    enabled: !!student?.uuid,
  });
  const enrollments: StudentSchedule[] = enrollmentsData?.data ?? [];

  const instructorMap = useMemo(() => {
    const map = new Map<string, Instructor>();
    uniqueInstructorUuids.forEach((uuid, index) => {
      const instructorData = instructorQueries[index]?.data;
      if (instructorData) {
        map.set(uuid, instructorData);
      }
    });
    return map;
  }, [uniqueInstructorUuids, instructorQueries]);

  // Get schedules directly (no deduplication needed as each class has unique schedule)
  const schedules = useMemo(
    () => scheduleQueries.map(q => q.data?.data?.content ?? []),
    [scheduleQueries]
  );

  // Bundle all class information
  const bundledClassInfo = useMemo(() => {
    return classes.map((cls, i): ProgramBundledClass => {
      const classEnrollments = enrollments.filter(en => en.class_definition_uuid === cls.uuid);

      return {
        ...cls,
        course: cls.program_uuid ? (pCourses?.data ?? null) : null,
        instructor: cls.default_instructor_uuid
          ? (instructorMap.get(cls.default_instructor_uuid) ?? null)
          : null,
        schedule: schedules[i] ?? [],
        enrollments: classEnrollments,
        catalogue: cls.uuid ? (catalogueMap[cls.uuid] ?? null) : null,
      };
    });
  }, [classes, instructorMap, schedules, enrollments, catalogueMap]);

  // Compute combined loading states
  const isInstructorsLoading = instructorQueries.some(q => q.isLoading || q.isFetching);
  const isSchedulesLoading = scheduleQueries.some(q => q.isLoading || q.isFetching);

  const loading = isLoading || isFetching || isInstructorsLoading || isSchedulesLoading;

  return {
    classes: bundledClassInfo,
    loading,
    isError,
    // Additional useful data
  };
}

export default useProgramBundledClassInfo;
