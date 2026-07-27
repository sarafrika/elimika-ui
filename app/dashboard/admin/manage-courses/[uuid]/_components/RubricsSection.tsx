'use client';

import { CheckCircle2, Clock, Scale } from 'lucide-react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseRubrics } from '@/hooks/use-course-rubric';
import type { CourseRubricAssociation } from '@/services/client';
import { SectionCard } from '../../../_components/ui/SectionCard';
import { StatusBadge } from '../../../_components/ui/StatusBadge';

type CourseRubricWithDetails = CourseRubricAssociation & {
  rubric: {
    title?: string;
    description?: string;
    duration_display?: string;
    total_weight?: number;
    min_passing_score?: number;
    is_published?: boolean;
    status?: string;
  } | null;
};

export function RubricsSection({ courseUuid }: { courseUuid: string }) {
  const { data, isLoading } = useCourseRubrics(courseUuid);
  const rubrics = (data ?? []) as CourseRubricWithDetails[];

  return (
    <SectionCard title='Grading rubrics' description='Rubrics attached to this course for scoring.'>
      {isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className='h-14 w-full rounded-md' />
          ))}
        </div>
      ) : rubrics.length === 0 ? (
        <p className='rounded-md border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground'>
          No rubrics attached to this course.
        </p>
      ) : (
        <div className='space-y-3'>
          {rubrics.map(association => (
            <div
              key={association.uuid}
              className='rounded-md border border-border/60 bg-muted/20 px-4 py-3'
            >
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <h3 className='text-sm font-semibold text-foreground'>
                  {association.rubric?.title ?? 'Untitled rubric'}
                </h3>
                <StatusBadge
                  tone={association.rubric?.is_published ? 'success' : 'warning'}
                  label={association.rubric?.is_published ? 'Published' : 'Not published'}
                />
              </div>
              {association.rubric?.description ? (
                <div className='mt-1 text-sm text-muted-foreground'>
                  <RichTextRenderer htmlString={association.rubric.description} />
                </div>
              ) : null}
              <div className='mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground'>
                {association.rubric?.duration_display ? (
                  <span className='inline-flex items-center gap-1'>
                    <Clock className='size-3.5' />
                    {association.rubric.duration_display}
                  </span>
                ) : null}
                {association.rubric?.total_weight != null ? (
                  <span className='inline-flex items-center gap-1'>
                    <Scale className='size-3.5' />
                    Weight: {association.rubric.total_weight}%
                  </span>
                ) : null}
                {association.rubric?.min_passing_score != null ? (
                  <span className='inline-flex items-center gap-1'>
                    <CheckCircle2 className='size-3.5' />
                    Passing score: {association.rubric.min_passing_score}%
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
