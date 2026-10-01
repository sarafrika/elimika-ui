import { ArrowLeft, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import {
  type CoursePageModel,
  richTextBullets,
  toPlainSummary,
  withoutLeadingHeading,
} from '@/src/features/catalogue/course-page';
import {
  formatCourseDuration,
  getCourseDisplayTitle,
  sanitizeRichText,
  stripRichText,
  toSafeHref,
} from '@/src/features/catalogue/format';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { CataloguePageShell } from './CataloguePageShell';
import { CatalogueStatusCard } from './CatalogueStatusCard';
import { PublicCoursePage } from './course-page/PublicCoursePage';

/**
 * The public course page, as a prospect sees it.
 *
 * Server-rendered, so a crawler receives the whole record — every tab's panel — as HTML.
 * This file shapes the server's snapshot into a plain model; the client page owns the
 * tabs, the open classes and the actions.
 */
export function PublicCourseDetailPage({ detail }: { detail: PublicCourseDetail | null }) {
  if (!detail?.course.uuid) {
    return (
      <CataloguePageShell>
        <div className='space-y-10'>
          <Link
            href='/courses'
            className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors'
          >
            <ArrowLeft className='size-4' aria-hidden='true' />
            Back to courses
          </Link>
          <CatalogueStatusCard
            title='Course not found'
            description="The course you're looking for doesn't exist or has been removed."
            icon={CircleAlert}
            tone='error'
          />
        </div>
      </CataloguePageShell>
    );
  }

  return <PublicCoursePage model={toCoursePageModel(detail, detail.course.uuid)} />;
}

function toCoursePageModel(detail: PublicCourseDetail, uuid: string): CoursePageModel {
  const { course, creatorName, lessons } = detail;
  const minutes = course.duration_minutes ?? 0;
  const wholeHours =
    typeof course.duration_hours === 'number' && course.duration_hours > 0 && minutes === 0
      ? course.duration_hours
      : undefined;

  return {
    uuid,
    title: getCourseDisplayTitle(course),
    summary: toPlainSummary(course.description),
    descriptionHtml: withoutLeadingHeading(sanitizeRichText(course.description)),
    categories: Array.isArray(course.category_names) ? course.category_names : [],
    creatorName: creatorName || undefined,
    thumbnailUrl: course.thumbnail_url ?? undefined,
    introVideoUrl: toSafeHref(course.intro_video_url),
    difficultyUuid: course.difficulty_uuid,
    durationHours: wholeHours,
    durationLabel: wholeHours ? undefined : (formatCourseDuration(course) ?? undefined),
    objectives: richTextBullets(course.objectives),
    prerequisites: richTextBullets(course.prerequisites),
    requirements: (course.training_requirements ?? []).map(requirement => ({
      name: requirement.name,
      description: requirement.description,
      quantity: requirement.quantity,
      unit: requirement.unit,
      requirement_type: requirement.requirement_type,
      provided_by: requirement.provided_by,
      is_mandatory: requirement.is_mandatory,
    })),
    lessons: lessons.map((lesson, index) => ({
      number: lesson.lesson_number || index + 1,
      title: lesson.title ?? `Lesson ${index + 1}`,
      objective:
        richTextBullets(lesson.learning_objectives).join(' ') ||
        stripRichText(lesson.learning_objectives) ||
        stripRichText(lesson.description),
    })),
  };
}
