import type { Course, CourseAssessment, Lesson, LessonContent } from '@/services/client/types.gen';

export type PublishReadinessState = {
  canPublish: boolean;
  missingFields: string[];
};

type CourseStructure = {
  lessons: readonly (Lesson & { uuid: string })[];
  lessonContentMap: ReadonlyMap<string, readonly LessonContent[]>;
  lessonAssessmentCounts: ReadonlyMap<string, number>;
  assessments: readonly CourseAssessment[];
};

export type CoursePublishReadinessInput = {
  course?: Partial<Course> | null;
  name?: string;
  courseCreatorUuid?: string;
  categories?: readonly string[];
  difficulty?: string;
  description?: string;
  objectives?: string;
  durationHours?: number;
  classLimit?: number;
  minimumTrainingFee?: number;
  creatorSharePercentage?: number;
  instructorSharePercentage?: number;
  ageLowerLimit?: number;
  ageUpperLimit?: number;
  thumbnailUrl?: unknown;
  bannerUrl?: unknown;
  isFree?: boolean;
  structure?: CourseStructure;
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const numberProvided = (value?: number, allowZero = false) =>
  Number.isFinite(value) && (allowZero ? Number(value) >= 0 : Number(value) > 0);

export function getCoursePublishReadiness({
  course,
  structure,
  name = course?.name,
  courseCreatorUuid = course?.course_creator_uuid,
  categories = course?.category_uuids ?? [],
  difficulty = course?.difficulty_uuid ?? undefined,
  description = course?.description,
  objectives = course?.objectives,
  durationHours = course?.duration_hours,
  classLimit = course?.class_limit ?? undefined,
  minimumTrainingFee = course?.minimum_training_fee ?? undefined,
  creatorSharePercentage = course?.creator_share_percentage,
  instructorSharePercentage = course?.instructor_share_percentage,
  ageLowerLimit = course?.age_lower_limit ?? undefined,
  ageUpperLimit = course?.age_upper_limit ?? undefined,
  thumbnailUrl = course?.thumbnail_url,
  bannerUrl = course?.banner_url,
  isFree = false,
}: CoursePublishReadinessInput): PublishReadinessState {
  const missingFields: string[] = [];

  if (!name?.trim()) missingFields.push('Please enter course name');
  if (!courseCreatorUuid?.trim()) missingFields.push('Please select a course creator');
  if (!categories.length) missingFields.push('Please select a category');
  if (!difficulty?.trim()) missingFields.push('Please select a difficulty level for this course');
  if (!stripHtml(description ?? '').length) missingFields.push('Please enter a description for the course');
  if (!stripHtml(objectives ?? '').length) missingFields.push('Please enter the course objectives');
  if (!numberProvided(durationHours)) missingFields.push('Please enter the estimated duration of the course in hours');
  if (!numberProvided(classLimit)) missingFields.push('Please enter the maximum number of students allowed in the course');
  if (!isFree && !numberProvided(minimumTrainingFee)) missingFields.push('Please enter the minimum fee for the course');

  if (!numberProvided(creatorSharePercentage, true) || !numberProvided(instructorSharePercentage, true)) {
    missingFields.push('Please enter the creator and instructor share percentages');
  } else if (Math.abs(Number(creatorSharePercentage) + Number(instructorSharePercentage) - 100) > 0.01) {
    missingFields.push('Creator and instructor shares must add up to 100%');
  }

  if (!numberProvided(ageLowerLimit)) missingFields.push('Please enter the minimum age requirement for students');
  if (!numberProvided(ageUpperLimit)) missingFields.push('Please enter the maximum age requirement for students');
  if (!String(thumbnailUrl ?? '').trim()) missingFields.push('Please provide a thumbnail image URL for the course');
  if (!String(bannerUrl ?? '').trim()) missingFields.push('Please provide a banner image URL for the course');

  if (structure) {
    if (!structure.lessons.length) {
      missingFields.push('Please create at least one lesson for the course');
    } else {
      structure.lessons.forEach((lesson, index) => {
        const label = lesson.title?.trim() || `Lesson ${index + 1}`;
        if (!structure.lessonContentMap.get(lesson.uuid)?.length) {
          missingFields.push(`${label} must have at least one content item`);
        }
        if ((structure.lessonAssessmentCounts.get(lesson.uuid) ?? 0) < 1) {
          missingFields.push(`${label} must have at least one assessment task`);
        }
      });
    }

    const totalWeight = structure.assessments.reduce(
      (total, assessment) => total + Number(assessment.weight_percentage ?? 0),
      0
    );
    if (!structure.assessments.length || Math.abs(totalWeight - 100) > 0.01) {
      missingFields.push(`Course assessment weights must total 100% (currently ${totalWeight}%)`);
    }
  }

  return { canPublish: missingFields.length === 0, missingFields };
}
