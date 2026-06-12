import { useQueries, useQuery } from '@tanstack/react-query';
import type {
  CourseEnrollment,
  GetAssignmentSchedulesResponse,
  GetClassEnrollmentsForStudentResponse,
  GetCourseByUuidResponse,
  GetCourseLessonsResponse,
  GetEnrollmentsForClassResponse,
  GetQuizSchedulesResponse,
} from '../services/client';

import {
  getAssignmentSchedulesOptions,
  getClassDefinitionOptions,
  getClassEnrollmentsForStudentOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getCourseEnrollmentsOptions,
  getCourseLessonsOptions,
  getEnrollmentsForClassOptions,
  getQuizSchedulesOptions,
} from '../services/client/@tanstack/react-query.gen';

type StudentLike = {
  uuid?: string;
};

type StudentEnrollment = NonNullable<
  NonNullable<GetClassEnrollmentsForStudentResponse['data']>['content']
>[number];

type CourseDetails = NonNullable<GetCourseByUuidResponse['data']>;
type LessonDetails = NonNullable<GetCourseLessonsResponse['data']>;
type QuizDetails = NonNullable<GetQuizSchedulesResponse['data']>;
type AssignmentDetails = NonNullable<GetAssignmentSchedulesResponse['data']>;
type EnrollmentDetails = NonNullable<GetEnrollmentsForClassResponse['data']>;

const isDefined = <T,>(
  value: T | null | undefined
): value is T => value != null;

function useStudentClassDefinitions(student?: StudentLike) {
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

  const studentEnrollments: StudentEnrollment[] =
    enrollmentsData?.data?.content ?? [];

  /**
   * Class UUIDs
   */
  const classDefinitionUuids = Array.from(
    new Set(
      studentEnrollments
        .map(enrollment => enrollment.class_definition_uuid)
        .filter(isDefined)
    )
  );

  /**
   * Class definitions
   */
  const classQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassDefinitionOptions({
        path: { uuid },
      }),
      enabled: !!uuid,
    })),
  });

  /**
   * Class schedules
   */
  const scheduleQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassScheduleOptions({
        path: { uuid },
        query: {
          pageable: {
            size: 1000,
          },
        },
      }),
      enabled: !!uuid,
    })),
  });

  const classDetailsArray = classQueries.map(
    query => query.data?.data?.class_definition ?? null
  );

  /**
   * Course UUIDs
   */
  const courseUuids = Array.from(
    new Set(
      classDetailsArray
        .map(classDefinition => classDefinition?.course_uuid)
        .filter(isDefined)
    )
  );

  /**
   * Courses
   */
  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({
        path: { uuid },
      }),
      enabled: !!uuid,
    })),
  });

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
    })),
  });

  /**
   * Quizzes
   */
  const quizQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getQuizSchedulesOptions({
        path: {
          classUuid,
        },
      }),
      enabled: !!classUuid,
    })),
  });

  /**
   * Assignments
   */
  const assignmentQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getAssignmentSchedulesOptions({
        path: {
          classUuid,
        },
      }),
      enabled: !!classUuid,
    })),
  });

  /**
   * Class enrollments
   */
  const classEnrollmentQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getEnrollmentsForClassOptions({
        path: {
          uuid: classUuid,
        },
      }),
      enabled: !!classUuid,
    })),
  });

  /**
   * Course map
   */
  const courseMap = new Map<string, CourseDetails>();

  courseQueries.forEach(query => {
    const course = query.data?.data;

    if (course?.uuid) {
      courseMap.set(course.uuid, course);
    }
  });

  /**
   * Lesson map
   */
  const lessonMap = new Map<string, LessonDetails>();

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
  const quizMap = new Map<string, QuizDetails>();

  quizQueries.forEach((query, index) => {
    const classUuid = classDefinitionUuids[index];

    quizMap.set(
      classUuid,
      query.data?.data?.content ?? []
    );
  });

  /**
   * Assignment map
   */
  const assignmentMap = new Map<string, AssignmentDetails>();

  assignmentQueries.forEach((query, index) => {
    const classUuid = classDefinitionUuids[index];

    assignmentMap.set(
      classUuid,
      query.data?.data?.content ?? []
    );
  });

  /**
   * Schedule map
   */
  const scheduleMap = new Map<string, any[]>();

  scheduleQueries.forEach((query, index) => {
    const classUuid = classDefinitionUuids[index];

    scheduleMap.set(
      classUuid,
      query.data?.data?.content ?? []
    );
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
    EnrollmentDetails[]
  >();

  classEnrollmentQueries.forEach(
    (query, index) => {
      const classUuid =
        classDefinitionUuids[index];

      classEnrollmentMap.set(
        classUuid,
        query.data?.data?.content ?? []
      );
    }
  );

  /**
   * Final class definitions
   */
  const classDefinitions = classDefinitionUuids.map(
    (classUuid, index) => {
      const classDetails =
        classDetailsArray[index];

      const courseUuid =
        classDetails?.course_uuid;

      const course = courseUuid
        ? courseMap.get(courseUuid) ?? null
        : null;

      const lessons = courseUuid
        ? lessonMap.get(courseUuid) ?? []
        : [];

      const courseEnrollments = courseUuid
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

      const studentEnrollmentsForClass =
        studentEnrollments.filter(
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

        // all enrollments in the course
        courseEnrollments,

        // all enrollments in the class
        classEnrollments,

        // current student's enrollments for this class
        studentEnrollments:
          studentEnrollmentsForClass,
      };
    }
  );

  const loading =
    classQueries.some(
      q => q.isLoading || q.isFetching
    ) ||
    courseQueries.some(
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
    classQueries.some(q => q.isError) ||
    courseQueries.some(q => q.isError) ||
    lessonQueries.some(q => q.isError) ||
    quizQueries.some(q => q.isError) ||
    assignmentQueries.some(q => q.isError) ||
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