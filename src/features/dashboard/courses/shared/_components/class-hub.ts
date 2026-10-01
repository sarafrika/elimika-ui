/**
 * Pure helpers for the class hub pages (student learning hub and instructor training hub):
 * tab ids, schedule totals, and the shapes the course-record blocks take.
 */

import type { CourseCurriculumLesson, CourseReview } from '@/src/features/course-record';
import { courseBulletLines } from '@/src/features/course-record/blocks/OverviewTab';
import { courseContentKind } from '@/src/features/course-record/blocks/CurriculumTab';

/* Tabs ------------------------------------------------------------------------------- */

export const CLASS_COURSE_TABS = [
  'overview',
  'curriculum',
  'assessment',
  'schedule',
  'reviews',
] as const;
export type ClassCourseTab = (typeof CLASS_COURSE_TABS)[number];

export const CLASS_PROGRAM_TABS = [
  'overview',
  'curriculum',
  'courses',
  'assessment',
  'requirements',
  'schedule',
  'reviews',
] as const;
export type ClassProgramTab = (typeof CLASS_PROGRAM_TABS)[number];

export const CLASS_HUB_TAB_LABELS: Record<ClassCourseTab | ClassProgramTab, string> = {
  overview: 'Overview',
  curriculum: 'Curriculum',
  courses: 'Courses',
  assessment: 'Assessment',
  requirements: 'Requirements',
  schedule: 'Schedule',
  reviews: 'Reviews',
};

/** Who is reading the class page; each route passes its own. */
export type ClassHubViewer = 'student' | 'instructor';

/* Schedule --------------------------------------------------------------------------- */

type ScheduleLike = {
  start_time?: string | Date | null;
  duration_minutes?: number | string | bigint | null;
};

/** Contact time across every session, e.g. "12h 30m", "4h". */
export function scheduleTotalDuration(schedule: readonly ScheduleLike[] | null | undefined) {
  const totalMinutes = (schedule ?? []).reduce(
    (sum, item) => sum + (Number(item.duration_minutes) || 0),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ''}`;
}

/** Calendar weeks between the first and last session, counting both; 0 with no sessions. */
export function scheduleWeekSpan(schedule: readonly ScheduleLike[] | null | undefined) {
  const timestamps = (schedule ?? [])
    .map(item => (item.start_time ? new Date(item.start_time).getTime() : Number.NaN))
    .filter(time => Number.isFinite(time));
  if (timestamps.length === 0) return 0;
  const diffDays = Math.floor(
    (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24)
  );
  return Math.floor(diffDays / 7) + 1;
}

/** "1h 5m" between two instants; "-" when either is missing or the range is backwards. */
export function sessionDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return '-';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diff) || diff < 0) return '-';
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

/* Curriculum ------------------------------------------------------------------------- */

type LessonWithContentLike = {
  lesson?: {
    uuid?: string;
    title?: string;
    lesson_number?: number;
    description?: string | null;
    learning_objectives?: string | null;
  } | null;
  content?: {
    data?: ReadonlyArray<{
      uuid?: string;
      title: string;
      is_required?: boolean;
      content_category?: string;
      mime_type?: string;
    }>;
  } | null;
};

/**
 * Lessons with their content, as `CurriculumTab` draws them: ordered by lesson number, items
 * left out when the content was not fetched (students only get the lesson list).
 */
export function toCurriculumLessons(
  items: readonly LessonWithContentLike[] | null | undefined
): CourseCurriculumLesson[] {
  return [...(items ?? [])]
    .filter(item => item.lesson)
    .sort((a, b) => (a.lesson?.lesson_number ?? 0) - (b.lesson?.lesson_number ?? 0))
    .map((item, index) => {
      const lesson = item.lesson ?? {};
      const number = lesson.lesson_number ?? index + 1;
      const contents = item.content?.data;
      return {
        number,
        title: lesson.title || `Lesson ${number}`,
        objective:
          courseBulletLines(lesson.learning_objectives ?? undefined)[0] ??
          courseBulletLines(lesson.description ?? undefined)[0],
        itemCount: contents?.length,
        items: contents?.map(content => ({
          uuid: content.uuid,
          title: content.title,
          kind: courseContentKind(content.content_category ?? content.mime_type),
          required: content.is_required,
        })),
      };
    });
}

/* Reviews ---------------------------------------------------------------------------- */

type ReviewLike = {
  uuid?: string;
  rating?: number;
  headline?: string;
  comments?: string;
  is_anonymous?: boolean;
  student_uuid?: string | null;
  created_date?: Date;
};

/** Class and programme reviews in the shape `ReviewsTab` reads. */
export function toBlockReviews(reviews: readonly ReviewLike[] | null | undefined): CourseReview[] {
  return (reviews ?? []).map(review => ({
    uuid: review.uuid,
    course_uuid: '',
    student_uuid: review.student_uuid ?? '',
    rating: typeof review.rating === 'number' ? review.rating : 0,
    headline: review.headline,
    comments: review.comments,
    is_anonymous: review.is_anonymous,
    created_date: review.created_date,
  }));
}

/** Student uuids worth resolving to names: the reviews that are not anonymous. */
export function reviewerUuids(reviews: readonly ReviewLike[] | null | undefined): string[] {
  return [
    ...new Set(
      (reviews ?? [])
        .filter(review => !review.is_anonymous && review.student_uuid)
        .map(review => review.student_uuid as string)
    ),
  ];
}

/** The `student_uuid → name` map `ReviewsTab` takes. */
export function reviewerNameMap(
  students: Readonly<Record<string, { full_name?: string | null } | undefined>> | undefined
): Record<string, string> {
  const names: Record<string, string> = {};
  for (const [uuid, student] of Object.entries(students ?? {})) {
    if (student?.full_name) names[uuid] = student.full_name;
  }
  return names;
}

/** Mean rating to one decimal, or null with nothing rated. */
export function averageRating(reviews: readonly ReviewLike[] | null | undefined): number | null {
  const rated = (reviews ?? []).filter(review => typeof review.rating === 'number');
  if (rated.length === 0) return null;
  const sum = rated.reduce((total, review) => total + (review.rating ?? 0), 0);
  return Math.round((sum / rated.length) * 10) / 10;
}
