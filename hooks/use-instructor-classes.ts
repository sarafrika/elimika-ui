import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  Enrollment,
  GetClassDefinitionsForInstructorResponse,
  GetClassScheduleResponse,
  GetCourseByUuidResponse,
  GetInstructorByUuidResponse,
} from '../services/client';
import {
  getClassDefinitionsForInstructorOptions,
  getProgramCoursesOptions,
} from '../services/client/@tanstack/react-query.gen';
import { useClassSchedulesMap, useEnrollmentMap } from './use-class-schedule-map';
import { useCoursesMap } from './use-courses-map';
import { useInstructorsMap } from './use-instructors-map';

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
  pCourses: CourseDetails[];
  instructor: InstructorDetails | null;
  schedule: ClassScheduleInstance[] | null;
  enrollment: Enrollment[] | null;
};

function useInstructorClassesWithDetails(instructorUuid?: string) {
  const { courseMap, isLoading: courseIsLoading } = useCoursesMap();
  const { instructorMap, isLoading: instructorIsLoading } = useInstructorsMap();

  const { data, isLoading, isPending } = useQuery({
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

  const classUuids = useMemo(
    () =>
      classes
        .map(cls => cls.uuid)
        .filter(Boolean) as string[],
    [classes]
  );

  const programUuids = useMemo(
    () =>
      Array.from(
        new Set(
          classes
            .map(cls => cls.program_uuid)
            .filter(Boolean)
        )
      ) as string[],
    [classes]
  );

  const programCourseQueries = useQueries({
    queries: programUuids.map(programUuid => ({
      ...getProgramCoursesOptions({
        path: { programUuid },
      }),
      enabled: !!programUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const programCoursesMap = useMemo(() => {
    const map: Record<string, CourseDetails[]> = {};

    programUuids.forEach((programUuid, index) => {
      map[programUuid] =
        (programCourseQueries[index]?.data?.data ?? []) as CourseDetails[];
    });

    return map;
  }, [programUuids, programCourseQueries]);

  const { scheduleMap, isLoading: scheduleIsLoading } =
    useClassSchedulesMap(classUuids);

  const { enrollmentMap, isLoading: enrollmentIsLoading } =
    useEnrollmentMap(classUuids);

  const classesWithCourseAndInstructor =
    useMemo<InstructorClassWithDetails[]>((() => {
      return classes.map(cls => {
        const course = cls.course_uuid
          ? (courseMap?.[cls.course_uuid] ?? null)
          : null;

        const pCourses = cls.program_uuid
          ? (programCoursesMap[cls.program_uuid] ?? [])
          : course
            ? [course]
            : [];

        return {
          ...cls,
          course,
          pCourses,
          instructor: cls.default_instructor_uuid
            ? (instructorMap?.[cls.default_instructor_uuid] ?? null)
            : null,
          schedule: cls.uuid
            ? (scheduleMap?.[cls.uuid] ?? null)
            : null,
          enrollment: cls.uuid
            ? (enrollmentMap?.[cls.uuid] ?? null)
            : null,
        };
      });
    }), [
      classes,
      courseMap,
      instructorMap,
      scheduleMap,
      enrollmentMap,
      programCoursesMap,
    ]);

  const programCoursesLoading = programCourseQueries.some(
    query => query.isPending || query.isLoading
  );

  const loading =
    isLoading ||
    isPending ||
    instructorIsLoading ||
    scheduleIsLoading ||
    enrollmentIsLoading ||
    courseIsLoading ||
    programCoursesLoading;

  return {
    classes: classesWithCourseAndInstructor,
    loading,
    isPending,
  };
}

export default useInstructorClassesWithDetails;