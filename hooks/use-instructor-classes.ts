import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  Enrollment,
  GetClassDefinitionsForInstructorResponse,
  GetClassScheduleResponse,
  GetCourseByUuidResponse,
  GetInstructorByUuidResponse,
} from '../services/client';
import {
  getClassDefinitionsForInstructorOptions
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

  const classUuids = useMemo(() => {
    return classes
      .map(cls => cls.uuid)
      .filter(Boolean) as string[];
  }, [classes]);

  const { scheduleMap, isLoading: scheduleIsLoading } = useClassSchedulesMap(classUuids);
  const { enrollmentMap, isLoading: enrollmentIsLoading } = useEnrollmentMap(classUuids);

  const classesWithCourseAndInstructor = useMemo<InstructorClassWithDetails[]>(() => {
    return classes.map((cls, i) => ({
      ...cls,
      course: cls.course_uuid
        ? (courseMap?.[cls.course_uuid] ?? null)
        : null,
      instructor: cls.default_instructor_uuid
        ? (instructorMap?.[cls.default_instructor_uuid] ?? null)
        : null,
      schedule: cls.uuid
        ? (scheduleMap?.[cls.uuid] ?? null)
        : null,
      enrollment: cls.uuid
        ? (enrollmentMap?.[cls.uuid] ?? null)
        : null,
    }));
  }, [classes, courseMap, instructorMap, scheduleMap, enrollmentMap]);

  const loading =
    isLoading ||
    isPending ||
    instructorIsLoading ||
    scheduleIsLoading ||
    enrollmentIsLoading ||
    courseIsLoading;

  return {
    classes: classesWithCourseAndInstructor,
    loading,
    isPending,
  };
}

export default useInstructorClassesWithDetails;
