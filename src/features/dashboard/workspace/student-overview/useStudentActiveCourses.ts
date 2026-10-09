'use client';

import { useMemo } from 'react';
import type { Certificate, StudentCourseEnrollmentSummary } from '@/services/client/types.gen';
import { useCourseCreatorsByIds, useCoursesByIds } from '../../../../../hooks/use-batched-lookups';
import {
  formatDateLabel,
  isActiveCourseEnrollment,
  resolveCourseProvider,
  type StudentOverviewActiveCourse,
  type StudentOverviewSection,
  uniqueIds,
  useStudentCertificates,
  useStudentCourseEnrollments,
} from './useStudentOverviewData';

const FALLBACK_PROGRESS = [60, 45, 72, 55];
const ACTIVE_COURSE_LIMIT = 2;

const humanizeStatus = (value?: string | null) =>
  value ? value.replace(/_/g, ' ').toLowerCase() : '';

const buildCourseSubtitle = (course?: StudentCourseEnrollmentSummary) => {
  const parts = [
    humanizeStatus(course?.enrollment_status),
    course?.updated_date ? `Updated ${formatDateLabel(course.updated_date)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return parts || 'Course enrollment';
};

const buildCourseProgress = (certificate: Certificate | undefined, index: number) => {
  if (typeof certificate?.final_grade === 'number') {
    return Math.max(20, Math.min(100, Math.round(certificate.final_grade)));
  }

  return FALLBACK_PROGRESS[index % FALLBACK_PROGRESS.length] ?? 0;
};

/*
 * The card renders as soon as enrolments land (titles come from the enrolment row);
 * the course and creator lookups only refine the provider label in place.
 */
export function useStudentActiveCourses(): StudentOverviewSection<StudentOverviewActiveCourse[]> {
  const enrollmentsQuery = useStudentCourseEnrollments();
  const { certificates } = useStudentCertificates();
  const { enrollments } = enrollmentsQuery;

  const courseIds = useMemo(
    () =>
      uniqueIds(
        enrollments.filter(isActiveCourseEnrollment).map(enrollment => enrollment.course_uuid)
      ),
    [enrollments]
  );
  const { courseMap } = useCoursesByIds(courseIds);

  const courseCreatorIds = useMemo(
    () => uniqueIds(courseIds.map(courseUuid => courseMap[courseUuid]?.course_creator_uuid)),
    [courseIds, courseMap]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(courseCreatorIds);

  const certificatesByCourse = useMemo(() => {
    const map = new Map<string, Certificate>();
    for (const certificate of certificates) {
      if (certificate.is_valid && certificate.course_uuid && !map.has(certificate.course_uuid)) {
        map.set(certificate.course_uuid, certificate);
      }
    }
    return map;
  }, [certificates]);

  const data = useMemo<StudentOverviewActiveCourse[]>(() => {
    const latestByCourse = new Map<string, StudentOverviewActiveCourse & { sortValue: number }>();

    enrollments.forEach((courseEnrollment, index) => {
      if (!isActiveCourseEnrollment(courseEnrollment)) {
        return;
      }

      const courseUuid = courseEnrollment.course_uuid;
      const updatedDate = courseEnrollment.updated_date;
      const course = courseMap[courseUuid];
      const row = {
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

      const existing = latestByCourse.get(row.id);
      if (!existing || row.sortValue > existing.sortValue) {
        latestByCourse.set(row.id, row);
      }
    });

    return Array.from(latestByCourse.values())
      .sort((a, b) => b.sortValue - a.sortValue)
      .slice(0, ACTIVE_COURSE_LIMIT)
      .map(({ sortValue: _sortValue, ...course }) => course);
  }, [certificatesByCourse, courseCreatorMap, courseMap, enrollments]);

  return {
    data,
    isLoading: enrollmentsQuery.isLoading,
    error: enrollmentsQuery.error,
    refetch: () => {
      enrollmentsQuery.refetch();
    },
  };
}
