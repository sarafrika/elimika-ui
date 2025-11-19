import type { Course, CourseTrainingRequirement } from '@/services/client';
import type {
  CourseCreatorAnalyticsSummary,
  CourseCreatorMonetizationSummary,
  CourseCreatorTrainingRequirementSummary,
} from '../types/course-creator';

export function calculateCourseAnalytics(courses: Course[]): CourseCreatorAnalyticsSummary {
  return courses.reduce<CourseCreatorAnalyticsSummary>(
    (acc, course) => {
      acc.totalCourses += 1;
      switch (course.status) {
        case 'published':
          acc.publishedCourses += 1;
          break;
        case 'in_review':
          acc.inReviewCourses += 1;
          break;
        case 'draft':
          acc.draftCourses += 1;
          break;
        case 'archived':
          acc.archivedCourses += 1;
          break;
        default:
          break;
      }
      return acc;
    },
    {
      totalCourses: 0,
      publishedCourses: 0,
      inReviewCourses: 0,
      draftCourses: 0,
      archivedCourses: 0,
    }
  );
}

export function calculateMonetizationSummary(courses: Course[]): CourseCreatorMonetizationSummary {
  const minimumFees = courses
    .map(course => course.minimum_training_fee)
    .filter((fee): fee is number => typeof fee === 'number');

  const creatorShares = courses
    .map(course => course.creator_share_percentage)
    .filter((share): share is number => typeof share === 'number');

  const instructorShares = courses
    .map(course => course.instructor_share_percentage)
    .filter((share): share is number => typeof share === 'number');

  const minimumFeeAverage =
    minimumFees.length > 0
      ? Number((minimumFees.reduce((sum, fee) => sum + fee, 0) / minimumFees.length).toFixed(2))
      : null;

  const minimumFeeFloor = minimumFees.length > 0 ? Math.min(...minimumFees) : null;
  const minimumFeeCeiling = minimumFees.length > 1 ? Math.max(...minimumFees) : minimumFeeFloor;

  const creatorShareRange =
    creatorShares.length > 0
      ? ([Math.min(...creatorShares), Math.max(...creatorShares)] as [number, number])
      : null;

  const instructorShareRange =
    instructorShares.length > 0
      ? ([Math.min(...instructorShares), Math.max(...instructorShares)] as [number, number])
      : null;

  const consistentRevenueSplit =
    creatorShareRange !== null &&
    instructorShareRange !== null &&
    creatorShareRange[0] === creatorShareRange[1] &&
    instructorShareRange[0] === instructorShareRange[1];

  return {
    coursesWithMinimumFee: minimumFees.length,
    minimumFeeAverage,
    minimumFeeFloor,
    minimumFeeCeiling,
    creatorShareRange,
    instructorShareRange,
    consistentRevenueSplit,
  };
}

export function calculateTrainingRequirementSummary(
  courses: Course[]
): CourseCreatorTrainingRequirementSummary {
  const requirements = courses.flatMap(course => course.training_requirements ?? []);
  const totalRequirements = requirements.length;
  const mandatoryRequirements = requirements.filter(
    (requirement: CourseTrainingRequirement) => requirement.is_mandatory
  ).length;

  return {
    totalRequirements,
    mandatoryRequirements,
    optionalRequirements: totalRequirements - mandatoryRequirements,
  };
}
