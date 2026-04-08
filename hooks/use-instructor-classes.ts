import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  GetClassDefinitionsForInstructorResponse,
  GetClassScheduleResponse,
  GetCourseByUuidResponse,
  GetInstructorByUuidResponse,
} from '../services/client';
import {
  getClassDefinitionsForInstructorOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getInstructorByUuidOptions,
} from '../services/client/@tanstack/react-query.gen';

export type InstructorClass = NonNullable<
  NonNullable<GetClassDefinitionsForInstructorResponse['data']>[number]['class_definition']
>;
export type CourseDetails = NonNullable<GetCourseByUuidResponse['data']>;
export type InstructorDetails = GetInstructorByUuidResponse;
export type ClassScheduleInstance = NonNullable<
  NonNullable<GetClassScheduleResponse['data']>['content']
>[number];
export type InstructorClassWithDetails = InstructorClass & {
  course: CourseDetails | null;
  instructor: InstructorDetails | null;
  schedule: ClassScheduleInstance[] | null;
};

function useInstructorClassesWithDetails(instructorUuid?: string) {
  const { data, isLoading, isPending, isFetching } = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: {},
    }),
    enabled: !!instructorUuid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const classesData = data?.data ?? [];

  const classes = useMemo(
    () =>
      classesData
        .map(item => item.class_definition)
        .filter((item): item is InstructorClass => Boolean(item)),
    [classesData]
  );

  const uniqueCourseUuids = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(cls => {
      if (cls.course_uuid) set.add(cls.course_uuid);
    });
    return Array.from(set);
  }, [classes]);

  const uniqueInstructorUuids = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(cls => {
      if (cls.default_instructor_uuid) set.add(cls.default_instructor_uuid);
    });
    return Array.from(set);
  }, [classes]);

  const courseQueries = useQueries({
    queries: uniqueCourseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  // Extract only the data (stable dependency)
  const courseDataArray = useMemo(
    () => courseQueries.map(q => q.data?.data ?? null),
    [courseQueries]
  );

  const courseMap = useMemo(() => {
    const map = new Map<string, CourseDetails>();
    uniqueCourseUuids.forEach((uuid, index) => {
      const course = courseDataArray[index];
      if (course) map.set(uuid, course);
    });
    return map;
  }, [uniqueCourseUuids, courseDataArray]);

  const instructorQueries = useQueries({
    queries: uniqueInstructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const instructorDataArray = useMemo(
    () => instructorQueries.map(q => q.data ?? null),
    [instructorQueries]
  );

  const instructorMap = useMemo(() => {
    const map = new Map<string, InstructorDetails>();
    uniqueInstructorUuids.forEach((uuid, index) => {
      const instructor = instructorDataArray[index];
      if (instructor) map.set(uuid, instructor);
    });
    return map;
  }, [uniqueInstructorUuids, instructorDataArray]);

  const scheduleQueries = useQueries({
    queries: classes.map(cls => ({
      ...getClassScheduleOptions({
        path: { uuid: cls.uuid as string },
        query: { pageable: {} },
      }),
      enabled: !!cls.uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const schedules = useMemo(
    () => scheduleQueries.map(q => q.data?.data?.content ?? null),
    [scheduleQueries]
  );

  const classesWithCourseAndInstructor = useMemo<InstructorClassWithDetails[]>(() => {
    return classes.map((cls: InstructorClass, i: number) => ({
      ...cls,
      course: cls.course_uuid ? (courseMap.get(cls.course_uuid) ?? null) : null,
      instructor: cls.default_instructor_uuid
        ? (instructorMap.get(cls.default_instructor_uuid) ?? null)
        : null,
      schedule: schedules[i] ?? null,
    }));
  }, [classes, courseMap, instructorMap, schedules]);

  const isCoursesLoading = courseQueries.some(q => q.isLoading || q.isFetching);
  const isInstructorsLoading = instructorQueries.some(q => q.isLoading || q.isFetching);
  const isSchedulesLoading = scheduleQueries.some(q => q.isLoading || q.isFetching);

  const loading =
    isLoading || isFetching || isCoursesLoading || isInstructorsLoading || isSchedulesLoading;

  return {
    classes: classesWithCourseAndInstructor,
    loading,
    isPending,
  };
}

export default useInstructorClassesWithDetails;
