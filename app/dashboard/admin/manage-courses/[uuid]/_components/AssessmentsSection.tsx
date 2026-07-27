'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, CheckCircle2, Scale } from 'lucide-react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseAssessment } from '@/services/client';
import { getCourseAssessmentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { SectionCard } from '../../../_components/ui/SectionCard';

export function AssessmentsSection({ courseUuid }: { courseUuid: string }) {
  const { data, isLoading } = useQuery({
    ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    enabled: !!courseUuid,
  });
  const assessments: CourseAssessment[] = data?.data?.content ?? [];

  return (
    <SectionCard
      title='Assessments'
      description='How learners are evaluated in this course.'
    >
      {isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className='h-14 w-full rounded-md' />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <p className='rounded-md border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground'>
          No assessments defined for this course.
        </p>
      ) : (
        <div className='space-y-3'>
          {assessments.map(assessment => (
            <div
              key={assessment.uuid}
              className='rounded-md border border-border/60 bg-muted/20 px-4 py-3'
            >
              <div className='flex items-center gap-2'>
                <BookOpenCheck className='size-4 text-primary' />
                <h3 className='text-sm font-semibold text-foreground'>
                  {assessment.title ?? 'Untitled assessment'}
                </h3>
              </div>
              {assessment.description ? (
                <div className='mt-1 text-sm text-muted-foreground'>
                  <RichTextRenderer htmlString={assessment.description} />
                </div>
              ) : null}
              <div className='mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground'>
                {assessment.weight_percentage != null ? (
                  <span className='inline-flex items-center gap-1'>
                    <Scale className='size-3.5' />
                    Weight: {assessment.weight_display ?? `${assessment.weight_percentage}%`}
                  </span>
                ) : null}
                {assessment.is_required ? (
                  <span className='inline-flex items-center gap-1'>
                    <CheckCircle2 className='size-3.5' />
                    Required
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
