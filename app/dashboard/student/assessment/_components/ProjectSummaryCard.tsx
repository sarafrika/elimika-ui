import { CalendarCheck, FileText, MoreHorizontal, Star, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AssessmentItem } from './assessment-data';

type ProjectSummaryCardProps = {
  assessment: AssessmentItem;
  isSelected?: boolean;
  onSelect?: () => void;
};

function getStatusClassName(status: AssessmentItem['status']) {
  if (status === 'graded') return 'bg-success/15 text-success hover:bg-success/15';
  if (status === 'revision-requested') {
    return 'bg-destructive/15 text-destructive hover:bg-destructive/15';
  }
  if (status === 'pending-review')
    return 'bg-warning/20 text-warning-foreground hover:bg-warning/20';
  return 'bg-primary/15 text-primary hover:bg-primary/15';
}

export function ProjectSummaryCard({
  assessment,
  isSelected = false,
  onSelect,
}: ProjectSummaryCardProps) {
  const hasScore = assessment.score !== null;
  const scoreLabel = hasScore
    ? `${assessment.score} / ${assessment.totalScore}`
    : `--- / ${assessment.totalScore}`;

  return (
    <section
      className={cn(
        'border-border bg-card rounded-md border shadow-xs transition',
        onSelect && 'hover:border-primary/50 cursor-pointer hover:shadow-sm',
        isSelected && 'border-primary/70 ring-primary/15 ring-2'
      )}
      onKeyDown={event => {
        if (!onSelect) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className='border-border flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h3 className='text-foreground text-xl font-semibold'>{assessment.title}</h3>
          <p className='text-muted-foreground mt-2 text-sm'>
            Submitted by {assessment.learnerName} on {assessment.submittedAt}
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Badge className={cn('px-3 py-1', getStatusClassName(assessment.status))}>
            {assessment.statusLabel}
          </Badge>
          <MoreHorizontal className='text-warning size-5' />
        </div>
      </div>

      <div className='border-border grid gap-4 border-b p-4 sm:p-5 lg:grid-cols-[1.2fr_auto] lg:items-center'>
        <div className='space-y-3'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Star className='text-warning size-4' />
            <span>{assessment.highlight}</span>
          </div>
        </div>

        <Button
          className='w-full lg:w-auto'
          onClick={event => event.stopPropagation()}
          type='button'
          variant='outline'
        >
          <UploadCloud className='size-4' />
          {hasScore ? 'View Review' : 'Update Review'}
        </Button>
      </div>

      <div className='divide-border grid gap-0 divide-y p-0 lg:grid-cols-2 lg:divide-x lg:divide-y-0 xl:grid-cols-[auto_1fr_1.4fr]'>
        <div className='flex min-h-16 items-center gap-3 px-4 py-3 sm:px-5'>
          <Badge className={cn('rounded-sm px-3', getStatusClassName(assessment.status))}>
            {assessment.statusLabel}
          </Badge>
        </div>

        <div className='min-w-0 px-4 py-3 sm:px-5'>
          <p className='text-muted-foreground text-sm'>Uploaded File</p>

          <div className='text-foreground mt-2 flex min-w-0 items-center gap-2 text-sm font-semibold'>
            <FileText className='text-primary size-4 shrink-0' />
            <span className='truncate'>{assessment.fileName}</span>
            <span className='text-muted-foreground shrink-0 font-normal'>
              {assessment.fileSize}
            </span>
          </div>
        </div>

        <div className='flex flex-col gap-3 px-4 py-3 sm:px-5 xl:items-start xl:gap-6 2xl:flex-row'>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-sm'>Uploaded Summary:</p>

            <div className='text-muted-foreground mt-2 flex min-w-0 items-start gap-2 text-sm'>
              <CalendarCheck className='text-success mt-0.5 size-4 shrink-0' />

              <span className='break-words'>
                Updated on {assessment.summaryUpdatedAt}
                <br />
                File {assessment.fileName}
              </span>
            </div>
          </div>

          <Button
            className='w-full shrink-0 sm:w-auto'
            onClick={event => event.stopPropagation()}
            type='button'
          >
            {hasScore ? 'View Submission' : 'Update Submission'}
          </Button>
        </div>
      </div>

      <footer className='flex flex-wrap items-center gap-6 px-4 py-3 text-sm sm:px-5'>
        <span className='text-foreground font-medium'>Total Score: {scoreLabel}</span>
        <button
          className='text-primary hover:text-primary/80 focus-visible:ring-ring font-semibold transition focus-visible:ring-2 focus-visible:outline-none'
          onClick={event => event.stopPropagation()}
          type='button'
        >
          View Detailed Rubric
        </button>
      </footer>
    </section>
  );
}
