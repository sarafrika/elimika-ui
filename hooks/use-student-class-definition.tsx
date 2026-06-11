import { useQueries, useQuery } from '@tanstack/react-query';
import type {
  GetAssignmentSchedulesResponse,
  GetClassEnrollmentsForStudentResponse,
  GetCourseByUuidResponse,
  GetCourseLessonsData,
  GetCourseLessonsResponse,
  GetEnrollmentsForClassResponse,
  GetQuizSchedulesResponse,
  GetQuizSchedulesResponses,
  Lesson
} from '../services/client';
import {
  getAssignmentSchedulesOptions,
  getClassDefinitionOptions,
  getClassEnrollmentsForStudentOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
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



const isDefined = <T,>(value: T | null | undefined): value is T => value != null;

function useStudentClassDefinitions(student?: StudentLike) {
  const { data: enrollmentsData } = useQuery({
    ...getClassEnrollmentsForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!student?.uuid,
  });

  const enrollments = enrollmentsData?.data?.content ?? [];

  const classDefinitionUuids = Array.from(
    new Set(enrollments.map(en => en.class_definition_uuid).filter(isDefined))
  );

  const classQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const scheduleQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassScheduleOptions({
        path: { uuid },
        query: { pageable: { size: 1000 } },
      }),
      enabled: !!uuid,
    })),
  });

  const classDetailsArray = classQueries.map(
    q => q.data?.data?.class_definition ?? null
  );

  const courseUuids = Array.from(
    new Set(classDetailsArray.map(c => c?.course_uuid).filter(isDefined))
  );

  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const lessonQueries = useQueries({
    queries: courseUuids.map(courseUuid => ({
      ...getCourseLessonsOptions({
        path: { courseUuid },
        query: { pageable: {} },
      }),
      enabled: !!courseUuid,
    })),
  });

  const quizQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getQuizSchedulesOptions({
        path: { classUuid },
      }),
      enabled: !!classUuid,
    })),
  });

  const assignmentQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getAssignmentSchedulesOptions({
        path: { classUuid },
      }),
      enabled: !!classUuid,
    })),
  });

  // ✅ NEW: per-class enrollments
  const classEnrollmentQueries = useQueries({
    queries: classDefinitionUuids.map(classUuid => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classUuid },
      }),
      enabled: !!classUuid,
    })),
  });

  const classScheduleArray = scheduleQueries.map(q => q.data?.data?.content);

  const courseMap = new Map<string, CourseDetails>();
  courseQueries.forEach(q => {
    const course = q.data?.data;
    if (course?.uuid) courseMap.set(course.uuid, course);
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
    quizMap.set(classUuid, q.data?.data?.content ?? []);
  });

  const assignmentMap = new Map<string, AssignmentDetails>();
  assignmentQueries.forEach((q, i) => {
    const classUuid = classDefinitionUuids[i];
    assignmentMap.set(classUuid, q.data?.data?.content ?? []);
  });

  // ✅ NEW: enrollment map per class
  const enrollmentMap = new Map<string, EnrollmentDetails[]>();
  classEnrollmentQueries.forEach((q, i) => {
    const classUuid = classDefinitionUuids[i];
    enrollmentMap.set(classUuid, q.data?.data?.content ?? []);
  });

  const classDefinitions = classDefinitionUuids.map((uuid, i) => {
    const classDetails = classDetailsArray[i];
    const courseUuid = classDetails?.course_uuid;

    const course = courseUuid ? courseMap.get(courseUuid) : null;
    const lessons = courseUuid ? lessonMap.get(courseUuid) ?? [] : [];
    const quizzes = quizMap.get(uuid) ?? [];
    const assignments = assignmentMap.get(uuid) ?? [];
    const schedules = classScheduleArray[i] ?? [];
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
    classQueries.some(q => q.isLoading || q.isFetching) ||
    courseQueries.some(q => q.isLoading || q.isFetching) ||
    lessonQueries.some(q => q.isLoading || q.isFetching) ||
    quizQueries.some(q => q.isLoading || q.isFetching) ||
    assignmentQueries.some(q => q.isLoading || q.isFetching) ||
    classEnrollmentQueries.some(q => q.isLoading || q.isFetching);

  const isError =
    classQueries.some(q => q.isError) ||
    courseQueries.some(q => q.isError) ||
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