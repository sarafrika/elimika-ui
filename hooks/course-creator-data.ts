'use client';

import { useQuery } from '@tanstack/react-query';
import {
  calculateCourseAnalytics,
  calculateMonetizationSummary,
  calculateTrainingRequirementSummary,
} from '@/lib/course-creator/utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  type CourseCreatorDashboardData,
  emptyCourseCreatorDashboardData,
} from '@/lib/types/course-creator';
import { type Course, type CourseCreator, searchCourses } from '@/services/client';
import { useUserProfile } from '../context/profile-context';

/** First-load state of the creator's course list, for sections derived from it. */
export type CourseCreatorCoursesStatus = {
  loading: boolean;
  error: unknown;
  refetch: () => unknown;
};

/**
 * Course-creator dashboard data. The user record, domains and course-creator
 * profile come from the profile context (previously re-fetched here), and the
 * course list is a shared React Query — multiple mounts (layout + page) make
 * one request instead of one each.
 */
export function useCourseCreatorDashboardData() {
  const user = useUserProfile();

  const userUuid = user?.uuid;
  const userDomains: string[] = Array.isArray(user?.user_domain) ? user.user_domain : [];
  const hasCourseCreatorDomain = userDomains.includes('course_creator');
  const courseCreator = (user?.courseCreator ?? null) as CourseCreator | null;

  const coursesQuery = useQuery({
    queryKey: ['course-creator-dashboard-courses', courseCreator?.uuid],
    queryFn: async () => {
      const response = await searchCourses({
        query: {
          searchParams: { course_creator_uuid_eq: courseCreator?.uuid },
          pageable: { page: 0, size: 100, sort: [] },
        },
      });
      const content = response.data?.data?.content;
      return Array.isArray(content) ? (content as Course[]) : [];
    },
    enabled: Boolean(hasCourseCreatorDomain && courseCreator?.uuid),
    staleTime: STALE_TIMES.entity,
  });

  const loading = Boolean(user?.isLoading) || coursesQuery.isLoading;
  const coursesStatus: CourseCreatorCoursesStatus = {
    loading,
    error: coursesQuery.error,
    refetch: coursesQuery.refetch,
  };

  if (!userUuid) {
    return { data: emptyCourseCreatorDashboardData, loading, coursesStatus };
  }

  if (!hasCourseCreatorDomain) {
    return {
      data: { ...emptyCourseCreatorDashboardData, userUuid },
      loading,
      coursesStatus,
    };
  }

  const courses = coursesQuery.data ?? [];

  const data: CourseCreatorDashboardData = {
    userUuid,
    profile: courseCreator,
    courses,
    analytics: calculateCourseAnalytics(courses),
    monetization: calculateMonetizationSummary(courses),
    trainingRequirements: calculateTrainingRequirementSummary(courses),
    verification: {
      adminVerified: courseCreator?.admin_verified ?? false,
      profileComplete: courseCreator?.is_profile_complete ?? false,
      lastUpdated: courseCreator?.updated_date ? new Date(courseCreator.updated_date) : undefined,
      createdDate: courseCreator?.created_date ? new Date(courseCreator.created_date) : undefined,
    },
    assignments: {
      hasGlobalAccess: hasCourseCreatorDomain,
      organisations: [],
    },
  };

  return { data, loading, coursesStatus };
}
