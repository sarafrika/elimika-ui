import { ClipboardList } from 'lucide-react';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import type { CourseAssessment, CourseBlockAsyncProps } from '../types';

export interface AssessmentTabProps extends CourseBlockAsyncProps {
  assessments?: readonly CourseAssessment[];
}

/** The grading structure saved in the course builder, presented read-only. */
export function AssessmentTab({ assessments, loading, error, onRetry }: AssessmentTabProps) {
  const rows = assessments ?? [];

  return (
    <Card className='py-6 sapce-y-4'>
      <CardHeader>
        <CardTitle>
          <h2>How this course is graded</h2>
        </CardTitle>
        <CardDescription>
          Each assessment contributes the percentage shown to your final course grade. Required
          assessments must be completed to finish the course.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AsyncSection
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={rows.length === 0}
          errorTitle='Couldn’t load the assessment structure'
          skeleton={
            <div className='space-y-4' aria-label='Loading assessment structure'>
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          }
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title='No assessment structure yet'
              description='The course creator has not added grading components for this course yet.'
              variant='plain'
            />
          }
        >
          <ul className='divide-border divide-y'>
            {rows.map((assessment, index) => (
              <li key={assessment.uuid ?? index} className='py-5 first:pt-0 last:pb-0'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0 space-y-2'>
                    <div className='flex flex-row gap-4 items-center flex-wrap' >
                      <h3 className='text-foreground font-semibold break-words'>
                        {assessment.title || assessment.assessment_type || 'Assessment'}
                      </h3>
                      <div className='flex flex-wrap gap-2'>
                        {assessment.assessment_type && (
                          <Badge variant='secondary'>{assessment.assessment_type}</Badge>
                        )}
                        {assessment.is_required != null && (
                          <Badge variant='outline'>
                            {assessment.is_required ? 'Required' : 'Not required'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {assessment.description && (
                      <p className='text-muted-foreground text-sm break-words whitespace-pre-wrap'>
                        {assessment.description}
                      </p>
                    )}
                  </div>
                  <div className='shrink-0 sm:text-right'>
                    <p className='text-primary text-2xl font-semibold tabular-nums'>
                      {assessment.weight_percentage != null
                        ? `${assessment.weight_percentage}%`
                        : 'Not specified'}
                    </p>
                    <p className='text-muted-foreground text-xs'>of final grade</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </AsyncSection>
      </CardContent>
    </Card>
  );
}
