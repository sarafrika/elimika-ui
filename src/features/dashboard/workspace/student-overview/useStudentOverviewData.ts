'use client';

import { useStudent } from '@/context/student-context';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getCourseEnrollmentsOptions,
  getStudentCertificatesOptions,
  getStudentScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  ClassDefinition,
  Course,
  CourseEnrollment,
  StudentSchedule,
} from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

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
  id: string;
  title: string;
  company: string;
  meta: string;
  location: string;
  match: number;
  badge: string;
  badgeTone: 'teal' | 'amber';
  footer: string;
};

export type StudentOverviewEnrolledClassCourse = {
  id: string;
  classId: string;
  classTitle: string;
  courseId: string | null;
  courseTitle: string | null;
  enrollmentUuid: string | null;
  enrollmentStatus: StudentSchedule['enrollment_status'] | null;
  courseEnrollmentUuid: string | null;
  courseEnrollmentStatus: CourseEnrollment['status'] | null;
  progress: number | null;
  nextDateLabel: string;
  scheduleCount: number;
  href: string;
};

type StudentOverviewData = {
  firstName: string;
  searchPlaceholder: string;
  skillsProgress: number;
  verifiedSkills: number;
  newSkillsThisMonth: number;
  activeCourses: StudentOverviewActiveCourse[];
  enrolledClassesAndCourses: StudentOverviewEnrolledClassCourse[];
  opportunities: StudentOverviewOpportunity[];
  isLoadingCourses: boolean;
};

const FALLBACK_PROGRESS = [60, 45, 72, 55];

const MOCK_OPPORTUNITIES: StudentOverviewOpportunity[] = [
  {
    id: 'junior-web-developer',
    title: 'Junior Web Developer',
    company: 'BrightWave Marketing',
    meta: 'AI Match',
    location: 'Nairobi, Kenya',
    match: 82,
    badge: 'AI Match',
    badgeTone: 'teal',
    footer: 'Hybrid · Full-Time',
  },
  {
    id: 'internship-program',
    title: 'Internship Program',
    company: 'CreativeBrands',
    meta: 'Pending',
    location: 'In-Office',
    match: 89,
    badge: 'Pending',
    badgeTone: 'amber',
    footer: 'Ongoing · May 23rd',
  },
  {
    id: 'part-time-data-analyst',
    title: 'Part-Time Data Analyst',
    company: 'Data Insight Hub',
    meta: 'AI Match',
    location: 'Cape Town, S. Africa',
    match: 75,
    badge: 'AI Match',
    badgeTone: 'teal',
    footer: 'Part-Time · Remote',
  },
];

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

const stripHtml = (value?: string) => value?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const buildCourseSubtitle = (course?: Course) => {
  const details = [course?.category_names?.[0], `${course?.duration_hours ?? 0}h ${course?.duration_minutes ?? 0}m`]
    .filter(Boolean)
    .join(' | ');

  return details || 'Google | Beginner';
};

const buildCourseProgress = (certificate: Certificate | undefined, index: number) => {
  if (typeof certificate?.final_grade === 'number') {
    return Math.max(20, Math.min(100, Math.round(certificate.final_grade)));
  }

  return FALLBACK_PROGRESS[index % FALLBACK_PROGRESS.length];
};

export function useStudentOverviewData(): StudentOverviewData {
  const profile = useUserProfile();
  const student = useStudent();

  const firstName = profile?.first_name || student?.full_name?.split(' ')[0] || 'Sarah';

  const { data: certificatesResponse } = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } }),
    enabled: Boolean(student?.uuid),
  });

  const { data: scheduleResponse, isLoading: isLoadingCourses } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: {
        start: new Date('2025-01-01'),
        end: new Date('2027-12-31'),
      },
    }),
    enabled: Boolean(student?.uuid),
  });

  const certificates = certificatesResponse?.data ?? [];
  const schedules = scheduleResponse?.data ?? [];

  const uniqueClassIds = useMemo(
    () =>
      Array.from(
        new Set(
          schedules
            .map((item: StudentSchedule) => item.class_definition_uuid)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [schedules]
  );

  const classDefinitionQueries = useQueries({
    queries: uniqueClassIds.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
    })),
  });

  const classDefinitions = useMemo(() => {
    const map = new Map<string, ClassDefinition>();

    classDefinitionQueries.forEach((query, index) => {
      const uuid = uniqueClassIds[index];
      const classDefinition = query.data?.data?.class_definition;

      if (uuid && classDefinition) {
        map.set(uuid, classDefinition);
      }
    });

    return map;
  }, [classDefinitionQueries, uniqueClassIds]);

  const courseIds = useMemo(
    () =>
      Array.from(
        new Set(
          Array.from(classDefinitions.values())
            .map(item => item.course_uuid)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [classDefinitions]
  );

  const courseQueries = useQueries({
    queries: courseIds.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
    })),
  });

  const coursesMap = useMemo(() => {
    const map = new Map<string, Course>();

    courseQueries.forEach((query, index) => {
      const uuid = courseIds[index];
      const course = query.data?.data;

      if (uuid && course) {
        map.set(uuid, course);
      }
    });

    return map;
  }, [courseIds, courseQueries]);

  const courseEnrollmentQueries = useQueries({
    queries: courseIds.map(courseUuid => ({
      ...getCourseEnrollmentsOptions({
        path: { courseUuid },
        query: {
          pageable: {
            page: 0,
            size: 100,
          },
        },
      }),
      enabled: Boolean(courseUuid),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const courseEnrollmentsMap = useMemo(() => {
    const map = new Map<string, CourseEnrollment>();

    courseEnrollmentQueries.forEach((query, index) => {
      const courseUuid = courseIds[index];
      const matchingEnrollment =
        query.data?.data?.content?.find(
          enrollment => enrollment.student_uuid === student?.uuid
        ) ?? null;

      if (courseUuid && matchingEnrollment) {
        map.set(courseUuid, matchingEnrollment);
      }
    });

    return map;
  }, [courseEnrollmentQueries, courseIds, student?.uuid]);

  const certificatesByCourse = useMemo(() => {
    const map = new Map<string, Certificate>();

    certificates.forEach(certificate => {
      if (certificate.is_valid && certificate.course_uuid && !map.has(certificate.course_uuid)) {
        map.set(certificate.course_uuid, certificate);
      }
    });

    return map;
  }, [certificates]);

  const enrolledClassesAndCourses = useMemo<StudentOverviewEnrolledClassCourse[]>(() => {
    const rows: Array<StudentOverviewEnrolledClassCourse & { sortValue: number }> = [];

    Array.from(classDefinitions.entries()).forEach(([classId, classDefinition]) => {
      const relatedSchedules = schedules.filter(item => item.class_definition_uuid === classId);
      const enrolledSchedule =
        relatedSchedules.find(item => item.enrollment_status !== 'CANCELLED') ??
        relatedSchedules[0];

      if (!enrolledSchedule || enrolledSchedule.enrollment_status === 'CANCELLED') {
        return;
      }
      const courseUuid = classDefinition.course_uuid ?? null;
      const course = courseUuid ? coursesMap.get(courseUuid) : undefined;
      const courseEnrollment = courseUuid ? courseEnrollmentsMap.get(courseUuid) : undefined;
      const nextSchedule = relatedSchedules
        .map(item => item.start_time)
        .filter((value): value is Date => value instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      rows.push({
        id: classId,
        classId,
        classTitle: classDefinition.title,
        courseId: courseUuid,
        courseTitle: course?.name ?? null,
        enrollmentUuid: enrolledSchedule.enrollment_uuid ?? null,
        enrollmentStatus: enrolledSchedule.enrollment_status ?? null,
        courseEnrollmentUuid: courseEnrollment?.uuid ?? null,
        courseEnrollmentStatus: courseEnrollment?.status ?? null,
        progress:
          typeof courseEnrollment?.progress_percentage === 'number'
            ? Math.max(0, Math.min(100, Math.round(courseEnrollment.progress_percentage)))
            : null,
        nextDateLabel: formatDateLabel(nextSchedule),
        scheduleCount: relatedSchedules.length,
        href: `/dashboard/schedule/classes/${classId}`,
        sortValue: nextSchedule?.getTime() ?? Number.MAX_SAFE_INTEGER,
      });
    });

    return rows
      .sort((a, b) => a.sortValue - b.sortValue)
      .map(({ sortValue: _sortValue, ...item }) => item);
  }, [classDefinitions, courseEnrollmentsMap, coursesMap, schedules]);


  const activeCourses = useMemo<StudentOverviewActiveCourse[]>(() => {
    const resolvedCourses = Array.from(classDefinitions.entries())
      .map(([classId, classDefinition]) => {
        const courseUuid = classDefinition.course_uuid;
        const course = courseUuid ? coursesMap.get(courseUuid) : undefined;
        const enrollment = courseUuid ? courseEnrollmentsMap.get(courseUuid) : undefined;
        const relatedSchedules = schedules.filter(item => item.class_definition_uuid === classId);
        const nextSchedule = relatedSchedules
          .map(item => item.start_time)
          .filter((value): value is Date => value instanceof Date)
          .sort((a, b) => a.getTime() - b.getTime())[0];

        if (!enrollment || (!enrollment.is_active && enrollment.status !== 'ACTIVE')) {
          return null;
        }

        return {
          id: courseUuid ?? classId,
          title: course?.name ?? classDefinition.title,
          subtitle: buildCourseSubtitle(course),
          progress:
            typeof enrollment.progress_percentage === 'number'
              ? Math.max(0, Math.min(100, Math.round(enrollment.progress_percentage)))
              : buildCourseProgress(
                courseUuid ? certificatesByCourse.get(courseUuid) : undefined,
                relatedSchedules.length
              ),
          nextDateLabel: formatDateLabel(nextSchedule),
          buttonLabel: 'Continue',
          href: courseUuid ? `/dashboard/courses/${courseUuid}` : '/dashboard/courses',
          sortValue: nextSchedule?.getTime() ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((course): course is StudentOverviewActiveCourse & { sortValue: number } => course !== null)
      .reduce<Map<string, StudentOverviewActiveCourse & { sortValue: number }>>((map, course) => {
        const existing = map.get(course.id);

        if (!existing || course.sortValue < existing.sortValue) {
          map.set(course.id, course);
        }

        return map;
      }, new Map());

    const dedupedCourses = Array.from(resolvedCourses.values())
      .sort((a, b) => a.sortValue - b.sortValue)
      .slice(0, 2)
      .map(({ sortValue: _sortValue, ...course }) => course);

    return dedupedCourses;
  }, [certificatesByCourse, classDefinitions, courseEnrollmentsMap, coursesMap, schedules]);

  const verifiedSkills = certificates.filter(item => item.is_valid).length || 9;
  const newSkillsThisMonth =
    certificates.filter(item => {
      const completionDate = item.completion_date ? new Date(item.completion_date) : null;

      if (!completionDate || Number.isNaN(completionDate.getTime())) {
        return false;
      }

      const now = new Date();

      return (
        completionDate.getMonth() === now.getMonth() && completionDate.getFullYear() === now.getFullYear()
      );
    }).length || 3;

  const skillsProgress = (() => {
    if (certificates.length === 0 && activeCourses.length === 0) {
      return 75;
    }

    const derived = Math.round((verifiedSkills / Math.max(verifiedSkills + activeCourses.length, 1)) * 100);
    return Math.max(35, Math.min(95, derived));
  })();

  return {
    firstName,
    searchPlaceholder: 'Search courses, opportunities,..',
    skillsProgress,
    verifiedSkills,
    newSkillsThisMonth,
    activeCourses,
    enrolledClassesAndCourses,
    opportunities: MOCK_OPPORTUNITIES,
    isLoadingCourses:
      isLoadingCourses ||
      classDefinitionQueries.some(query => query.isLoading || query.isFetching) ||
      courseQueries.some(query => query.isLoading || query.isFetching) ||
      courseEnrollmentQueries.some(query => query.isLoading || query.isFetching),
  };
}
