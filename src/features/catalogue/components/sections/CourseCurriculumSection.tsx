import { BookOpen, ChevronDown, Lock } from 'lucide-react';
import { stripRichText } from '@/src/features/catalogue/format';
import {
  formatCatalogueCount,
  PROSPECT_CONTENT,
} from '@/src/features/catalogue/prospect';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { RecordChip } from './RecordSurfaces';

/**
 * The curriculum — the lesson list, in the record view's accordion treatment.
 *
 * ## The lock is in the data, not in the CSS
 *
 * A prospect is entitled to the syllabus and nothing below it. This page fetches
 * lessons and only lessons: `getPublicCourseDetail` never asks for lesson
 * content, so there are no content items in the payload to unhide, to read out
 * of the network tab, or to leak in the server-rendered HTML that crawlers
 * receive. The locked notice is rendered *instead of* an item list, not over one.
 *
 * Disclosure is a native `<details>` rather than React state, because this page
 * is a server component and must stay one. That keeps every lesson title and
 * objective in the markup a crawler reads while still collapsing the list for a
 * reader.
 */
export function CourseCurriculumSection({ lessons }: { lessons: PublicCourseDetail['lessons'] }) {
  if (lessons.length === 0) {
    return null;
  }

  const summary = `${formatCatalogueCount(lessons.length)} lesson${lessons.length === 1 ? '' : 's'}`;

  return (
    <section className='min-w-0'>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <h2 className='mr-1 text-[15px] font-bold'>Course curriculum</h2>

        <RecordChip>
          <BookOpen className='size-[13px]' aria-hidden />
          {summary}
        </RecordChip>

        <RecordChip className='border-primary/30 bg-primary/10 text-primary font-semibold'>
          {PROSPECT_CONTENT.badge}
        </RecordChip>

        <RecordChip>
          <Lock className='size-[13px]' aria-hidden />
          View-only · no download
        </RecordChip>
      </div>

      <div className='flex flex-col gap-2.5'>
        {lessons.map((lesson, index) => (
          <LessonRow
            key={lesson.uuid ?? `${lesson.title}-${index}`}
            lesson={lesson}
            number={lesson.lesson_number || index + 1}
          />
        ))}
      </div>

      <p className='text-muted-foreground mt-3 flex items-center gap-[7px] text-xs'>
        <Lock className='size-3.5 flex-none' aria-hidden />
        {PROSPECT_CONTENT.readonlyNote}
      </p>
    </section>
  );
}

function LessonRow({
  lesson,
  number,
}: {
  lesson: PublicCourseDetail['lessons'][number];
  number: number;
}) {
  // The objective is the line the design puts under the title; the description
  // is the paragraph the panel opens onto. Either may be missing.
  const objective = stripRichText(lesson.learning_objectives) || stripRichText(lesson.description);
  const description = stripRichText(lesson.description);

  return (
    <details className='group bg-card overflow-hidden rounded-xl border shadow-sm'>
      <summary className='hover:bg-muted/40 flex w-full cursor-pointer list-none items-center gap-3.5 px-4 py-3.5 text-left transition-colors [&::-webkit-details-marker]:hidden'>
        <span
          className='inline-flex size-[38px] flex-none items-center justify-center rounded-lg text-[13px] font-bold text-white'
          style={{
            /* The two brand steps the record view calls b600 and b800, mixed
               from --primary so the public catalogue re-hues for free. */
            backgroundImage:
              'linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 55%, black) 100%)',
          }}
        >
          {number}
        </span>

        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-semibold tracking-[-0.005em]'>{lesson.title}</span>
          {objective ? (
            <span className='text-muted-foreground mt-0.5 block truncate text-xs'>{objective}</span>
          ) : null}
        </span>

        <ChevronDown
          className='text-muted-foreground/70 size-4 flex-none transition-transform group-open:rotate-180'
          aria-hidden
        />
      </summary>

      <div className='border-t'>
        {description ? (
          <p className='text-foreground/80 px-4 pt-3.5 text-[13px] leading-[1.6]'>{description}</p>
        ) : null}

        <div className='border-border/70 bg-muted text-muted-foreground m-2.5 flex items-center gap-2.5 rounded-lg border border-dashed px-3.5 py-3 text-xs'>
          <Lock className='size-[15px] flex-none' aria-hidden />
          <span>
            <b className='text-foreground/80 font-semibold'>Lesson content</b>
            {` — ${PROSPECT_CONTENT.lockedNote}`}
          </span>
        </div>
      </div>
    </details>
  );
}
