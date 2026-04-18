'use client';

import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getPublishedCoursesOptions,
  getStudentCertificatesOptions,
  getStudentScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  ClassDefinition,
  Course,
  StudentSchedule,
} from '@/services/client/types.gen';
import { useStudent } from '@/context/student-context';
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

type StudentOverviewData = {
  firstName: string;
  searchPlaceholder: string;
  skillsProgress: number;
  verifiedSkills: number;
  newSkillsThisMonth: number;
  activeCourses: StudentOverviewActiveCourse[];
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
  const firstName =
    profile?.first_name || profile?.student?.first_name || profile?.user?.first_name || 'Sarah';

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

  const { data: publishedCoursesResponse } = useQuery({
    ...getPublishedCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: 3,
        },
      },
    }),
    refetchOnWindowFocus: false,
  });

  const certificates = certificatesResponse?.data ?? [];
  const schedules = scheduleResponse?.data ?? [];
  const publishedCourses = publishedCoursesResponse?.data?.content ?? [];

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

  const certificatesByCourse = useMemo(() => {
    const map = new Map<string, Certificate>();

    certificates.forEach(certificate => {
      if (certificate.is_valid && certificate.course_uuid && !map.has(certificate.course_uuid)) {
        map.set(certificate.course_uuid, certificate);
      }
    });

    return map;
  }, [certificates]);

  const activeCourses = useMemo<StudentOverviewActiveCourse[]>(() => {
    const resolvedCourses = Array.from(classDefinitions.entries())
      .map(([classId, classDefinition]) => {
        const courseUuid = classDefinition.course_uuid;
        const course = courseUuid ? coursesMap.get(courseUuid) : undefined;
        const relatedSchedules = schedules.filter(item => item.class_definition_uuid === classId);
        const nextSchedule = relatedSchedules
          .map(item => item.start_time)
          .filter((value): value is Date => value instanceof Date)
          .sort((a, b) => a.getTime() - b.getTime())[0];

        return {
          id: classId,
          title: course?.name ?? classDefinition.title,
          subtitle: buildCourseSubtitle(course),
          progress: buildCourseProgress(
            courseUuid ? certificatesByCourse.get(courseUuid) : undefined,
            relatedSchedules.length
          ),
          nextDateLabel: formatDateLabel(nextSchedule),
          buttonLabel: 'Continue',
          sortValue: nextSchedule?.getTime() ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((a, b) => a.sortValue - b.sortValue)
      .slice(0, 2)
      .map(({ sortValue: _sortValue, ...course }) => course);

    if (resolvedCourses.length > 0) {
      return resolvedCourses;
    }

    return publishedCourses.slice(0, 2).map((course, index) => ({
      id: course.uuid ?? `published-${index}`,
      title: course.name,
      subtitle: buildCourseSubtitle(course),
      progress: FALLBACK_PROGRESS[index % FALLBACK_PROGRESS.length],
      nextDateLabel: index === 0 ? 'May 28, 2024' : 'May 27, 2024',
      buttonLabel: 'Continue',
    }));
  }, [certificatesByCourse, classDefinitions, coursesMap, publishedCourses, schedules]);

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
    opportunities: MOCK_OPPORTUNITIES,
    isLoadingCourses,
  };
}
