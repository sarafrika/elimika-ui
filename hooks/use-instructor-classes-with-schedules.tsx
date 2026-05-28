import {
  getClassDefinitionsForInstructorOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
  getProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  GetClassDefinitionsForInstructorResponse,
  GetClassScheduleResponse,
  GetCourseByUuidResponse,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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

  const courseQueries = useQueries({
    queries: uniqueCourseUuids.map(courseUuid => ({
      ...getCourseByUuidOptions({
        path: {
          uuid: courseUuid as string,
        },
      }),

      enabled: !!courseUuid,

      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,

      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    })),
  });

  const courseMap = useMemo<
    Record<string, InstructorCourse | null>
  >(() => {
    return Object.fromEntries(
      uniqueCourseUuids.map((uuid, index) => [
        uuid as string,
        courseQueries[index]?.data?.data ?? null,
      ])
    );
  }, [uniqueCourseUuids, courseQueries]);

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

  const scheduleQueries = useQueries({
    queries: uniqueClasses.map(classItem => ({
      ...getClassScheduleOptions({
        path: {
          uuid: classItem.uuid as string,
        },

        query: {
          pageable: {
            page: 0,
            size: 1000,
          },
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

        schedule:
          scheduleQueries[index]?.data?.data?.content ?? [],

        enrollments:
          enrollmentQueries[index]?.data?.data ?? [],
      })),
    [
      uniqueClasses,
      courseMap,
      programCoursesMap,
      scheduleQueries,
      enrollmentQueries,
    ]
  );

  const isLoading =
    classesQuery.isLoading ||
    courseQueries.some(query => query.isLoading) ||
    programCoursesQueries.some(query => query.isLoading) ||
    enrollmentQueries.some(query => query.isLoading) ||
    scheduleQueries.some(query => query.isLoading);

  const isPending =
    classesQuery.isPending ||
    courseQueries.some(query => query.isPending) ||
    programCoursesQueries.some(query => query.isPending) ||
    enrollmentQueries.some(query => query.isPending) ||
    scheduleQueries.some(query => query.isPending);

  const isError =
    classesQuery.isError ||
    courseQueries.some(query => query.isError) ||
    programCoursesQueries.some(query => query.isError) ||
    enrollmentQueries.some(query => query.isError) ||
    scheduleQueries.some(query => query.isError);

  return {
    classes: data,
    isLoading,
    isPending,
    isError,
  };
}
