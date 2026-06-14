import { localDate } from '@/lib/date';
import {
  getClassDefinitionsForInstructorOptions,
  getEnrollmentsForClassOptions,
  getInstructorScheduleOptions,
  getProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  GetClassDefinitionsForInstructorResponse,
  GetClassScheduleResponse,
  GetCourseByUuidResponse,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCoursesByIds } from './use-batched-lookups';
import type { ProgramCourseLike } from './use-programlessonwithcontent';

type InstructorClass = NonNullable<
  NonNullable<GetClassDefinitionsForInstructorResponse['data']>[number]['class_definition']
>;

type InstructorCourse = NonNullable<GetCourseByUuidResponse['data']>;

type InstructorSchedule = NonNullable<
  NonNullable<GetClassScheduleResponse['data']>['content']
>[number];

export type InstructorClassWithSchedule = InstructorClass & {
  course?: InstructorCourse | null;
  programCourses?: ProgramCourseLike[];
  schedule: InstructorSchedule[];
  enrollments: unknown[];
};

export function useInstructorClassesWithSchedules(
  instructorUuid?: string
) {
  const classesQuery = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: {
        instructorUuid: instructorUuid as string,
      },
      query: {
        activeOnly: true,
      },
    }),

    enabled: !!instructorUuid,

    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,

    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const classes = useMemo(
    () =>
      classesQuery.data?.data
        ?.map(item => item.class_definition)
        .filter((item): item is InstructorClass => Boolean(item)) ?? [],
    [classesQuery.data]
  );

  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();

    return classes.filter((classItem): classItem is InstructorClass => {
      const uuid = classItem.uuid;

      if (!uuid || seen.has(uuid)) {
        return false;
      }

      seen.add(uuid);

      return true;
    });
  }, [classes]);

  const uniqueCourseUuids = useMemo(() => {
    return [...new Set(
      uniqueClasses
        .map(classItem => classItem.course_uuid)
        .filter(Boolean)
    )];
  }, [uniqueClasses]);

  const uniqueProgramUuids = useMemo(() => {
    return [...new Set(
      uniqueClasses
        .map(classItem => classItem.program_uuid)
        .filter(Boolean)
    )];
  }, [uniqueClasses]);

  // One batched search per ~100 course ids instead of a request per course.
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(
    uniqueCourseUuids as string[]
  );

  const programCoursesQueries = useQueries({
    queries: uniqueProgramUuids.map(programUuid => ({
      ...getProgramCoursesOptions({
        path: {
          programUuid: programUuid as string,
        },
      }),

      enabled: !!programUuid,

      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,

      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    })),
  });

  const programCoursesMap = useMemo<
    Record<string, ProgramCourseLike[]>
  >(() => {
    return Object.fromEntries(
      uniqueProgramUuids.map((uuid, index) => [
        uuid as string,
        (programCoursesQueries[index]?.data?.data ?? []).filter(
          (course): course is ProgramCourseLike => Boolean(course?.uuid)
        ),
      ])
    );
  }, [uniqueProgramUuids, programCoursesQueries]);

  const enrollmentQueries = useQueries({
    queries: uniqueClasses.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: {
          uuid: classItem.uuid as string,
        },
      }),

      enabled: !!classItem.uuid,

      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,

      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    })),
  });

  // One timetable request for the whole instructor instead of one schedule
  // request per class. Instances carry class_definition_uuid, so they are
  // grouped client-side. The ±2-year window bounds payload size.
  const scheduleRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 2);
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 2);
    // LocalDate params must go over the wire as YYYY-MM-DD
    return { start: localDate(start), end: localDate(end) };
  }, []);

  const instructorScheduleQuery = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructorUuid as string },
      query: scheduleRange,
    }),
    enabled: !!instructorUuid,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const schedulesByClass = useMemo(() => {
    const map = new Map<string, InstructorSchedule[]>();
    for (const instance of instructorScheduleQuery.data?.data ?? []) {
      const classUuid = instance.class_definition_uuid;
      if (!classUuid) continue;
      const current = map.get(classUuid) ?? [];
      current.push(instance as InstructorSchedule);
      map.set(classUuid, current);
    }
    for (const instances of map.values()) {
      instances.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    }
    return map;
  }, [instructorScheduleQuery.data]);

  const data = useMemo<InstructorClassWithSchedule[]>(
    () =>
      uniqueClasses.map((classItem, index) => ({
        ...classItem,

        course:
          courseMap[classItem.course_uuid as string] ?? null,

        programCourses:
          classItem.program_uuid
            ? (programCoursesMap[classItem.program_uuid] ?? [])
            : [],

        schedule: schedulesByClass.get(classItem.uuid ?? '') ?? [],

        enrollments:
          enrollmentQueries[index]?.data?.data ?? [],
      })),
    [
      uniqueClasses,
      courseMap,
      programCoursesMap,
      schedulesByClass,
      enrollmentQueries,
    ]
  );

  const isLoading =
    classesQuery.isLoading ||
    coursesLoading ||
    programCoursesQueries.some(query => query.isLoading) ||
    enrollmentQueries.some(query => query.isLoading) ||
    instructorScheduleQuery.isLoading;

  const isPending =
    classesQuery.isPending ||
    programCoursesQueries.some(query => query.isPending) ||
    enrollmentQueries.some(query => query.isPending);

  const isError =
    classesQuery.isError ||
    programCoursesQueries.some(query => query.isError) ||
    enrollmentQueries.some(query => query.isError) ||
    instructorScheduleQuery.isError;

  return {
    classes: data,
    isLoading,
    isPending,
    isError,
  };
}
