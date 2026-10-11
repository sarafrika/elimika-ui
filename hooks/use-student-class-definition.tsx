import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';

import type {
  ClassDefinition,
  CourseEnrollment,
  Enrollment,
  GetAssignmentSchedulesResponse,
  GetClassEnrollmentsForStudentResponse,
  GetCourseByUuidResponse,
  GetCourseLessonsResponse,
  GetQuizSchedulesResponse,
  ScheduledInstance,
} from '../services/client';

import {
  getAssignmentSchedulesOptions,
  getClassEnrollmentsForStudentOptions,
  getClassSchedulesOptions,
  getCourseEnrollmentsOptions,
  getCourseLessonsOptions,
  getQuizSchedulesOptions,
  searchEnrollmentsOptions,
} from '../services/client/@tanstack/react-query.gen';

import { useClassDefinitionsByIds, useCoursesByIds } from './use-batched-lookups';

type StudentLike = {
  uuid?: string;
};

type StudentEnrollment = NonNullable<
  NonNullable<GetClassEnrollmentsForStudentResponse['data']>['content']
>[number];

type CourseDetails = NonNullable<GetCourseByUuidResponse['data']>;
type LessonDetails = NonNullable<NonNullable<GetCourseLessonsResponse['data']>['content']>;
type QuizDetails = NonNullable<GetQuizSchedulesResponse['data']>;
type AssignmentDetails = NonNullable<GetAssignmentSchedulesResponse['data']>;

const isDefined = <T,>(value: T | null | undefined): value is T => value != null;

// Backend cap on class_uuids for GET /classes/schedules (ClassScheduleBatchService.MAX_BATCH_SIZE).
const MAX_CLASSES_PER_CALL = 100;
const MAX_CLASS_CHUNKS = 5;
const ENROLLMENT_PAGE_SIZE = 500;

function chunkIds(ids: string[]): string[][] {
  const sorted = [...ids].sort();
  const chunks: string[][] = [];
  for (let i = 0; i < sorted.length; i += MAX_CLASSES_PER_CALL) {
    chunks.push(sorted.slice(i, i + MAX_CLASSES_PER_CALL));
  }
  return chunks;
}

export type StudentClassSection =
  | 'schedules'
  | 'courseEnrollments'
  | 'lessons'
  | 'quizzes'
  | 'assignments'
  | 'classEnrollments';

const ALL_SECTIONS: readonly StudentClassSection[] = [
  'schedules',
  'courseEnrollments',
  'lessons',
  'quizzes',
  'assignments',
  'classEnrollments',
];

const NO_IDS: string[] = [];

type StudentClassDefinitionsOptions = {
  /** Per-class sections to fetch; each costs one request per class or course. Default: all. */
  include?: readonly StudentClassSection[];
};

function useStudentClassDefinitions(
  student?: StudentLike,
  { include = ALL_SECTIONS }: StudentClassDefinitionsOptions = {}
) {
  const wants = (section: StudentClassSection) => include.includes(section);
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

  const enrollments: StudentEnrollment[] = enrollmentsData?.data?.content ?? [];

  /**
   * Class UUIDs
   */
  const classDefinitionUuids = useMemo(
    () =>
      Array.from(
        new Set(enrollments.map(enrollment => enrollment.class_definition_uuid).filter(isDefined))
      ),
    [enrollments]
  );

  /**
   * The enrolled classes, looked up by id. `/classes` is a visibility-scoped listing, not a
   * lookup table, so a page of it may miss classes the student is enrolled in.
   */
  const classDefinitionsQuery = useClassDefinitionsByIds(classDefinitionUuids);

  const classDetailsByUuid = useMemo(
    () => new Map<string, ClassDefinition>(Object.entries(classDefinitionsQuery.classDefinitionMap)),
    [classDefinitionsQuery.classDefinitionMap]
  );

  /**
   * Class schedules: one batch call per 100 classes. Class enrolments are grouped through
   * their sessions, so the schedules load for that section too.
   */
  const scheduleClassUuids =
    wants('schedules') || wants('classEnrollments') ? classDefinitionUuids : NO_IDS;
  const classIdChunks = useMemo(() => chunkIds(scheduleClassUuids), [scheduleClassUuids]);
  const scheduleQueries = useQueries({
    queries: classIdChunks.slice(0, MAX_CLASS_CHUNKS).map(classUuids => ({
      ...getClassSchedulesOptions({ query: { class_uuids: classUuids } }),
      enabled: classUuids.length > 0,
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
            .map(uuid => classDetailsByUuid.get(uuid)?.course_uuid)
            .filter(isDefined)
        )
      ),
    [classDefinitionUuids, classDetailsByUuid]
  );

  /**
   * Batched course lookup
   */
  const { courseMap: batchedCourseMap, isLoading: coursesLoading } = useCoursesByIds(courseUuids);

  /**
   * Course enrollments
   */
  const courseEnrollmentQueries = useQueries({
    queries: (wants('courseEnrollments') ? courseUuids : NO_IDS).map(courseUuid => ({
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
  const lessonCourseUuids = wants('lessons') ? courseUuids : NO_IDS;
  const lessonQueries = useQueries({
    queries: lessonCourseUuids.map(courseUuid => ({
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
  const quizClassUuids = wants('quizzes') ? classDefinitionUuids : NO_IDS;
  const quizQueries = useQueries({
    queries: quizClassUuids.map(classUuid => ({
      ...getQuizSchedulesOptions({
        path: {
          classUuid,
        },
      }),
      enabled: !!classUuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  /**
   * Assignments
   */
  const assignmentClassUuids = wants('assignments') ? classDefinitionUuids : NO_IDS;
  const assignmentQueries = useQueries({
    queries: assignmentClassUuids.map(classUuid => ({
      ...getAssignmentSchedulesOptions({
        path: {
          classUuid,
        },
      }),
      enabled: !!classUuid,
      staleTime: STALE_TIMES.live,
    })),
  });

  /**
   * Class enrollments: one search per 100 classes instead of one roster call per class.
   */
  const enrollmentClassChunks = wants('classEnrollments') ? classIdChunks : [];
  const classEnrollmentQueries = useQueries({
    queries: enrollmentClassChunks.slice(0, MAX_CLASS_CHUNKS).map(classUuids => ({
      ...searchEnrollmentsOptions({
        query: {
          searchParams: { class_definition_uuid_in: classUuids.join(',') },
          pageable: { page: 0, size: ENROLLMENT_PAGE_SIZE },
        },
      }),
      enabled: classUuids.length > 0,
      staleTime: STALE_TIMES.live,
    })),
  });

  /**
   * Lesson map
   */
  const lessonMap = new Map<string, LessonDetails>();

  lessonQueries.forEach((query, index) => {
    const courseUuid = lessonCourseUuids[index];

    if (courseUuid) {
      lessonMap.set(courseUuid, query.data?.data?.content ?? []);
    }
  });

  /**
   * Quiz map
   */
  const quizMap = new Map<string, QuizDetails>();

  quizQueries.forEach((query, index) => {
    const classUuid = quizClassUuids[index];

    if (classUuid) {
      quizMap.set(classUuid, (query.data?.data as QuizDetails) ?? []);
    }
  });

  /**
   * Assignment map
   */
  const assignmentMap = new Map<string, AssignmentDetails>();

  assignmentQueries.forEach((query, index) => {
    const classUuid = assignmentClassUuids[index];

    if (classUuid) {
      assignmentMap.set(classUuid, (query.data?.data as AssignmentDetails) ?? []);
    }
  });

  /**
   * Schedule map
   */
  const scheduleMap = new Map<string, ScheduledInstance[]>();
  const instanceClassMap = new Map<string, string>();

  scheduleQueries.forEach(query => {
    (query.data?.data ?? []).forEach(instance => {
      const classUuid = instance.class_definition_uuid;

      if (!classUuid) {
        return;
      }

      const existing = scheduleMap.get(classUuid) ?? [];

      existing.push(instance);

      scheduleMap.set(classUuid, existing);

      if (instance.uuid) {
        instanceClassMap.set(instance.uuid, classUuid);
      }
    });
  });

  /**
   * Course enrollments grouped by course UUID
   */
  const courseEnrollmentMap = new Map<string, CourseEnrollment[]>();

  courseEnrollmentQueries.forEach(query => {
    const enrollments = query.data?.data?.content ?? [];

    enrollments.forEach(enrollment => {
      if (!enrollment.course_uuid) {
        return;
      }

      const existing = courseEnrollmentMap.get(enrollment.course_uuid) ?? [];

      existing.push(enrollment);

      courseEnrollmentMap.set(enrollment.course_uuid, existing);
    });
  });

  /**
   * Class enrollments grouped by class UUID
   */
  const classEnrollmentMap = new Map<string, Enrollment[]>();

  classEnrollmentQueries.forEach(query => {
    (query.data?.data?.content ?? []).forEach(enrollment => {
      const classUuid = instanceClassMap.get(enrollment.scheduled_instance_uuid);

      if (!classUuid) {
        return;
      }

      const existing = classEnrollmentMap.get(classUuid) ?? [];

      existing.push(enrollment);

      classEnrollmentMap.set(classUuid, existing);
    });
  });

  /**
   * Final class definitions
   */
  const classDefinitions = classDefinitionUuids.map(classUuid => {
    const classDetails = classDetailsByUuid.get(classUuid) ?? null;

    const courseUuid = classDetails?.course_uuid;

    const course = courseUuid ? ((batchedCourseMap[courseUuid] as CourseDetails) ?? null) : null;

    const lessons = courseUuid ? (lessonMap.get(courseUuid) ?? []) : [];

    const courseEnrollments = courseUuid ? (courseEnrollmentMap.get(courseUuid) ?? []) : [];

    const quizzes = quizMap.get(classUuid) ?? [];

    const assignments = assignmentMap.get(classUuid) ?? [];

    const schedules = wants('schedules') ? (scheduleMap.get(classUuid) ?? []) : [];

    const classEnrollments = classEnrollmentMap.get(classUuid) ?? [];

    const studentEnrollments = enrollments.filter(
      enrollment => enrollment.class_definition_uuid === classUuid
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
    scheduleQueries.some(q => q.isLoading || q.isFetching) ||
    coursesLoading ||
    courseEnrollmentQueries.some(q => q.isLoading || q.isFetching) ||
    lessonQueries.some(q => q.isLoading || q.isFetching) ||
    quizQueries.some(q => q.isLoading || q.isFetching) ||
    assignmentQueries.some(q => q.isLoading || q.isFetching) ||
    classEnrollmentQueries.some(q => q.isLoading || q.isFetching);

  const isError =
    classDefinitionsQuery.isError ||
    scheduleQueries.some(q => q.isError) ||
    courseEnrollmentQueries.some(q => q.isError) ||
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
