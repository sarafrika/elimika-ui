import { STALE_TIMES } from '@/lib/query-client';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type {
  ClassDefinition,
  CourseEnrollment,
  GetAssignmentSchedulesResponse,
  GetClassEnrollmentsForStudentResponse,
  GetCourseByUuidResponse,
  GetCourseLessonsResponse,
  GetEnrollmentsForClassResponse,
  GetQuizSchedulesResponse,
  ScheduledInstance,
} from '../services/client';

import {
  getAllClassDefinitionsOptions,
  getAssignmentSchedulesOptions,
  getClassEnrollmentsForStudentOptions,
  getClassScheduleOptions,
  getCourseEnrollmentsOptions,
  getCourseLessonsOptions,
  getEnrollmentsForClassOptions,
  getQuizSchedulesOptions,
} from '../services/client/@tanstack/react-query.gen';

import { useCoursesByIds } from './use-batched-lookups';

type StudentLike = {
  uuid?: string;
};

type StudentEnrollment = NonNullable<
  NonNullable<GetClassEnrollmentsForStudentResponse['data']>['content']
>[number];

type CourseDetails = NonNullable<GetCourseByUuidResponse['data']>;
type LessonDetails = NonNullable<
  NonNullable<GetCourseLessonsResponse['data']>['content']
>;
type QuizDetails = NonNullable<GetQuizSchedulesResponse['data']>;
type AssignmentDetails =
  NonNullable<GetAssignmentSchedulesResponse['data']>;
type EnrollmentDetails =
  NonNullable<GetEnrollmentsForClassResponse['data']>;

const isDefined = <T,>(
  value: T | null | undefined
): value is T => value != null;

function useStudentClassDefinitions(
  student?: StudentLike
) {
  /**
   * Student enrollments
   */
  const { data: enrollmentsData } = useQuery({
    ...getClassEnrollmentsForStudentOptions({
      path: {
        studentUuid: student?.uuid as string,
      },
      query: {
        pageable: {},
      },
    }),
    enabled: !!student?.uuid,
  });

  const enrollments: StudentEnrollment[] =
    enrollmentsData?.data?.content ?? [];

  /**
   * Class UUIDs
   */
  const classDefinitionUuids = useMemo(
    () =>
      Array.from(
        new Set(
          enrollments
            .map(
              enrollment =>
                enrollment.class_definition_uuid
            )
            .filter(isDefined)
        )
      ),
    [enrollments]
  );

  /**
   * Class definitions (single request)
   */
  const classDefinitionsQuery = useQuery({
    ...getAllClassDefinitionsOptions({
      query: {
        pageable: {
          page: 0,
          size: 200,
        },
      },
    }),
    enabled: classDefinitionUuids.length > 0,
    staleTime: STALE_TIMES.entity,
  });

  const classDetailsByUuid = useMemo(() => {
    const map = new Map<string, ClassDefinition>();

    for (
      const item of
      classDefinitionsQuery.data?.data?.content ??
      []
    ) {
      const definition = item.class_definition;

      if (definition?.uuid) {
        map.set(definition.uuid, definition);
      }
    }

    return map;
  }, [classDefinitionsQuery.data]);

  /**
   * Class schedules
   */
  const scheduleQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassScheduleOptions({
        path: { uuid },
        query: {
          pageable: {
            size: 200,
          },
        },
      }),
      enabled: !!uuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  /**
   * Course UUIDs
   */
  const courseUuids = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitionUuids
            .map(
              uuid =>
                classDetailsByUuid.get(uuid)
                  ?.course_uuid
            )
            .filter(isDefined)
        )
      ),
    [classDefinitionUuids, classDetailsByUuid]
  );

  /**
   * Batched course lookup
   */
  const {
    courseMap: batchedCourseMap,
    isLoading: coursesLoading,
  } = useCoursesByIds(courseUuids);

  /**
   * Course enrollments
   */
  const courseEnrollmentQueries = useQueries({
    queries: courseUuids.map(courseUuid => ({
      ...getCourseEnrollmentsOptions({
        path: {
          courseUuid,
        },
        query: {
          pageable: {},
        },
      }),
      enabled: !!courseUuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  /**
   * Lessons
   */
  const lessonQueries = useQueries({
    queries: courseUuids.map(courseUuid => ({
      ...getCourseLessonsOptions({
        path: {
          courseUuid,
        },
        query: {
          pageable: {},
        },
      }),
      enabled: !!courseUuid,
      staleTime: STALE_TIMES.entity,
    })),
  });

  /**
   * Quizzes
   */
  const quizQueries = useQueries({
    queries: classDefinitionUuids.map(
      classUuid => ({
        ...getQuizSchedulesOptions({
          path: {
            classUuid,
          },
        }),
        enabled: !!classUuid,
        staleTime: STALE_TIMES.live,
      })
    ),
  });

  /**
   * Assignments
   */
  const assignmentQueries = useQueries({
    queries: classDefinitionUuids.map(
      classUuid => ({
        ...getAssignmentSchedulesOptions({
          path: {
            classUuid,
          },
        }),
        enabled: !!classUuid,
        staleTime: STALE_TIMES.live,
      })
    ),
  });

  /**
   * Class enrollments
   */
  const classEnrollmentQueries = useQueries({
    queries: classDefinitionUuids.map(
      classUuid => ({
        ...getEnrollmentsForClassOptions({
          path: {
            uuid: classUuid,
          },
        }),
        enabled: !!classUuid,
        staleTime: STALE_TIMES.live,
      })
    ),
  });

  /**
   * Lesson map
   */
  const lessonMap = new Map<
    string,
    LessonDetails
  >();

  lessonQueries.forEach((query, index) => {
    const courseUuid = courseUuids[index];

    if (courseUuid) {
      lessonMap.set(
        courseUuid,
        query.data?.data?.content ?? []
      );
    }
  });

  /**
   * Quiz map
   */
  const quizMap = new Map<
    string,
    QuizDetails
  >();

  quizQueries.forEach((query, index) => {
    const classUuid =
      classDefinitionUuids[index];

    if (classUuid) {
      quizMap.set(
        classUuid,
        (query.data?.data as QuizDetails) ??
        []
      );
    }
  });

  /**
   * Assignment map
   */
  const assignmentMap = new Map<
    string,
    AssignmentDetails
  >();

  assignmentQueries.forEach(
    (query, index) => {
      const classUuid =
        classDefinitionUuids[index];

      if (classUuid) {
        assignmentMap.set(
          classUuid,
          (query.data?.data as AssignmentDetails) ??
          []
        );
      }
    }
  );

  /**
   * Schedule map
   */
  const scheduleMap = new Map<
    string,
    ScheduledInstance[]
  >();

  scheduleQueries.forEach((query, index) => {
    const classUuid =
      classDefinitionUuids[index];

    if (classUuid) {
      scheduleMap.set(
        classUuid,
        query.data?.data?.content ?? []
      );
    }
  });

  /**
   * Course enrollments grouped by course UUID
   */
  const courseEnrollmentMap = new Map<
    string,
    CourseEnrollment[]
  >();

  courseEnrollmentQueries.forEach(query => {
    const enrollments =
      query.data?.data?.content ?? [];

    enrollments.forEach(enrollment => {
      if (!enrollment.course_uuid) {
        return;
      }

      const existing =
        courseEnrollmentMap.get(
          enrollment.course_uuid
        ) ?? [];

      existing.push(enrollment);

      courseEnrollmentMap.set(
        enrollment.course_uuid,
        existing
      );
    });
  });

  /**
   * Class enrollments grouped by class UUID
   */
  const classEnrollmentMap = new Map<
    string,
    EnrollmentDetails
  >();

  classEnrollmentQueries.forEach(
    (query, index) => {
      const classUuid =
        classDefinitionUuids[index];

      if (classUuid) {
        classEnrollmentMap.set(
          classUuid,
          query.data?.data ?? []
        );
      }
    }
  );

  /**
   * Final class definitions
   */
  const classDefinitions =
    classDefinitionUuids.map(classUuid => {
      const classDetails =
        classDetailsByUuid.get(classUuid) ??
        null;

      const courseUuid =
        classDetails?.course_uuid;

      const course = courseUuid
        ? ((batchedCourseMap[
          courseUuid
        ] as CourseDetails) ?? null)
        : null;

      const lessons = courseUuid
        ? lessonMap.get(courseUuid) ?? []
        : [];

      const courseEnrollments =
        courseUuid
          ? courseEnrollmentMap.get(
            courseUuid
          ) ?? []
          : [];

      const quizzes =
        quizMap.get(classUuid) ?? [];

      const assignments =
        assignmentMap.get(classUuid) ?? [];

      const schedules =
        scheduleMap.get(classUuid) ?? [];

      const classEnrollments =
        classEnrollmentMap.get(classUuid) ??
        [];

      const studentEnrollments =
        enrollments.filter(
          enrollment =>
            enrollment.class_definition_uuid ===
            classUuid
        );

      return {
        uuid: classUuid,

        classDetails,

        course,

        lessons,

        quizzes,

        assignments,

        schedules,

        courseEnrollments,

        classEnrollments,

        studentEnrollments,
      };
    });

  const loading =
    classDefinitionsQuery.isLoading ||
    scheduleQueries.some(
      q => q.isLoading || q.isFetching
    ) ||
    coursesLoading ||
    courseEnrollmentQueries.some(
      q => q.isLoading || q.isFetching
    ) ||
    lessonQueries.some(
      q => q.isLoading || q.isFetching
    ) ||
    quizQueries.some(
      q => q.isLoading || q.isFetching
    ) ||
    assignmentQueries.some(
      q => q.isLoading || q.isFetching
    ) ||
    classEnrollmentQueries.some(
      q => q.isLoading || q.isFetching
    );

  const isError =
    classDefinitionsQuery.isError ||
    scheduleQueries.some(q => q.isError) ||
    courseEnrollmentQueries.some(
      q => q.isError
    ) ||
    lessonQueries.some(q => q.isError) ||
    quizQueries.some(q => q.isError) ||
    assignmentQueries.some(
      q => q.isError
    ) ||
    classEnrollmentQueries.some(
      q => q.isError
    );

  return {
    classDefinitions,
    loading,
    isError,
  };
}

export default useStudentClassDefinitions;