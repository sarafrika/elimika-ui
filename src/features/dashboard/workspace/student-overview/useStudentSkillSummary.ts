'use client';

import { useMemo } from 'react';
import {
  isActiveCourseEnrollment,
  type StudentOverviewSection,
  uniqueIds,
  useStudentCertificates,
  useStudentCourseEnrollments,
} from './useStudentOverviewData';

export type StudentSkillSummary = {
  skillsProgress: number;
  verifiedSkills: number;
  newSkillsThisMonth: number;
};

/** Mirrors the Active Courses card, which shows at most two courses. */
const ACTIVE_COURSE_LIMIT = 2;

/** Hero numbers: certificates plus enrolment rows only, no entity lookups. */
export function useStudentSkillSummary(): StudentOverviewSection<StudentSkillSummary> {
  const certificatesQuery = useStudentCertificates();
  const enrollmentsQuery = useStudentCourseEnrollments();
  const { certificates } = certificatesQuery;
  const { enrollments } = enrollmentsQuery;

  const data = useMemo<StudentSkillSummary>(() => {
    const verifiedSkills = certificates.filter(item => item.is_valid).length;
    const now = new Date();
    const newSkillsThisMonth = certificates.filter(item => {
      const completionDate = item.completion_date ? new Date(item.completion_date) : null;
      if (!completionDate || Number.isNaN(completionDate.getTime())) {
        return false;
      }
      return (
        completionDate.getMonth() === now.getMonth() &&
        completionDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const activeCourseCount = Math.min(
      ACTIVE_COURSE_LIMIT,
      uniqueIds(
        enrollments.filter(isActiveCourseEnrollment).map(enrollment => enrollment.course_uuid)
      ).length
    );

    let skillsProgress = 0;
    if (certificates.length > 0 || activeCourseCount > 0) {
      const totalItems = verifiedSkills + activeCourseCount;
      const derived = Math.round((verifiedSkills / Math.max(totalItems, 1)) * 100);
      skillsProgress = Math.max(0, Math.min(100, derived));
    }

    return { skillsProgress, verifiedSkills, newSkillsThisMonth };
  }, [certificates, enrollments]);

  return {
    data,
    isLoading: certificatesQuery.isLoading || enrollmentsQuery.isLoading,
    error: certificatesQuery.error ?? enrollmentsQuery.error,
    refetch: () => {
      certificatesQuery.refetch();
      enrollmentsQuery.refetch();
    },
  };
}
