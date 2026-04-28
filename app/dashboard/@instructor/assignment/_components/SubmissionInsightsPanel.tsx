import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RubricMatrix } from '@/services/client/types.gen';
import { CheckCircle2, Dot, Gauge, MessageSquareText, MoreHorizontal, Plus, Sparkles, SquarePen } from 'lucide-react';
import type { SubmissionStudent } from './assignment-types';

type SubmissionInsightsPanelProps = {
  rubricMatrix: RubricMatrix | null;
  showFooterAction?: boolean;
  student: SubmissionStudent;
  taskType: 'assignment' | 'quiz';
};

export function SubmissionInsightsPanel({
  rubricMatrix,
  student,
  taskType,
  showFooterAction = true,
}: SubmissionInsightsPanelProps) {
  const summaryMetrics = rubricMatrix?.criteria.slice(0, 4) ?? [];

  return (
    <aside className='flex h-full min-h-0 flex-col border-l bg-background'>
      <div className='border-b p-4'>
        <p className='text-lg font-semibold'>Score: {student.score}</p>
        <p className='text-muted-foreground text-sm'>{student.name}</p>
      </div>

      <div className='min-h-0 flex-1 overflow-auto p-4'>
        <div className='space-y-4'>
          <div className='rounded-xl border bg-background p-4'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-2xl font-semibold'>
                {student.score} <span className='text-muted-foreground text-xl'>points</span>
              </p>
              <Badge className='rounded-full bg-warning/15 px-3 text-foreground hover:bg-warning/15'>
                <Dot className='text-warning mr-1 h-4 w-4 fill-current' />
                {student.insightLabel}
              </Badge>
            </div>
          </div>

          <div className='rounded-xl border bg-background'>
            <div className='border-b px-4 py-3'>
              <p className='font-medium'>Assessment Rubric</p>
            </div>
            <div className='divide-y'>
              {summaryMetrics.length > 0 ? (
                summaryMetrics.map(metric => (
                  <div key={metric.uuid ?? metric.component_name} className='flex items-center justify-between gap-3 px-4 py-3 text-sm'>
                    <p className='text-muted-foreground'>{metric.component_name}</p>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold'>
                        {metric.criteria_number || 'Criterion'}
                      </span>
                      <CheckCircle2 className='text-success h-4 w-4' />
                    </div>
                  </div>
                ))
              ) : (
                <div className='px-4 py-3 text-sm text-muted-foreground'>
                  No rubric criteria available for this task.
                </div>
              )}
            </div>
          </div>

          <div className='rounded-xl border bg-background/80'>
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <p className='font-medium'>Performance Insights</p>
              <Gauge className='text-primary h-4 w-4' />
            </div>
            <div className='space-y-3 p-4 text-sm'>
              <div className='rounded-lg bg-muted/60 p-3'>
                <p className='font-medium'>Submission type</p>
                <p className='text-muted-foreground mt-1 capitalize'>
                  {student.submissionKind || taskType}
                </p>
              </div>
              <div className='rounded-lg bg-muted/60 p-3'>
                <p className='font-medium'>Status</p>
                <p className='text-muted-foreground mt-1'>
                  {student.submissionStatus || 'Awaiting review'}
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-xl border bg-background/80'>
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <p className='font-medium'>Instructor Notes</p>
              <Badge variant='outline' className='rounded-full'>
                {taskType}
              </Badge>
            </div>
            <div className='space-y-3 p-4'>
              {student.comments.length > 0 ? (
                student.comments.map(comment => (
                  <div key={comment} className='flex gap-2 text-sm'>
                    <Sparkles className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                    <p>{comment}</p>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No instructor comments have been added yet.
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-5 gap-2'>
            {[SquarePen, MessageSquareText, Plus, Gauge, MoreHorizontal].map((Icon, index) => (
              <button
                key={`panel-action-${index}`}
                type='button'
                className='text-muted-foreground hover:text-foreground flex h-10 items-center justify-center rounded-lg border bg-background/80 transition-colors'
              >
                <Icon className='h-4 w-4' />
              </button>
            ))}
          </div>
        </div>
      </div>

      {showFooterAction ? (
        <div className='border-t p-4'>
          <Button className='h-11 w-full rounded-lg'>Next Student</Button>
        </div>
      ) : null}
    </aside>
  );
}
