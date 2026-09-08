import { ArrowLeft, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import {
  AccessCard,
  CourseHero,
  type CourseCurriculumLesson,
  CurriculumTab,
  EnrolPanel,
  GateBanner,
  GlanceCard,
  OverviewTab,
} from '@/src/features/course-record/blocks';
import {
  formatCourseDuration,
  getCourseDisplayTitle,
  stripRichText,
  toBulletLines,
} from '@/src/features/catalogue/format';
import {
  PROSPECT_ACCESS_LABEL,
  PROSPECT_BREADCRUMB_ROOT,
} from '@/src/features/catalogue/prospect';
import type { CourseTrainingRequirement } from '@/services/client';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { CataloguePageShell } from './CataloguePageShell';
import { CatalogueStatusCard } from './CatalogueStatusCard';

/**
 * The public course record, as a prospect sees it.
 *
 * Server-rendered, so a crawler receives the record as HTML and the first paint
 * carries the hero rather than a spinner — the one reason this is not the client
 * `CourseRecordPage`. It renders the record's own blocks, which take props and
 * never fetch, so the design is shared rather than copied.
 */

/** The one viewer state a public listing has. The API decides it everywhere else. */
const PROSPECT = 'prospect' as const;

export function PublicCourseDetailPage({ detail }: { detail: PublicCourseDetail | null }) {
  if (!detail) {
    return (
      <CataloguePageShell>
        <div className='space-y-10'>
          <BackToCourses />
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

  const { course, creator, creatorName, lessons, priceAmount, currencyCode } = detail;

  const title = getCourseDisplayTitle(course);
  const categories = Array.isArray(course.category_names) ? course.category_names : [];

  // Outline only: the public response carries no lesson items, so `items` stays
  // absent and the block renders its locked notice instead of an empty list.
  // The block wants the full record shape; the public projection carries the
  // display fields, and course_uuid is known here.
  const requirements = (course.training_requirements ?? []).map(requirement => ({
    ...requirement,
    course_uuid: course.uuid ?? '',
    name: requirement.name ?? '',
    requirement_type: (requirement.requirement_type ??
      'equipment') as CourseTrainingRequirement['requirement_type'],
    provided_by: requirement.provided_by as CourseTrainingRequirement['provided_by'],
  }));

  const curriculum: CourseCurriculumLesson[] = lessons.map((lesson, index) => ({
    number: lesson.lesson_number || index + 1,
    title: lesson.title ?? `Lesson ${index + 1}`,
    objective: stripRichText(lesson.learning_objectives) || stripRichText(lesson.description),
  }));

  return (
    <CataloguePageShell contentClassName='gap-0 py-10 lg:py-12'>
      <div className='mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <BackToCourses />
          <span className='text-border hidden sm:inline'>/</span>
          <span className='text-muted-foreground hidden truncate text-sm sm:inline'>
            {PROSPECT_BREADCRUMB_ROOT} · {title}
          </span>
        </div>

        <span className='border-primary/30 bg-primary/10 text-primary inline-flex h-[26px] items-center gap-1.5 rounded-[10px] border px-2.5 text-xs font-semibold'>
          <span className='size-1.5 rounded-full bg-current' />
          {PROSPECT_ACCESS_LABEL}
        </span>
      </div>

      <CourseHero
        className='mb-5'
        title={title}
        summary={stripRichText(course.description)}
        categories={categories}
        status={course.status}
        creatorName={creatorName}
        creatorRole={creator?.professional_headline || 'Course creator'}
        lessonCount={lessons.length}
        duration={formatCourseDuration(course) ?? undefined}
      />

      <GateBanner
        access={PROSPECT}
        className='mb-[22px]'
        actionHref={course.intro_video_url ?? undefined}
      />

      <div className='grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='flex min-w-0 flex-col gap-[18px]'>
          <OverviewTab
            access={PROSPECT}
            description={course.description}
            objectives={toBulletLines(course.objectives)}
            prerequisites={toBulletLines(course.prerequisites)}
            requirements={requirements}
          />
          <CurriculumTab access={PROSPECT} lessons={curriculum} lessonCount={lessons.length} />
        </div>

        <aside className='flex min-w-0 flex-col gap-4 lg:sticky lg:top-24'>
          <AccessCard access={PROSPECT} />
          <GlanceCard access={PROSPECT} />
          <EnrolPanel
            price={priceAmount ?? undefined}
            currency={currencyCode ?? undefined}
            enrolHref='/auth/create-account'
            compareHref={`/courses/${course.uuid ?? ''}`}
          />
        </aside>
      </div>
    </CataloguePageShell>
  );
}

function BackToCourses() {
  return (
    <Link
      href='/courses'
      className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors'
    >
      <ArrowLeft className='size-4' aria-hidden='true' />
      Back to courses
    </Link>
  );
}
