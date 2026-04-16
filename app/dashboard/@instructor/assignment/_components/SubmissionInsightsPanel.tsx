import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Dot, Gauge, MessageSquareText, MoreHorizontal, Plus, Sparkles, SquarePen } from 'lucide-react';
import type { SubmissionStudent } from './assignment-types';

type SubmissionInsightsPanelProps = {
  showFooterAction?: boolean;
  student: SubmissionStudent;
};

export function SubmissionInsightsPanel({
  student,
  showFooterAction = true,
}: SubmissionInsightsPanelProps) {
  const summaryMetrics = [
    { label: 'Research depth', score: 4, total: 5 },
    { label: 'Evidence quality', score: 5, total: 5 },
    { label: 'Argument structure', score: 4, total: 5 },
    { label: 'Submission readiness', score: 3, total: 5 },
  ];

  return (
    <aside className='flex h-full min-h-0 flex-col border-l bg-white'>
      <div className='border-b p-4'>
        <p className='text-lg font-semibold'>Score: {student.score}/25</p>
        <p className='text-muted-foreground text-sm'>{student.name}</p>
      </div>

      <div className='min-h-0 flex-1 overflow-auto p-4'>
        <div className='space-y-4'>
          <div className='rounded-xl border bg-background/80 p-4'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-2xl font-semibold'>
                {student.score} <span className='text-muted-foreground text-xl'>/ 25</span>
              </p>
              <Badge className='rounded-full bg-warning/15 px-3 text-foreground hover:bg-warning/15'>
                <Dot className='text-warning mr-1 h-4 w-4 fill-current' />
                {student.insightLabel}
              </Badge>
            </div>
          </div>

          <div className='rounded-xl border bg-background/80'>
            <div className='border-b px-4 py-3'>
              <p className='font-medium'>Assessment Rubric</p>
            </div>
            <div className='divide-y'>
              {summaryMetrics.map(metric => (
                <div key={metric.label} className='flex items-center justify-between gap-3 px-4 py-3 text-sm'>
                  <p className='text-muted-foreground'>{metric.label}</p>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold'>
                      {metric.score} / {metric.total}
                    </span>
                    <CheckCircle2 className='text-success h-4 w-4' />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='rounded-xl border bg-background/80'>
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <p className='font-medium'>Performance Insights</p>
              <Gauge className='text-primary h-4 w-4' />
            </div>
            <div className='space-y-3 p-4 text-sm'>
              <div className='rounded-lg bg-muted/60 p-3'>
                <p className='font-medium'>Submission confidence</p>
                <p className='text-muted-foreground mt-1'>Competent with room to tighten citations.</p>
              </div>
              <div className='rounded-lg bg-muted/60 p-3'>
                <p className='font-medium'>Readability</p>
                <p className='text-muted-foreground mt-1'>Clear flow and strong formatting throughout.</p>
              </div>
            </div>
          </div>

          <div className='rounded-xl border bg-background/80'>
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <p className='font-medium'>AI Suggestions</p>
              <Badge variant='outline' className='rounded-full'>
                Present
              </Badge>
            </div>
            <div className='space-y-3 p-4'>
              {student.comments.map(comment => (
                <div key={comment} className='flex gap-2 text-sm'>
                  <Sparkles className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                  <p>{comment}</p>
                </div>
              ))}
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
