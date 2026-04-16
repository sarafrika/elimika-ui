import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle2, Files, Play, UserRound, X } from 'lucide-react';
import type { AssignmentCardData, SubmissionStudent } from './assignment-types';

type SubmissionWorkspaceProps = {
  assignment: AssignmentCardData;
  onCloseDetails: () => void;
  student: SubmissionStudent;
};

export function SubmissionWorkspace({
  assignment,
  onCloseDetails,
  student,
}: SubmissionWorkspaceProps) {
  return (
    <section className='flex h-full min-h-0 flex-col overflow-hidden bg-[color-mix(in_oklch,var(--el-brand-50)_35%,var(--background))]'>
      <div className='shrink-0 border-b bg-white px-4 py-4'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
          <div className='space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-xl font-semibold'>{student.name}</h2>
              <Badge variant='outline' className='rounded-full'>
                <UserRound className='mr-1 h-3.5 w-3.5' />
                {student.attendanceLabel}
              </Badge>
            </div>
            <p className='text-muted-foreground text-sm'>
              {assignment.lesson} · {assignment.subtitle} · Due {assignment.dueLabel.replace('Due ', '')}
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Badge variant='outline' className='h-10 rounded-lg px-4 text-sm'>
              Score {student.score} / 25
            </Badge>
            <Button variant='outline' onClick={onCloseDetails} className='h-10 rounded-lg'>
              <X className='mr-2 h-4 w-4' />
              Close Details
            </Button>
          </div>
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto p-4 md:p-5'>
        <div className='mx-auto max-w-5xl space-y-4 pb-6'>
          <article className='border-border/60 rounded-2xl border bg-white shadow-sm'>
            <div className='space-y-4 p-4'>
              <div className='rounded-xl border bg-background p-4'>
                <div className='mb-3 flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <Files className='text-primary h-4 w-4' />
                    <p className='font-semibold'>{assignment.subtitle}.pdf</p>
                  </div>
                  <Play className='text-muted-foreground h-4 w-4' />
                </div>

                <div className='space-y-3'>
                  <div className='relative h-24 overflow-hidden rounded-xl bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_7%,transparent),transparent)] px-4 py-3'>
                    <div className='absolute inset-x-4 top-1/2 h-10 -translate-y-1/2 rounded-full bg-[repeating-linear-gradient(90deg,color-mix(in_oklch,var(--primary)_22%,transparent)_0_2px,transparent_2px_6px)] opacity-55' />
                    <div className='absolute left-[58%] top-3 h-16 w-10 rounded-full bg-warning/40 blur-md' />
                    <div className='absolute right-3 top-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium'>
                      Page 3
                    </div>
                  </div>
                  <div className='rounded-lg border px-4 py-3 text-sm text-muted-foreground'>
                    {student.comments[0]}
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-xl font-semibold'>Baseline Diagnostic Assessment Rubric</h3>
              </div>

              <section className='rounded-xl border bg-background'>
                {student.sections.map(section => (
                  <div key={section.title} className='border-b px-4 py-4 last:border-b-0'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h4 className='text-lg font-semibold'>{section.title}</h4>
                        {section.weight ? (
                          <span className='text-muted-foreground text-sm'>({section.weight})</span>
                        ) : null}
                      </div>
                      <p className='text-primary text-lg font-semibold'>
                        {section.gradeLabel} ({section.gradeScore})
                      </p>
                    </div>

                    <div className='mt-4 space-y-4'>
                      {section.metrics.map((metric, index) => (
                        <div key={`${section.title}-${metric.label}-${index}`} className='space-y-2'>
                          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                            <p className='text-base'>{metric.label}</p>
                            <div className='flex items-center gap-2 text-lg font-semibold'>
                              <span>
                                {metric.score} / {metric.total}
                              </span>
                              <CheckCircle2 className='text-success h-4 w-4' />
                            </div>
                          </div>
                          <Progress
                            value={(metric.score / metric.total) * 100}
                            className='h-2.5 bg-primary/10'
                            indicatorClassName={cn(
                              index === 0 && 'bg-primary',
                              index === 1 && 'bg-sky-400',
                              index === 2 && 'bg-indigo-300'
                            )}
                          />
                          {metric.note ? (
                            <p className='text-muted-foreground text-xs'>{metric.note}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <Button className='h-11 rounded-lg'>Save Grade</Button>
                <Button variant='outline' className='h-11 rounded-lg'>
                  Submit Feedback
                </Button>
                <Button className='bg-warning text-warning-foreground hover:bg-warning/90 h-11 rounded-lg'>
                  Next Student
                </Button>
                <Button variant='secondary' onClick={onCloseDetails} className='h-11 rounded-lg'>
                  Return to List
                </Button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
