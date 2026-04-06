import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getClassDefinitionsForInstructorOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';

export type InstructorClassWithSchedule = {
  uuid: string;
  title: string;
  description?: string;
  course_uuid?: string;
  default_instructor_uuid: string;
  location_name?: string;
  location_type?: string;
  session_format?: string;
  meeting_link?: string;
  max_participants?: number;
  training_fee?: number;
  duration_formatted?: string;
  course?: any;
  schedule: any[];
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
    () => classesQuery.data?.data?.map((item: any) => item.class_definition).filter(Boolean) ?? [],
    [classesQuery.data]
  );

  const courseQueries = useQueries({
    queries: classes.map((classItem: any) => ({
      ...getCourseByUuidOptions({
        path: { uuid: classItem.course_uuid as string },
      }),
      enabled: !!classItem.course_uuid,
      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    })),
  });

  const scheduleQueries = useQueries({
    queries: classes.map((classItem: any) => ({
      ...getClassScheduleOptions({
        path: { uuid: classItem.uuid as string },
        query: { pageable: {} },
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
      classes.map((classItem: any, index: number) => ({
        ...classItem,
        course: courseQueries[index]?.data?.data ?? null,
        schedule: scheduleQueries[index]?.data?.data?.content ?? [],
      })),
    [classes, courseQueries, scheduleQueries]
  );

  return {
    classes: data,
    isLoading:
      classesQuery.isLoading ||
      courseQueries.some(query => query.isLoading) ||
      scheduleQueries.some(query => query.isLoading),
    isPending:
      classesQuery.isPending ||
      courseQueries.some(query => query.isPending) ||
      scheduleQueries.some(query => query.isPending),
    isError:
      classesQuery.isError ||
      courseQueries.some(query => query.isError) ||
      scheduleQueries.some(query => query.isError),
  };
}
