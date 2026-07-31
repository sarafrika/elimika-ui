'use client';

import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentSchedulesOptions,
  getClassEnrollmentsForStudentOptions,
  getCourseEnrollmentsForStudentOptions,
  getQuizSchedulesOptions,
  getStudentCertificatesOptions,
  searchAttemptsOptions,
  searchSubmissionsOptions
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  ClassAssignmentSchedule,
  ClassDefinition,
  ClassQuizSchedule,
  Course,
  CourseCreator,
  Instructor,
  Organisation,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
  TrainingProgram
} from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  useAssignmentsByIds,
  useClassesByIds,
  useCourseCreatorsByIds,
  useCoursesByIds,
  useInstructorsByIds,
  useOrganisationsByIds,
  useProgramsByIds,
  useQuizzesByIds,
} from '../../../../../hooks/use-batched-lookups';

export type StudentOverviewActiveCourse = {
  id: string;
  title: string;
  subtitle: string;
  provider: string;
  progress: number;
  nextDateLabel: string;
  buttonLabel: string;
  href: string;
};

export type StudentOverviewAssessment = {
  id: string;
  kind: 'assignment' | 'quiz';
  title: string;
  provider: string;
  classTitle: string;
  courseTitle: string | null;
  dueLabel: string;
  href: string;
  badgeLabel: string;
};

export type StudentOverviewOpportunity = {
  uuid: string;
  role: string;
  org: string;
  location: string;
  type: string;
  match: number;
};

export type StudentClassInvite = {
  uuid: string;
  title: string;
  when: string;
  host: string;
};

export type CertificateDetails = Certificate & {
  course: Course | null;
  program: TrainingProgram | null;
};


export type StudentOverviewEnrolledClassCourse = {
  id: string;
  classId: string;
  classTitle: string;
  classProvider: string;
  classDescription: string | null;
  courseId: string | null;
  courseTitle: string | null;
  courseProvider: string | null;
  courseDescription: string | null;
  enrollmentUuid: string | null;
  enrollmentStatus: string | null;
  courseEnrollmentUuid: string | null;
  courseEnrollmentStatus: string | null;
  progress: number | null;
  nextDateLabel: string;
  scheduleCount: number;
  href: string;
};

export type StudentOverviewData = {
  firstName: string;
  searchPlaceholder: string;
  skillsProgress: number;
  verifiedSkills: number;
  newSkillsThisMonth: number;
  activeCourses: StudentOverviewActiveCourse[];
  enrolledClassesAndCourses: StudentOverviewEnrolledClassCourse[];
  opportunities: StudentOverviewOpportunity[];
  studentClassInvite: StudentClassInvite[];
  certificates: CertificateDetails[];
  assessments: StudentOverviewAssessment[];
  isLoadingCourses: boolean;
};

const DEFAULT_PAGE_SIZE = 100;
const FALLBACK_PROGRESS = [60, 45, 72, 55];
const ASSESSMENT_PAGE_SIZE = 1000;


const formatDateLabel = (value?: Date | string) => {
  if (!value) {
    return 'Next session soon';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Next session soon';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const humanizeStatus = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return value.replace(/_/g, ' ').toLowerCase();
};

const buildCourseSubtitle = (course?: StudentCourseEnrollmentSummary) => {
  const parts = [humanizeStatus(course?.enrollment_status), course?.updated_date ? `Updated ${formatDateLabel(course.updated_date)}` : '']
    .filter(Boolean)
    .join(' · ');

  return parts || 'Course enrollment';
};

const buildCourseProgress = (certificate: Certificate | undefined, index: number) => {
  if (typeof certificate?.final_grade === 'number') {
    return Math.max(20, Math.min(100, Math.round(certificate.final_grade)));
  }

  return FALLBACK_PROGRESS[index % FALLBACK_PROGRESS.length];
};

const isActiveCourseEnrollment = (course?: StudentCourseEnrollmentSummary) => {
  if (!course?.enrollment_status) {
    return true;
  }

  const status = course.enrollment_status.toUpperCase();
  return !['CANCELLED', 'COMPLETED', 'DROPPED', 'WITHDRAWN', 'ARCHIVED'].includes(status);
};

const isActiveClassEnrollment = (status?: StudentClassEnrollmentSummary['latest_enrollment_status']) => {
  if (!status) {
    return true;
  }

  return status !== 'CANCELLED';
};

const formatAssessmentDueLabel = (value?: Date | string | null) => {
  if (!value) {
    return 'No deadline';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No deadline';
  }

  return `Due ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)}`;
};

function resolveClassProvider(
  classDefinition: ClassDefinition | undefined,
  instructorMap: Record<string, Instructor>,
  organisationMap: Record<string, Organisation>
) {
  if (classDefinition?.organisation_uuid) {
    return organisationMap[classDefinition.organisation_uuid]?.name ?? 'Organisation';
  }

  if (classDefinition?.default_instructor_uuid) {
    return instructorMap[classDefinition.default_instructor_uuid]?.full_name ?? 'Instructor';
  }

  return 'Class provider';
}

function resolveCourseProvider(
  course: Course | undefined,
  courseCreatorMap: Record<string, CourseCreator>
) {
  if (!course?.course_creator_uuid) {
    return 'Course creator';
  }

  return courseCreatorMap[course.course_creator_uuid]?.full_name ?? 'Course creator';
}

export function useStudentOverviewData(): StudentOverviewData {
  const profile = useUserProfile();
  const student = profile?.student;
  const studentUuid = student?.uuid;

  const firstName = profile?.first_name || student?.full_name?.split(' ')[0] || '';

  // const overviewQuery = useQuery({
  //   ...getEnrollmentOverviewForStudentOptions({
  //     path: { studentUuid: studentUuid ?? '' },
  //     query: { pageable: { page: 0, size: DEFAULT_PAGE_SIZE } },
  //   }),
  //   enabled: Boolean(studentUuid),
  //   staleTime: STALE_TIMES.entity,
  // });

  const {
    data: enrolledCoursesResponse,
    isFetching: isFetchingEnrolledCourses,
    isLoading: isLoadingEnrolledCourses,
  } = useQuery({
    ...getCourseEnrollmentsForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: { page: 0, size: DEFAULT_PAGE_SIZE } },
    }),
    enabled: Boolean(student?.uuid),
  });

  const {
    data: enrolledClassesResponse,
    isFetching: isFetchingEnrolledClasses,
    isLoading: isLoadingEnrolledClasses,
  } = useQuery({
    ...getClassEnrollmentsForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: { page: 0, size: DEFAULT_PAGE_SIZE } },
    }),
    enabled: Boolean(student?.uuid),
  });

  const enrolledClasses = enrolledClassesResponse?.data?.content ?? [];
  const enrolledCourses = enrolledCoursesResponse?.data?.content ?? [];

  const { data: certificatesResponse } = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: studentUuid ?? '' } }),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.reference,
  });

  const certificates = certificatesResponse?.data ?? [];
  const programIds = useMemo(
    () =>
      Array.from(new Set(certificates.map(certificate => certificate.program_uuid).filter(Boolean))),
    [certificates]
  );
  const certificateCourseIds = useMemo(
    () =>
      Array.from(new Set(certificates.map(certificate => certificate.course_uuid).filter(Boolean))),
    [certificates]
  );

  const classDefinitionIds = useMemo(
    () =>
      Array.from(
        new Set(
          enrolledClasses
            .filter(classEnrollment => isActiveClassEnrollment(classEnrollment.latest_enrollment_status))
            .map(classEnrollment => classEnrollment.class_definition_uuid)
            .filter(Boolean)
        )
      ),
    [enrolledClasses]
  );

  const { classDefinitionMap, isLoading: isLoadingClassDefinitions } = useClassesByIds(
    classDefinitionIds
  );

  const courseIdsFromClasses = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitionIds
            .map(classUuid => classDefinitionMap[classUuid]?.course_uuid)
            .filter(Boolean)
        )
      ),
    [classDefinitionIds, classDefinitionMap]
  );

  const courseIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...enrolledCourses.map(courseEnrollment => courseEnrollment.course_uuid),
          ...certificateCourseIds,
          ...courseIdsFromClasses,
        ].filter(Boolean))
      ),
    [courseIdsFromClasses, certificateCourseIds, enrolledCourses]
  );

  const { courseMap, isLoading: isLoadingCoursesLookup } = useCoursesByIds(courseIds as string[]);

  const courseCreatorIds = useMemo(
    () =>
      Array.from(
        new Set(
          courseIds
            .map((courseUuid) => courseMap[courseUuid]?.course_creator_uuid)
            .filter(Boolean)
        )
      ),
    [courseIds, courseMap]
  );

  const { courseCreatorMap, isLoading: isLoadingCourseCreators } = useCourseCreatorsByIds(
    courseCreatorIds
  );

  const instructorIds = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitionIds
            .map(classUuid => classDefinitionMap[classUuid]?.default_instructor_uuid)
            .filter(Boolean)
        )
      ),
    [classDefinitionIds, classDefinitionMap]
  );

  const { instructorMap, isLoading: isLoadingInstructors } = useInstructorsByIds(instructorIds as string[]);

  const organisationIds = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitionIds
            .map(classUuid => classDefinitionMap[classUuid]?.organisation_uuid)
            .filter(Boolean)
        )
      ),
    [classDefinitionIds, classDefinitionMap]
  );

  const { organisationMap, isLoading: isLoadingOrganisations } = useOrganisationsByIds(
    organisationIds as string[]
  );

  const { programMap, isLoading: isLoadingPrograms } = useProgramsByIds(programIds as string[]);

  const certificateDetails = useMemo(
    () =>
      certificates.map(certificate => ({
        ...certificate,
        course: certificate.course_uuid ? courseMap[certificate.course_uuid] ?? null : null,
        program: certificate.program_uuid ? programMap[certificate.program_uuid] ?? null : null,
      })),
    [certificates, courseMap, programMap]
  );

  const certificatesByCourse = useMemo(() => {
    const map = new Map<string, Certificate>();

    certificates.forEach(certificate => {
      if (certificate.is_valid && certificate.course_uuid && !map.has(certificate.course_uuid)) {
        map.set(certificate.course_uuid, certificate);
      }
    });

    return map;
  }, [certificates]);

  const courseEnrollmentMap = useMemo(() => {
    const map = new Map<string, StudentCourseEnrollmentSummary>();

    enrolledCourses.forEach(courseEnrollment => {
      if (courseEnrollment.course_uuid) {
        map.set(courseEnrollment.course_uuid, courseEnrollment);
      }
    });

    return map;
  }, [enrolledCourses]);

  const enrolledClassesAndCourses = useMemo<StudentOverviewEnrolledClassCourse[]>(() => {
    const rows: Array<StudentOverviewEnrolledClassCourse & { sortValue: number }> = [];

    enrolledClasses.forEach(classEnrollment => {
      if (!isActiveClassEnrollment(classEnrollment.latest_enrollment_status)) {
        return;
      }

      const classId = classEnrollment.class_definition_uuid;
      const classDefinition = classDefinitionMap[classId];
      const courseUuid = classDefinition?.course_uuid ?? null;
      const course = courseUuid ? courseMap[courseUuid] : undefined;
      const courseEnrollment = courseUuid ? courseEnrollmentMap.get(courseUuid) : undefined;
      const nextSchedule =
        classEnrollment.latest_scheduled_instance_start_time ?? classEnrollment.latest_activity_date;

      rows.push({
        id: classId,
        classId,
        classTitle: classDefinition?.title ?? classEnrollment.class_title ?? 'Class enrollment',
        classProvider: resolveClassProvider(classDefinition, instructorMap, organisationMap),
        classDescription: classDefinition?.description ?? null,
        courseId: courseUuid,
        courseTitle: course?.name ?? courseEnrollment?.course_name ?? null,
        courseProvider: course ? resolveCourseProvider(course, courseCreatorMap) : null,
        courseDescription: course?.description ?? null,
        enrollmentUuid: classEnrollment.latest_enrollment_uuid ?? null,
        enrollmentStatus: classEnrollment.latest_enrollment_status ?? null,
        courseEnrollmentUuid: courseEnrollment?.enrollment_uuid ?? null,
        courseEnrollmentStatus: courseEnrollment?.enrollment_status ?? null,
        progress: courseEnrollment?.progress_percentage ?? null,
        nextDateLabel: formatDateLabel(nextSchedule),
        scheduleCount: classEnrollment.scheduled_instance_count ?? 0,
        href: `/dashboard/student/learning-hub/classes/${classId}`,
        sortValue: nextSchedule?.getTime() ?? Number.MAX_SAFE_INTEGER,
      });
    });

    return rows
      .sort((a, b) => a.sortValue - b.sortValue)
      .map(({ sortValue: _sortValue, ...item }) => item);
  }, [classDefinitionMap, courseCreatorMap, courseEnrollmentMap, courseMap, enrolledClasses, instructorMap, organisationMap]);

  const activeCourses = useMemo<StudentOverviewActiveCourse[]>(() => {
    const resolvedCourses = enrolledCourses
      .map((courseEnrollment, index) => {
        if (!isActiveCourseEnrollment(courseEnrollment)) {
          return null;
        }

        const courseUuid = courseEnrollment.course_uuid;
        const updatedDate = courseEnrollment.updated_date;
        const course = courseMap[courseUuid];

        return {
          id: courseUuid,
          title: course?.name ?? courseEnrollment.course_name ?? 'Course enrollment',
          subtitle: buildCourseSubtitle(courseEnrollment),
          provider: course ? resolveCourseProvider(course, courseCreatorMap) : 'Course creator',
          progress:
            typeof courseEnrollment.progress_percentage === 'number'
              ? Math.max(0, Math.min(100, Math.round(courseEnrollment.progress_percentage)))
              : buildCourseProgress(certificatesByCourse.get(courseUuid), index),
          nextDateLabel: formatDateLabel(updatedDate),
          buttonLabel: 'Continue',
          href: '/dashboard/student/courses/my-courses',
          sortValue: updatedDate?.getTime() ?? 0,
        };
      })
      .filter((course): course is StudentOverviewActiveCourse & { sortValue: number } => course !== null)
      .reduce<Map<string, StudentOverviewActiveCourse & { sortValue: number }>>((map, course) => {
        const existing = map.get(course.id);

        if (!existing || course.sortValue > existing.sortValue) {
          map.set(course.id, course);
        }

        return map;
      }, new Map());

    return Array.from(resolvedCourses.values())
      .sort((a, b) => b.sortValue - a.sortValue)
      .slice(0, 2)
      .map(({ sortValue: _sortValue, ...course }) => course);
  }, [certificatesByCourse, courseCreatorMap, courseMap, enrolledCourses]);

  const assignmentScheduleQueries = useQueries({
    queries: classDefinitionIds.map(classUuid => ({
      ...getAssignmentSchedulesOptions({
        path: { classUuid },
      }),
      enabled: Boolean(studentUuid && classUuid),
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
  });

  const quizScheduleQueries = useQueries({
    queries: classDefinitionIds.map(classUuid => ({
      ...getQuizSchedulesOptions({
        path: { classUuid },
      }),
      enabled: Boolean(studentUuid && classUuid),
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
  });

  const assignmentSchedules = useMemo(
    () => assignmentScheduleQueries.flatMap(query => (query.data?.data ?? []) as ClassAssignmentSchedule[]),
    [assignmentScheduleQueries]
  );

  const quizSchedules = useMemo(
    () => quizScheduleQueries.flatMap(query => (query.data?.data ?? []) as ClassQuizSchedule[]),
    [quizScheduleQueries]
  );

  const assignmentIds = useMemo(
    () => Array.from(new Set(assignmentSchedules.map(schedule => schedule.assignment_uuid).filter(Boolean))),
    [assignmentSchedules]
  );
  const quizIds = useMemo(
    () => Array.from(new Set(quizSchedules.map(schedule => schedule.quiz_uuid).filter(Boolean))),
    [quizSchedules]
  );

  const { assignmentMap, isLoading: isLoadingAssignmentDetails } = useAssignmentsByIds(assignmentIds as string[]);
  const { quizMap, isLoading: isLoadingQuizDetails } = useQuizzesByIds(quizIds as string[]);

  const relevantEnrollmentIds = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...enrolledClasses.map(classEnrollment => classEnrollment.latest_enrollment_uuid),
            ...enrolledCourses.map(courseEnrollment => courseEnrollment.enrollment_uuid),
          ].filter(Boolean)
        )
      ),
    [enrolledClasses, enrolledCourses]
  );

  const { data: submissionsResponse, isFetching: isFetchingSubmissions } = useQuery({
    ...searchSubmissionsOptions({
      query: {
        searchParams: {
          enrollment_uuid_in: relevantEnrollmentIds.join(','),
        },
        pageable: {
          page: 0,
          size: ASSESSMENT_PAGE_SIZE,
        },
      },
    }),
    enabled: relevantEnrollmentIds.length > 0,
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
  });

  const { data: attemptsResponse, isFetching: isFetchingAttempts } = useQuery({
    ...searchAttemptsOptions({
      query: {
        searchParams: {
          enrollment_uuid_in: relevantEnrollmentIds.join(','),
        },
        pageable: {
          page: 0,
          size: ASSESSMENT_PAGE_SIZE,
        },
      },
    }),
    enabled: relevantEnrollmentIds.length > 0,
    staleTime: STALE_TIMES.live,
    refetchOnWindowFocus: false,
  });

  const submissionRows = submissionsResponse?.data?.content ?? [];
  const attemptRows = attemptsResponse?.data?.content ?? [];

  const submissionsByAssignment = useMemo(() => {
    const map = new Set<string>();

    submissionRows.forEach(submission => {
      if (submission.assignment_uuid) {
        map.add(submission.assignment_uuid);
      }
    });

    return map;
  }, [submissionRows]);

  const attemptsByQuiz = useMemo(() => {
    const map = new Set<string>();

    attemptRows.forEach(attempt => {
      if (attempt.quiz_uuid) {
        map.add(attempt.quiz_uuid);
      }
    });

    return map;
  }, [attemptRows]);

  const studentAssessments = useMemo<StudentOverviewAssessment[]>(() => {
    const rows: Array<StudentOverviewAssessment & { sortValue: number }> = [];

    assignmentSchedules.forEach(schedule => {
      const assignmentUuid = schedule.assignment_uuid;
      if (!assignmentUuid || submissionsByAssignment.has(assignmentUuid)) {
        return;
      }

      const assignment = assignmentMap[assignmentUuid];
      if (!assignment) {
        return;
      }

      const classUuid = schedule.class_definition_uuid ?? '';
      const classDefinition = classUuid ? classDefinitionMap[classUuid] : undefined;
      const courseUuid = classDefinition?.course_uuid ?? null;
      const course = courseUuid ? courseMap[courseUuid] : undefined;
      const dueDate = schedule.due_at ?? assignment.due_date ?? null;

      rows.push({
        id: `assignment-${assignmentUuid}-${schedule.uuid ?? classUuid}`,
        kind: 'assignment',
        title: assignment.title,
        provider: resolveClassProvider(classDefinition, instructorMap, organisationMap),
        classTitle: classDefinition?.title ?? 'Class assignment',
        courseTitle: course?.name ?? null,
        dueLabel: formatAssessmentDueLabel(dueDate),
        href: classUuid
          ? `/dashboard/assignment/assignment_${assignmentUuid}?classId=${classUuid}`
          : `/dashboard/assignment/assignment_${assignmentUuid}`,
        badgeLabel: 'Assignment',
        sortValue: dueDate ? new Date(dueDate).getTime() : Number.MAX_SAFE_INTEGER,
      });
    });

    quizSchedules.forEach(schedule => {
      const quizUuid = schedule.quiz_uuid;
      if (!quizUuid || attemptsByQuiz.has(quizUuid)) {
        return;
      }

      const quiz = quizMap[quizUuid];
      if (!quiz) {
        return;
      }

      const classUuid = schedule.class_definition_uuid ?? '';
      const classDefinition = classUuid ? classDefinitionMap[classUuid] : undefined;
      const courseUuid = classDefinition?.course_uuid ?? null;
      const course = courseUuid ? courseMap[courseUuid] : undefined;
      const dueDate = schedule.due_at ?? null;

      rows.push({
        id: `quiz-${quizUuid}-${schedule.uuid ?? classUuid}`,
        kind: 'quiz',
        title: quiz.title,
        provider: resolveClassProvider(classDefinition, instructorMap, organisationMap),
        classTitle: classDefinition?.title ?? 'Class quiz',
        courseTitle: course?.name ?? null,
        dueLabel: formatAssessmentDueLabel(dueDate),
        href: classUuid ? `/dashboard/assignment/quiz_${quizUuid}?classId=${classUuid}` : `/dashboard/assignment/quiz_${quizUuid}`,
        badgeLabel: 'Quiz',
        sortValue: dueDate ? new Date(dueDate).getTime() : Number.MAX_SAFE_INTEGER,
      });
    });

    return rows
      .sort((a, b) => a.sortValue - b.sortValue)
      .map(({ sortValue: _sortValue, ...assessment }) => assessment);
  }, [
    assignmentMap,
    assignmentSchedules,
    attemptsByQuiz,
    classDefinitionMap,
    courseMap,
    instructorMap,
    organisationMap,
    quizMap,
    quizSchedules,
    submissionsByAssignment,
  ]);

  const verifiedSkills = certificates.filter(item => item.is_valid).length;

  const newSkillsThisMonth = certificates.filter(item => {
    const completionDate = item.completion_date ? new Date(item.completion_date) : null;

    if (!completionDate || Number.isNaN(completionDate.getTime())) {
      return false;
    }

    const now = new Date();

    return (
      completionDate.getMonth() === now.getMonth() &&
      completionDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const skillsProgress = (() => {
    const totalItems = verifiedSkills + activeCourses.length;
    if (certificates.length === 0 && activeCourses.length === 0) {
      return 0;
    }

    const derived = Math.round((verifiedSkills / Math.max(totalItems, 1)) * 100);
    return Math.max(0, Math.min(100, derived));
  })();

  const isLoadingCourses =
    isFetchingEnrolledCourses ||
    isLoadingEnrolledCourses ||
    isFetchingEnrolledClasses ||
    isLoadingEnrolledClasses ||
    isLoadingClassDefinitions ||
    isLoadingCoursesLookup ||
    isLoadingCourseCreators ||
    isLoadingInstructors ||
    isLoadingOrganisations ||
    isLoadingPrograms ||
    isLoadingAssignmentDetails ||
    isLoadingQuizDetails ||
    isFetchingSubmissions ||
    isFetchingAttempts ||
    assignmentScheduleQueries.some(query => query.isLoading || query.isFetching) ||
    quizScheduleQueries.some(query => query.isLoading || query.isFetching);

  const opportunities: StudentOverviewOpportunity[] = [];
  const studentClassInvite: StudentClassInvite[] = [];

  return {
    firstName,
    searchPlaceholder: 'Search courses, opportunities,..',
    skillsProgress,
    verifiedSkills,
    newSkillsThisMonth,
    activeCourses,
    enrolledClassesAndCourses,
    opportunities,
    studentClassInvite,
    certificates: certificateDetails,
    assessments: studentAssessments,
    isLoadingCourses,
  };
}
