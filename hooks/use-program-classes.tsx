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

function useProgramBundledClassInfo(
  programUuid?: string,
  startDate?: any,
  endDate?: any,
  student?: any
) {
  // Fetch class definitions
  const { data, isLoading, isError, isFetching } = useQuery({
    ...getClassDefinitionsForProgramOptions({ path: { programUuid: programUuid ?? '' } }),
    enabled: !!programUuid,
  });
  const classes = data?.data?.map(item => item?.class_definition) ?? [];

  // Fetch program courses
  const { data: pCourses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programUuid as string } }),
    enabled: !!programUuid,
  });

  // Extract unique instructor UUIDs to avoid duplicate fetches
  const uniqueInstructorUuids = useMemo(() => {
    const uuids = new Set<string>();
    classes.forEach((cls: any) => {
      if (cls.default_instructor_uuid) {
        uuids.add(cls.default_instructor_uuid);
      }
    });
    return Array.from(uuids);
  }, [classes]);

  // Fetch schedules for each class
  const scheduleQueries = useQueries({
    queries: classes.map((cls: any) => ({
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
    () => Object.fromEntries(catalogueItems.map((item: any) => [item.class_definition_uuid, item])),
    [catalogueItems]
  );

  // Fetch student enrollments
  const { data: enrollmentsData } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: startDate ?? '2024-10-10', end: endDate ?? '2030-10-10' },
    }),
    enabled: !!student?.uuid,
  });
  const enrollments = enrollmentsData?.data ?? [];

  const instructorMap = useMemo(() => {
    const map = new Map<string, any>();
    uniqueInstructorUuids.forEach((uuid, index) => {
      const instructorData = instructorQueries[index]?.data?.data;
      if (instructorData) {
        map.set(uuid, instructorData);
      }
    });
    return map;
  }, [uniqueInstructorUuids, instructorQueries]);

  // Get schedules directly (no deduplication needed as each class has unique schedule)
  const schedules = useMemo(
    () => scheduleQueries.map(q => q.data?.data?.content ?? null),
    [scheduleQueries]
  );

  // Bundle all class information
  const bundledClassInfo = useMemo(() => {
    return classes.map((cls: any, i: number) => {
      const classEnrollments = enrollments.filter(
        (en: any) => en.class_definition_uuid === cls.uuid
      );

      return {
        ...cls,
        course: cls.program_uuid ? pCourses?.data : null,
        instructor: cls.default_instructor_uuid
          ? (instructorMap.get(cls.default_instructor_uuid) ?? null)
          : null,
        schedule: schedules[i],
        enrollments: classEnrollments,
        catalogue: catalogueMap[cls.uuid] ?? null,
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
