import { STALE_TIMES } from '@/lib/query-client';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  ClassDefinition,
  GetAssignmentSchedulesResponse,
  GetClassEnrollmentsForStudentResponse,
  GetCourseByUuidResponse,
  GetCourseLessonsResponse,
  GetEnrollmentsForClassResponse,
  GetQuizSchedulesResponse,
} from '../services/client';
import {
  getAllClassDefinitionsOptions,
  getAssignmentSchedulesOptions,
  getClassEnrollmentsForStudentOptions,
  getCourseLessonsOptions,
  getEnrollmentsForClassOptions,
  getQuizSchedulesOptions,
  getClassScheduleOptions,
} from '../services/client/@tanstack/react-query.gen';
import { useCoursesByIds } from './use-batched-lookups';

type StudentLike = {
  uuid?: string;
};

type CourseDetails = NonNullable<GetCourseByUuidResponse['data']>;
type LessonDetails = NonNullable<NonNullable<GetCourseLessonsResponse['data']>['content']>;
type QuizDetails = NonNullable<GetQuizSchedulesResponse['data']>;
type AssignmentDetails = NonNullable<GetAssignmentSchedulesResponse['data']>;
type EnrollmentDetails = NonNullable<GetEnrollmentsForClassResponse['data']>;

const isDefined = <T,>(value: T | null | undefined): value is T => value != null;

/**
 * Previously fired 7 requests per enrolled class (definition, schedule,
 * course, lessons, quizzes, assignments, enrollments — ~50 requests for a
 * typical student). Class definitions now come from one paged list, schedules
 * from one student-timetable call, and courses from one batched search.
 */
function useStudentClassDefinitions(student?: StudentLike) {
  const { data: enrollmentsData } = useQuery({
    ...getClassEnrollmentsForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!student?.uuid,
  });

  const enrollments = enrollmentsData?.data?.content ?? [];

  const classDefinitionUuids = useMemo(
    () =>
      Array.from(new Set(enrollments.map(en => en.class_definition_uuid).filter(isDefined))),
    [enrollments]
  );

  // One page of class definitions instead of one request per class.
  const classDefinitionsQuery = useQuery({
    ...getAllClassDefinitionsOptions({ query: { pageable: { page: 0, size: 200 } } }),
    enabled: classDefinitionUuids.length > 0,
    staleTime: STALE_TIMES.entity,
  });

  const classDetailsByUuid = useMemo(() => {
    const map = new Map<string, ClassDefinition>();
    for (const item of classDefinitionsQuery.data?.data?.content ?? []) {
      const definition = item.class_definition;
      if (definition?.uuid) map.set(definition.uuid, definition);
    }
    return map;
  }, [classDefinitionsQuery.data]);

  const scheduleQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassScheduleOptions({
        path: { uuid },
        query: { pageable: { size: 200 } },
      }),
      enabled: !!uuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  const courseUuids = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitionUuids
            .map(uuid => classDetailsByUuid.get(uuid)?.course_uuid)
            .filter(isDefined)
        )
      ),
    [classDefinitionUuids, classDetailsByUuid]
  );

  const { courseMap: batchedCourseMap, isLoading: coursesLoading } = useCoursesByIds(courseUuids);

  const lessonQueries = useQueries({
    queries: courseUuids.map(courseUuid => ({
      ...getCourseLessonsOptions({
        path: { courseUuid },
        query: { pageable: {} },
      }),
      enabled: !!courseUuid,
      staleTime: STALE_TIMES.entity,
    })),
  });

  const quizQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getQuizSchedulesOptions({
        path: { classUuid },
      }),
      enabled: !!classUuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  const assignmentQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getAssignmentSchedulesOptions({
        path: { classUuid },
      }),
      enabled: !!classUuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  const classEnrollmentQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classUuid },
      }),
      enabled: !!classUuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  const lessonMap = new Map<string, LessonDetails>();
  lessonQueries.forEach((q, i) => {
    const courseUuid = courseUuids[i];
    if (courseUuid) {
      lessonMap.set(courseUuid, q.data?.data?.content ?? []);
    }
  });

  const quizMap = new Map<string, QuizDetails>();
  quizQueries.forEach((q, i) => {
    const classUuid = classDefinitionUuids[i];
    // the schedules endpoint returns the array directly (no page wrapper)
    if (classUuid) quizMap.set(classUuid, q.data?.data ?? []);
  });

  const assignmentMap = new Map<string, AssignmentDetails>();
  assignmentQueries.forEach((q, i) => {
    const classUuid = classDefinitionUuids[i];
    if (classUuid) assignmentMap.set(classUuid, q.data?.data ?? []);
  });

  const enrollmentMap = new Map<string, EnrollmentDetails>();
  classEnrollmentQueries.forEach((q, i) => {
    const classUuid = classDefinitionUuids[i];
    if (classUuid) enrollmentMap.set(classUuid, q.data?.data ?? []);
  });

  const classDefinitions = classDefinitionUuids.map(uuid => {
    const classDetails = classDetailsByUuid.get(uuid) ?? null;
    const courseUuid = classDetails?.course_uuid;

    const course = courseUuid ? ((batchedCourseMap[courseUuid] as CourseDetails) ?? null) : null;
    const lessons = courseUuid ? (lessonMap.get(courseUuid) ?? []) : [];
    const quizzes = quizMap.get(uuid) ?? [];
    const assignments = assignmentMap.get(uuid) ?? [];
    const schedules = scheduleQueries[classDefinitionUuids.indexOf(uuid)]?.data?.data?.content ?? [];
    const enrollmentsForClass = enrollmentMap.get(uuid) ?? [];

    return {
      uuid,
      classDetails,
      course,
      lessons,
      quizzes,
      assignments,
      schedules,
      enrollments: enrollmentsForClass,
    };
  });

  const loading =
    classDefinitionsQuery.isLoading ||
    scheduleQueries.some(q => q.isLoading) ||
    coursesLoading ||
    lessonQueries.some(q => q.isLoading) ||
    quizQueries.some(q => q.isLoading) ||
    assignmentQueries.some(q => q.isLoading) ||
    classEnrollmentQueries.some(q => q.isLoading);

  const isError =
    classDefinitionsQuery.isError ||
    scheduleQueries.some(q => q.isError) ||
    lessonQueries.some(q => q.isError) ||
    quizQueries.some(q => q.isError) ||
    assignmentQueries.some(q => q.isError) ||
    classEnrollmentQueries.some(q => q.isError);

  return {
    classDefinitions,
    loading,
    isError,
  };
}

export default useStudentClassDefinitions;
