'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassEnrollmentsForStudentOptions,
  getCourseEnrollmentsForStudentOptions,
  getStudentCertificatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  Course,
  CourseCreator,
  Instructor,
  Organisation,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
  StudentCourseOverviewItem,
  TrainingProgram,
} from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

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

/** Shape every section hook returns, so each card drives its own AsyncSection. */
export type StudentOverviewSection<T> = {
  data: T;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
};

const DEFAULT_PAGE_SIZE = 100;
const NO_COURSE_ENROLLMENTS: StudentCourseEnrollmentSummary[] = [];
const NO_CLASS_ENROLLMENTS: StudentClassEnrollmentSummary[] = [];
const NO_CERTIFICATES: Certificate[] = [];

export const formatDateLabel = (value?: Date | string) => {
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

export const isActiveCourseEnrollment = (
  course?: Pick<StudentCourseEnrollmentSummary, 'enrollment_status'>
) => {
  if (!course?.enrollment_status) {
    return true;
  }

  const status = course.enrollment_status.toUpperCase();
  return !['CANCELLED', 'COMPLETED', 'DROPPED', 'WITHDRAWN', 'ARCHIVED'].includes(status);
};

export const isActiveClassEnrollment = (
  status?: StudentClassEnrollmentSummary['latest_enrollment_status']
) => {
  if (!status) {
    return true;
  }

  return status !== 'CANCELLED';
};

/** A course-overview row the learner is still taking, by class and course enrolment status. */
export const isActiveOverviewItem = (item: StudentCourseOverviewItem) =>
  isActiveClassEnrollment(item.latest_enrollment_status) &&
  isActiveCourseEnrollment({ enrollment_status: item.course_enrollment_status ?? undefined });

export function resolveClassProvider(
  classDefinition:
    | { organisation_uuid?: string | null; default_instructor_uuid?: string | null }
    | undefined,
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

export function resolveCourseProvider(
  course: Course | undefined,
  courseCreatorMap: Record<string, CourseCreator>
) {
  if (!course?.course_creator_uuid) {
    return 'Course creator';
  }

  return courseCreatorMap[course.course_creator_uuid]?.full_name ?? 'Course creator';
}

export function uniqueIds(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

/** The signed-in student's uuid, plus whether the profile is still resolving it. */
export function useStudentIdentity() {
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid;
  return {
    studentUuid,
    isResolving: !studentUuid && Boolean(profile?.isLoading),
  };
}

/*
 * Root queries shared by the overview sections. Identical query keys mean React
 * Query sends each request once, and every section starts it in parallel.
 */
export function useStudentCourseEnrollments(enabled = true) {
  const { studentUuid, isResolving } = useStudentIdentity();
  const query = useQuery({
    ...getCourseEnrollmentsForStudentOptions({
      path: { studentUuid: studentUuid as string },
      query: { pageable: { page: 0, size: DEFAULT_PAGE_SIZE } },
    }),
    enabled: enabled && Boolean(studentUuid),
    staleTime: STALE_TIMES.live,
  });
  return {
    enrollments: query.data?.data?.content ?? NO_COURSE_ENROLLMENTS,
    isLoading: enabled && (isResolving || (query.isLoading && !query.data)),
    error: query.error,
    refetch: query.refetch,
  };
}

export function useStudentClassEnrollments(enabled = true) {
  const { studentUuid, isResolving } = useStudentIdentity();
  const query = useQuery({
    ...getClassEnrollmentsForStudentOptions({
      path: { studentUuid: studentUuid as string },
      query: { pageable: { page: 0, size: DEFAULT_PAGE_SIZE } },
    }),
    enabled: enabled && Boolean(studentUuid),
    staleTime: STALE_TIMES.live,
  });
  return {
    enrollments: query.data?.data?.content ?? NO_CLASS_ENROLLMENTS,
    isLoading: enabled && (isResolving || (query.isLoading && !query.data)),
    error: query.error,
    refetch: query.refetch,
  };
}

export function useStudentCertificates() {
  const { studentUuid, isResolving } = useStudentIdentity();
  const query = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: studentUuid as string } }),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.reference,
  });
  return {
    certificates: query.data?.data ?? NO_CERTIFICATES,
    isLoading: isResolving || (query.isLoading && !query.data),
    error: query.error,
    refetch: query.refetch,
  };
}
