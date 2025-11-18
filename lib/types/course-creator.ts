import type { Course, CourseCreator } from '@/services/client';

export interface CourseCreatorAssignment {
  organisationUuid?: string;
  organisationName?: string;
  branchUuid?: string;
  branchName?: string;
  startDate?: Date;
  active?: boolean;
  contractType?: string;
}

export interface CourseCreatorAnalyticsSummary {
  totalCourses: number;
  publishedCourses: number;
  inReviewCourses: number;
  draftCourses: number;
  archivedCourses: number;
}

export interface CourseCreatorMonetizationSummary {
  coursesWithMinimumFee: number;
  minimumFeeAverage: number | null;
  minimumFeeFloor: number | null;
  minimumFeeCeiling: number | null;
  creatorShareRange: [number, number] | null;
  instructorShareRange: [number, number] | null;
  consistentRevenueSplit: boolean;
}

export interface CourseCreatorTrainingRequirementSummary {
  totalRequirements: number;
  mandatoryRequirements: number;
  optionalRequirements: number;
}

export interface CourseCreatorVerificationStatus {
  adminVerified: boolean;
  profileComplete: boolean;
  lastUpdated?: Date;
  createdDate?: Date;
}

export interface CourseCreatorAssignments {
  hasGlobalAccess: boolean;
  organisations: CourseCreatorAssignment[];
}

export interface CourseCreatorDashboardData {
  userUuid: string | null;
  profile: CourseCreator | null;
  courses: Course[];
  analytics: CourseCreatorAnalyticsSummary;
  monetization: CourseCreatorMonetizationSummary;
  trainingRequirements: CourseCreatorTrainingRequirementSummary;
  verification: CourseCreatorVerificationStatus;
  assignments: CourseCreatorAssignments;
}

export const emptyCourseCreatorDashboardData: CourseCreatorDashboardData = {
  userUuid: null,
  profile: null,
  courses: [],
  analytics: {
    totalCourses: 0,
    publishedCourses: 0,
    inReviewCourses: 0,
    draftCourses: 0,
    archivedCourses: 0,
  },
  monetization: {
    coursesWithMinimumFee: 0,
    minimumFeeAverage: null,
    minimumFeeFloor: null,
    minimumFeeCeiling: null,
    creatorShareRange: null,
    instructorShareRange: null,
    consistentRevenueSplit: true,
  },
  trainingRequirements: {
    totalRequirements: 0,
    mandatoryRequirements: 0,
    optionalRequirements: 0,
  },
  verification: {
    adminVerified: false,
    profileComplete: false,
    lastUpdated: undefined,
    createdDate: undefined,
  },
  assignments: {
    hasGlobalAccess: false,
    organisations: [],
  },
};
