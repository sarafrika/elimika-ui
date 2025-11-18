'use client';

import {
  calculateCourseAnalytics,
  calculateMonetizationSummary,
  calculateTrainingRequirementSummary,
} from '@/lib/course-creator/utils';
import {
  type CourseCreatorDashboardData,
  emptyCourseCreatorDashboardData,
} from '@/lib/types/course-creator';
import type { Course } from '@/services/client';
import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';
import { useUserProfile } from './profile-context';

type CourseCreatorContextValue = {
  data: CourseCreatorDashboardData;
  profile: CourseCreatorDashboardData['profile'];
  courses: Course[];
  refresh: () => void;
  isLoading: boolean;
  isReady: boolean;
};

const CourseCreatorContext = createContext<CourseCreatorContextValue | null>(null);

type CourseCreatorProviderProps = {
  children: ReactNode;
  initialData?: CourseCreatorDashboardData;
};

export function CourseCreatorProvider({ children, initialData }: CourseCreatorProviderProps) {
  const router = useRouter();
  const profile = useUserProfile();
  const profileLoading = profile?.isLoading ?? false;

  const mergedData = useMemo(() => {
    const base = initialData ?? emptyCourseCreatorDashboardData;
    const courseCreatorProfile =
      (profile?.courseCreator as CourseCreatorDashboardData['profile']) ?? base.profile;

    const organisationAssignments =
      profile?.organisation_affiliations
        ?.filter(affiliation => affiliation.domain_in_organisation === 'course_creator')
        ?.map(affiliation => ({
          organisationUuid: affiliation.organisation_uuid,
          organisationName: affiliation.organisation_name,
          branchUuid: affiliation.branch_uuid,
          branchName: affiliation.branch_name,
          startDate: affiliation.start_date,
          active: affiliation.active,
        })) ?? [];

    const assignments = {
      hasGlobalAccess:
        profile?.user_domain?.includes('course_creator') ?? base.assignments.hasGlobalAccess,
      organisations:
        organisationAssignments.length > 0
          ? organisationAssignments
          : base.assignments.organisations,
    };

    const courses = base.courses ?? [];
    const analytics = calculateCourseAnalytics(courses);
    const monetization = calculateMonetizationSummary(courses);
    const trainingRequirements = calculateTrainingRequirementSummary(courses);
    const verification = {
      adminVerified: courseCreatorProfile?.admin_verified ?? base.verification.adminVerified,
      profileComplete:
        courseCreatorProfile?.is_profile_complete ?? base.verification.profileComplete,
      lastUpdated: courseCreatorProfile?.updated_date
        ? new Date(courseCreatorProfile.updated_date)
        : base.verification.lastUpdated,
      createdDate: courseCreatorProfile?.created_date
        ? new Date(courseCreatorProfile.created_date)
        : base.verification.createdDate,
    };

    return {
      ...base,
      userUuid: profile?.uuid ?? base.userUuid,
      profile: courseCreatorProfile,
      courses,
      analytics,
      monetization,
      trainingRequirements,
      assignments,
      verification,
    };
  }, [initialData, profile]);

  const refresh = useCallback(() => router.refresh(), [router]);

  const hasProfile = Boolean(mergedData.profile);

  const value = useMemo<CourseCreatorContextValue>(
    () => ({
      data: mergedData,
      profile: mergedData.profile,
      courses: mergedData.courses,
      refresh,
      isLoading: profileLoading && !hasProfile,
      isReady: hasProfile && !profileLoading,
    }),
    [mergedData, refresh, profileLoading, hasProfile]
  );

  return <CourseCreatorContext.Provider value={value}>{children}</CourseCreatorContext.Provider>;
}

export function useCourseCreator() {
  const context = useContext(CourseCreatorContext);
  if (!context) {
    throw new Error('useCourseCreator must be used within a CourseCreatorProvider');
  }
  return context;
}

export function useOptionalCourseCreator() {
  return useContext(CourseCreatorContext);
}
