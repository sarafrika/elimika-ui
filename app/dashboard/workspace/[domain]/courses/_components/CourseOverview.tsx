"use client";

import RichTextRenderer from '@/components/editors/richTextRenders';
import type { Course } from '@/services/client';
import { CheckCircle2, ChevronDown, ChevronUp, Play, User2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import HTMLTextPreview from '../../../../../../components/editors/html-text-preview';

type LessonContentItem = {
  lesson: {
    uuid?: string;
    title: string;
    description?: string | null;
  };
  content?: {
    data?: Array<{
      uuid?: string;
      title: string;
      file_size_display?: string | null;
      description?: string | null;
    }>;
  };
};

type Props = {
  course: Course;
  creatorName: string;
  creatorHeadline: string;
  creatorBio: string;
  lessons: Array<{ uuid?: string; title: string }>;
  lessonsWithContent: LessonContentItem[];
  reviewCount: number;
  averageRating: string | null;
};

function splitBullets(value?: string | null) {
  if (!value) return [];
  return value
    .split(/\n|•|-/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export default function CourseOverview({
  course,
  creatorName,
  creatorHeadline,
  creatorBio,
  lessons,
  lessonsWithContent,
  reviewCount,
  averageRating,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [openModules, setOpenModules] = useState<number[]>([]);

  const learnings = useMemo(
    () => splitBullets(course.objectives || course.description),
    [course.description, course.objectives]
  );

  const curriculum = useMemo(
    () =>
      lessonsWithContent.map((item, index) => ({
        title: item.lesson.title,
        lessons: item.content?.data?.length || 1,
        duration:
          item.content?.data?.reduce(
            (total, content) => total + (content.file_size_display ? 1 : 0),
            0
          ) || `${index + 1}`.padStart(2, '0'),
        description: item.lesson.description || course.description || '',
      })),
    [course.description, lessonsWithContent]
  );

  const toggle = (index: number) => {
    setOpenModules(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">

      {/* ABOUT */}
      <section>
        <h2 className="mb-2 text-base font-bold text-foreground sm:mb-3 sm:text-lg">
          About this course
        </h2>

        <div className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          <RichTextRenderer
            htmlString={
              course.description ||
              'This course is now driven by live API data.'
            }
            maxChars={expanded ? undefined : 260}
          />

          {course.description && (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {expanded ? 'Show less' : 'Show more'}
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section>
        <h2 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-lg">
          What you'll learn
        </h2>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {(learnings.length > 0
            ? learnings
            : ['Learn the key concepts in this course']
          ).map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm text-muted-foreground sm:text-base">
                <HTMLTextPreview htmlContent={item} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CURRICULUM */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            Course Curriculum
          </h2>

          <button
            type="button"
            onClick={() =>
              setOpenModules(
                openModules.length === curriculum.length
                  ? []
                  : curriculum.map((_, i) => i)
              )
            }
            className="text-xs font-medium text-primary transition-colors hover:text-primary/80 sm:text-sm"
          >
            {openModules.length === curriculum.length
              ? 'Collapse All'
              : 'Expand All'}
          </button>
        </div>

        <div className="overflow-hidden rounded-sm border border-border divide-y divide-border">
          {curriculum.map((mod, i) => (
            <div key={`${mod.title}-${i}`}>
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted sm:px-5 sm:py-4"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openModules.includes(i) ? 'rotate-180' : ''
                      }`}
                  />

                  <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                    {mod.title}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground sm:gap-5 sm:text-sm">
                  <span className="hidden xs:block">
                    {mod.lessons} Lessons
                  </span>
                  <span>{String(mod.duration)}h</span>

                  <Play className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
                </div>
              </button>
              {/* {openModules.includes(i) ? (
                <div className="border-t border-border bg-muted px-4 py-3 text-xs text-muted-foreground sm:px-6 sm:text-sm">
                  <p>
                    {mod.description || 'Lesson content is available in the live workspace.'}
                  </p>
                </div>
              ) : null} */}
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground sm:gap-6 sm:text-sm">
          <span>
            <strong className="text-foreground">Total Lessons:</strong>{' '}
            {lessons.length}
          </span>
          <span>
            <strong className="text-foreground">Total Reviews:</strong>{' '}
            {reviewCount}
          </span>
          <span>
            <strong className="text-foreground">Average Rating:</strong>{' '}
            {averageRating || 'New'}
          </span>
        </div>
      </section>

      {/* INSTRUCTOR */}
      <section>
        <h2 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-lg">
          Meet your instructor
        </h2>

        <div className="flex flex-col items-start gap-4 rounded-md border border-border bg-muted/40 p-4 sm:flex-row sm:gap-6 sm:p-5">

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted sm:h-20 sm:w-20">
            <User2 className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground sm:text-base">
              {creatorName}
            </h3>

            <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
              {creatorHeadline}
            </p>

            <div className="mb-3 text-xs leading-relaxed text-muted-foreground sm:mb-4 sm:text-sm">
              <HTMLTextPreview htmlContent={creatorBio} />
            </div>

            <div className="flex flex-wrap gap-6 sm:gap-12">
              {[
                { val: `${lessons.length}`, label: 'Lessons' },
                { val: `${reviewCount}`, label: 'Reviews' },
                { val: `${course.class_limit ?? 0}`, label: 'Class limit' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-sm font-black text-foreground sm:text-base">
                    {stat.val}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}