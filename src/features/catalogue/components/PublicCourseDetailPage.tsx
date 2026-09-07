import { ArrowLeft, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { getCourseDisplayTitle } from '@/src/features/catalogue/format';
import {
  PROSPECT_ACCESS_LABEL,
  PROSPECT_BREADCRUMB_ROOT,
} from '@/src/features/catalogue/prospect';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { CataloguePageShell } from './CataloguePageShell';
import { CatalogueStatusCard } from './CatalogueStatusCard';
import { CourseAccessCard } from './sections/CourseAccessCard';
import { CourseCurriculumSection } from './sections/CourseCurriculumSection';
import { CourseDetailHero } from './sections/CourseDetailHero';
import { CourseEnrolPanel } from './sections/CourseEnrolPanel';
import { CourseGateBanner } from './sections/CourseGateBanner';
import { CourseGlanceCard } from './sections/CourseGlanceCard';
import { CourseOverviewSection } from './sections/CourseOverviewSection';

/**
 * The public course record, as a prospect sees it.
 *
 * This is the one course-detail surface in the platform that is **not** the
 * client `CourseRecordPage`, and deliberately so: it is server-rendered, so a
 * crawler receives the whole record as HTML and the first paint carries the
 * hero rather than a spinner (see `src/features/course-record/ADOPTION.md`,
 * "Server rendering and SEO"). What it borrows from the record view is the
 * design — the back bar and access pill, the gradient hero and stat strip, the
 * gate banner, the body column and the 380px rail — not the machinery.
 *
 * Access is not decided here. A public listing has one viewer state, the
 * least-privileged of the eight, and this page shows the syllabus and the
 * commercial terms a learner is buying under. It never fetches lesson content,
 * so there is nothing withheld in the markup that a reader could recover; and it
 * never touches a rate card, a margin or a trainer's pay, which belong to the
 * parties in that contract and not to a public page.
 */
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

  const title = getCourseDisplayTitle(detail.course);

  return (
    <CataloguePageShell contentClassName='gap-0 py-10 lg:py-12'>
      {/* ── back bar ─────────────────────────────────────────────────── */}
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

      {/* ── hero + stat strip ────────────────────────────────────────── */}
      <CourseDetailHero detail={detail} className='mb-5' />

      {/* ── gate banner ──────────────────────────────────────────────── */}
      <CourseGateBanner introVideoUrl={detail.course.intro_video_url} className='mb-[22px]' />

      {/* ── body + rail ──────────────────────────────────────────────── */}
      <div className='grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='flex min-w-0 flex-col gap-[18px]'>
          <CourseOverviewSection detail={detail} />
          <CourseCurriculumSection lessons={detail.lessons} />
        </div>

        <aside className='flex min-w-0 flex-col gap-4 lg:sticky lg:top-24'>
          <CourseAccessCard />
          <CourseGlanceCard detail={detail} />
          <CourseEnrolPanel detail={detail} />
        </aside>
      </div>
    </CataloguePageShell>
  );
}

function BackToCourses() {
  return (
    <Link
      href='/courses'
      className='text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-2 rounded-[10px] px-2.5 text-sm font-medium transition-colors'
    >
      <ArrowLeft className='size-4' />
      Back to courses
    </Link>
  );
}
