'use client';

import {
  getClassEnrollmentsForStudentOptions,
  getCourseEnrollmentsForStudentOptions,
  getStudentCertificatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  Certificate,
  Course,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
  TrainingProgram
} from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useClassesByIds, useCoursesByIds, useProgramsByIds } from '../../../../../hooks/use-batched-lookups';

export type StudentOverviewActiveCourse = {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
  nextDateLabel: string;
  buttonLabel: string;
  href: string;
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
  courseId: string | null;
  courseTitle: string | null;
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
  assessments: Assignment[];
  isLoadingCourses: boolean;
};

const DEFAULT_PAGE_SIZE = 100;
const FALLBACK_PROGRESS = [60, 45, 72, 55];


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

export function useStudentOverviewData(): StudentOverviewData {
  const profile = useUserProfile();
  const student = profile?.student;

  const firstName = profile?.first_name || student?.full_name?.split(' ')[0] || '';

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
  const enrolledCourses = enrolledCoursesResponse?.data?.content ?? [];

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

  const { classDefinitionMap } = useClassesByIds(['array of class uuids'])

  const enrolledClasses = enrolledClassesResponse?.data?.content ?? [];

  const { data: certificatesResponse } = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } }),
    enabled: Boolean(student?.uuid),
  });
  const isLoadingCourses =
    isLoadingEnrolledCourses ||
    isLoadingEnrolledClasses ||
    isFetchingEnrolledCourses ||
    isFetchingEnrolledClasses;

  const certificates = certificatesResponse?.data ?? [];

  const courseIds = [...new Set(certificates.flatMap(c => c.course_uuid ? [c.course_uuid] : []))];
  const programIds = [...new Set(certificates.flatMap(c => c.program_uuid ? [c.program_uuid] : []))];

  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);

  const certificateDetails = certificates.map((certificate) => ({
    ...certificate,
    course: certificate.course_uuid
      ? courseMap[certificate.course_uuid] ?? null
      : null,
    program: certificate.program_uuid
      ? programMap[certificate.program_uuid] ?? null
      : null,
  }));

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
    const map = new Map<string, (typeof enrolledCourses)[number]>();

    enrolledCourses.forEach(courseEnrollment => {
      if (courseEnrollment.course_uuid) {
        map.set(courseEnrollment.course_uuid, courseEnrollment);
      }
    });

    return map;
  }, [enrolledCourses]);

  console.log(enrolledClasses, "ENR CLASSES")
  console.log(enrolledCourses, "ENR COURSES")

  const enrolledClassesAndCourses = useMemo<StudentOverviewEnrolledClassCourse[]>(() => {
    const rows: Array<StudentOverviewEnrolledClassCourse & { sortValue: number }> = [];

    enrolledClasses.forEach(classEnrollment => {
      if (!isActiveClassEnrollment(classEnrollment.latest_enrollment_status)) {
        return;
      }

      const classId = classEnrollment.class_definition_uuid;

      const courseEnrollment =
        classEnrollment.course_uuid
          ? courseEnrollmentMap.get(classEnrollment.course_uuid)
          : undefined;

      const nextSchedule =
        classEnrollment.latest_scheduled_instance_start_time ??
        classEnrollment.latest_activity_date;

      rows.push({
        id: classId,
        classId,
        classTitle: classEnrollment.class_title ?? 'Class enrollment',

        courseId: courseEnrollment?.course_uuid ?? null,
        courseTitle: courseEnrollment?.course_title ?? null,

        enrollmentUuid: classEnrollment.latest_enrollment_uuid ?? null,
        enrollmentStatus: classEnrollment.latest_enrollment_status ?? null,

        courseEnrollmentUuid: courseEnrollment?.uuid ?? null,
        courseEnrollmentStatus: courseEnrollment?.latest_status ?? null,
        progress: courseEnrollment?.progress_percentage ?? null,

        nextDateLabel: formatDateLabel(nextSchedule),
        scheduleCount: classEnrollment.scheduled_instance_count ?? 0,
        href: `/dashboard/schedule/classes/${classId}`,
        sortValue: nextSchedule?.getTime() ?? Number.MAX_SAFE_INTEGER,
      });
    });

    return rows
      .sort((a, b) => a.sortValue - b.sortValue)
      .map(({ sortValue, ...item }) => item);
  }, [enrolledClasses, courseEnrollmentMap]);


  // For studentoverviewpage, we need to update the usestudentoverviewdata, for enrolledClassesAndCourses data, update the data to fetch full details about an active class/course, including its progress percentage
  // For StudentOverviewActiveCoursesCard, for the active courses, we need to add the course providers (class instructor name or organisation name --- for the uuids)
  // also for students upcomingassessment, let it fetch students assignment and quizzes that are assigned to a student but has not been attempted. update the usestudentoverviewdata and populate the UI with data (remove mock data)

  console.log(enrolledClassesAndCourses, "ENR CLASS COURSE")

  const activeCourses = useMemo<StudentOverviewActiveCourse[]>(() => {
    const resolvedCourses = enrolledCourses
      .map((courseEnrollment, index) => {
        if (!isActiveCourseEnrollment(courseEnrollment)) {
          return null;
        }

        const courseUuid = courseEnrollment.course_uuid;
        const updatedDate = courseEnrollment.updated_date;

        return {
          id: courseUuid,
          title: courseEnrollment.course_name ?? 'Course enrollment',
          subtitle: buildCourseSubtitle(courseEnrollment),
          progress:
            typeof courseEnrollment.progress_percentage === 'number'
              ? Math.max(0, Math.min(100, Math.round(courseEnrollment.progress_percentage)))
              : buildCourseProgress(certificatesByCourse.get(courseUuid), index),
          nextDateLabel: formatDateLabel(updatedDate),
          buttonLabel: 'Continue',
          // href: `/dashboard/courses/${courseUuid}`,
          href: `/dashboard/student/courses/my-courses`,
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

    const dedupedCourses = Array.from(resolvedCourses.values())
      .sort((a, b) => b.sortValue - a.sortValue)
      .slice(0, 2)
      .map(({ sortValue: _sortValue, ...course }) => course);

    return dedupedCourses;
  }, [certificatesByCourse, enrolledCourses]);

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

  const opportunities: StudentOverviewOpportunity[] = []
  const studentClassInvite: StudentClassInvite[] = []
  const studentAssessments: Assignment[] = []

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
