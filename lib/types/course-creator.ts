import type { Course, CourseCreator, TrainingProgram } from '@/services/client';

interface CourseCreatorAssignment {
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
  totalPrograms: number;
  publishedCourses: number;
  publishedPrograms: number;
  inReviewCourses: number;
  draftCourses: number;
  draftPrograms: number;
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
  courseCount: number;
  programCount: number;
  publishedCourseCount: number;
  publishedProgramCount: number;
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
  programs: TrainingProgram[];
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
  programs: [],
  analytics: {
    totalCourses: 0,
    totalPrograms: 0,
    publishedCourses: 0,
    publishedPrograms: 0,
    inReviewCourses: 0,
    draftCourses: 0,
    draftPrograms: 0,
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
    courseCount: 0,
    programCount: 0,
    publishedCourseCount: 0,
    publishedProgramCount: 0,
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
