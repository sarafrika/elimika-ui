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
import type {
  Course,
  CourseTrainingRequirement,
  ProgramRequirement,
  TrainingProgram,
} from '@/services/client';
import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';
import { useTrainingRequirementsByIds } from './../hooks/use-batched-lookups';
import { useUserProfile } from './profile-context';

type CourseCreatorContextValue = {
  data: CourseCreatorDashboardData;
  profile: CourseCreatorDashboardData['profile'];
  courses: Course[];
  courseRequirementMap: Record<string, CourseTrainingRequirement[]>;
  programRequirementMap: Record<string, ProgramRequirement[]>;
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
    const programs = (base.programs ?? []) as TrainingProgram[];
    const analytics = calculateCourseAnalytics(courses, programs);
    const monetization = calculateMonetizationSummary(courses);
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
      programs,
      analytics,
      monetization,
      assignments,
      verification,
    };
  }, [initialData, profile]);

  const courseUuidList = useMemo(
    () => (mergedData.courses ?? []).map(course => course.uuid).filter(Boolean) as string[],
    [mergedData.courses]
  );
  const programUuidList = useMemo(
    () => (mergedData.programs ?? []).map(program => program.uuid).filter(Boolean) as string[],
    [mergedData.programs]
  );

  const { courseRequirementMap, programRequirementMap } = useTrainingRequirementsByIds(
    courseUuidList,
    programUuidList
  );

  const trainingRequirements = useMemo(
    () =>
      calculateTrainingRequirementSummary(
        mergedData.courses,
        mergedData.programs,
        Object.values(courseRequirementMap).flat(),
        Object.values(programRequirementMap).flat()
      ),
    [courseRequirementMap, mergedData.courses, mergedData.programs, programRequirementMap]
  );

  const mergedDataWithRequirements = useMemo(
    () => ({
      ...mergedData,
      programs: mergedData.programs,
      trainingRequirements,
    }),
    [mergedData, trainingRequirements]
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  const hasProfile = Boolean(mergedData.profile);

  const value = useMemo<CourseCreatorContextValue>(
    () => ({
      data: mergedDataWithRequirements,
      profile: mergedDataWithRequirements.profile,
      courses: mergedDataWithRequirements.courses,
      courseRequirementMap: courseRequirementMap,
      programRequirementMap: programRequirementMap,
      refresh,
      isLoading: profileLoading && !hasProfile,
      isReady: hasProfile && !profileLoading,
    }),
    [courseRequirementMap, mergedDataWithRequirements, profileLoading, hasProfile, programRequirementMap, refresh]
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
