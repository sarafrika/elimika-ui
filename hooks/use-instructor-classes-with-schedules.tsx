import {
  getClassDefinitionsForInstructorOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  GetClassDefinitionsForInstructorResponse,
  GetClassScheduleResponse,
  GetCourseByUuidResponse,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type InstructorClass = NonNullable<
  NonNullable<GetClassDefinitionsForInstructorResponse['data']>[number]['class_definition']
>;
type InstructorCourse = NonNullable<GetCourseByUuidResponse['data']>;
type InstructorSchedule = NonNullable<
  NonNullable<GetClassScheduleResponse['data']>['content']
>[number];

export type InstructorClassWithSchedule = InstructorClass & {
  course?: InstructorCourse | null;
  schedule: InstructorSchedule[];
};

export function useInstructorClassesWithSchedules(instructorUuid?: string) {
  const classesQuery = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructorUuid as string },
      query: { activeOnly: true },
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

  const courseQueries = useQueries({
    queries: uniqueClasses.map(classItem => ({
      ...getCourseByUuidOptions({
        path: { uuid: classItem.course_uuid as string },
      }),
      enabled: Boolean(classItem.course_uuid),
      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    })),
  });

  const enrollmentQueries = useQueries({
    queries: uniqueClasses.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid as string },
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
        path: { uuid: classItem.uuid as string },
        query: { pageable: { page: 0, size: 1000 } },
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
        course: courseQueries[index]?.data?.data ?? null,
        schedule: scheduleQueries[index]?.data?.data?.content ?? [],
        enrollments: enrollmentQueries[index]?.data?.data ?? [],
      })),
    [uniqueClasses, courseQueries, scheduleQueries, enrollmentQueries]
  );

  return {
    classes: data,
    isLoading:
      classesQuery.isLoading ||
      courseQueries.some(query => query.isLoading) ||
      enrollmentQueries.some(query => query.isLoading) ||
      scheduleQueries.some(query => query.isLoading),
    isPending:
      classesQuery.isPending ||
      courseQueries.some(query => query.isPending) ||
      enrollmentQueries.some(query => query.isPending) ||
      scheduleQueries.some(query => query.isPending),
    isError:
      classesQuery.isError ||
      courseQueries.some(query => query.isError) ||
      enrollmentQueries.some(query => query.isError) ||
      scheduleQueries.some(query => query.isError),
  };
}
