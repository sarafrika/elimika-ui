import { ChevronDown, MessageSquareText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rubricRows, type AssessmentItem } from './assessment-data';

function RatingStars({ value }: { value: number }) {
  return (
    <div className='flex items-center gap-1' aria-label={`${value} out of 4`}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Star
          className={
            index < value ? 'fill-warning text-warning size-3.5' : 'fill-muted text-muted size-3.5'
          }
          key={`${value}-${index}`}
        />
      ))}
    </div>
  );
}

function InstructorAvatar({ className = 'size-10' }: { className?: string }) {
  return (
    <div
      aria-hidden='true'
      className={`${className} bg-primary/15 relative shrink-0 overflow-hidden rounded-full`}
    >
      <div className='bg-primary/45 absolute top-2 left-1/2 size-4 -translate-x-1/2 rounded-full' />
      <div className='bg-primary/25 absolute inset-x-1 bottom-0 h-5 rounded-t-full' />
    </div>
  );
}

export function RubricTracker({ assessment }: { assessment: AssessmentItem }) {
  const hasScore = assessment.score !== null;
  const scoreLabel = hasScore
    ? `${assessment.score} / ${assessment.totalScore}`
    : `--- / ${assessment.totalScore}`;

  return (
    <section className='border-border bg-card rounded-md border p-4 shadow-xs sm:p-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h3 className='text-foreground text-xl font-semibold'>Rubric Tracker</h3>
          <p className='text-foreground mt-2 text-sm font-medium'>
            {assessment.title} Rubric: Evaluation Criteria
          </p>
        </div>
        <button
          className='border-border bg-card text-foreground hover:bg-accent focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium shadow-xs transition focus-visible:ring-2 focus-visible:outline-none'
          type='button'
        >
          Competency Progress
          <ChevronDown className='size-4' />
        </button>
      </div>

      <div className='border-border mt-4 overflow-x-auto rounded-md border'>
        <div className='grid min-w-[660px] grid-cols-[1.4fr_repeat(3,1fr)_1.9fr]'>
          <div className='border-border bg-background border-b p-3' />
          {['Developing', 'Proficient', 'Advanced'].map(label => (
            <div
              className='border-border bg-primary/5 text-primary border-b border-l p-3 text-sm font-semibold'
              key={label}
            >
              {label}
            </div>
          ))}
          <div className='border-border bg-background border-b border-l p-3 text-right'>
            <span className='bg-warning/20 text-warning-foreground rounded-md px-3 py-1 text-sm font-medium'>
              {assessment.statusLabel}
            </span>
          </div>

          {rubricRows.map(row => (
            <div className='contents' key={row.criteria}>
              <div className='border-border text-foreground border-b p-3 text-sm font-semibold'>
                {row.criteria}
              </div>
              <div className='border-border bg-primary/5 border-b border-l p-3'>
                <RatingStars value={row.developing} />
              </div>
              <div className='border-border border-b border-l p-3'>
                <RatingStars value={row.proficient} />
              </div>
              <div className='border-border border-b border-l p-3'>
                <RatingStars value={row.advanced} />
              </div>
              <div className='border-border border-b border-l p-3'>
                {row.note ? (
                  <div className='border-primary/20 bg-primary/5 text-foreground rounded-md border p-3 text-sm'>
                    <div className='flex gap-2'>
                      <MessageSquareText className='text-primary mt-0.5 size-4' />
                      <span>{row.note}</span>
                    </div>
                    <p className='text-muted-foreground mt-3 text-xs font-semibold'>
                      Sarah Johnson
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          <div className='text-foreground p-3 text-sm font-semibold'>Total Score: {scoreLabel}</div>
          <div className='border-border col-span-3 border-l p-3' />
          <div className='border-border border-l p-3'>
            <div className='border-border bg-background flex items-start gap-3 rounded-md border p-3'>
              <InstructorAvatar />
              <div>
                <p className='text-foreground font-semibold'>Sarah Johnson</p>
                <p className='text-muted-foreground text-sm'>Instructor feedback</p>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Great concept! Your design has potential, but there is room for improvement in
                  coding and responsive elements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Button className='justify-start sm:w-auto' type='button' variant='outline'>
          + Add Rubric Comments
        </Button>
        <Button className='sm:w-56' type='button'>
          {hasScore ? 'View Evaluation' : 'Submit Evaluation'}
        </Button>
      </footer>
    </section>
  );
}
