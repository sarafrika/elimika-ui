import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AssignmentSubmission, QuizAttempt, RubricMatrix } from '@/services/client/types.gen';
import { ExternalLink, Files, UserRound, X } from 'lucide-react';
import type { AssignmentCardData, SubmissionStudent } from './assignment-types';

type SubmissionWorkspaceProps = {
  assignment: AssignmentCardData;
  comments: string;
  isSavingGrade: boolean;
  onCloseDetails: () => void;
  onCommentsChange: (value: string) => void;
  onGradeSubmission: () => void;
  onScoreChange: (value: string) => void;
  quizAttempt: QuizAttempt | null;
  rubricMatrix: RubricMatrix | null;
  score: string;
  student?: SubmissionStudent;
  submission: AssignmentSubmission | null;
  taskType: 'assignment' | 'quiz';
};

export function SubmissionWorkspace({
  assignment,
  comments,
  isSavingGrade,
  onCloseDetails,
  onCommentsChange,
  onGradeSubmission,
  onScoreChange,
  quizAttempt,
  rubricMatrix,
  score,
  student,
  submission,
  taskType,
}: SubmissionWorkspaceProps) {
  const maxScore = submission?.max_score ?? quizAttempt?.max_score ?? 100;
  const currentScore = submission?.score ?? quizAttempt?.score ?? student?.score ?? 0;
  const displayScore = score || `${currentScore}`;

  return (
    <section className='flex h-full min-h-0 flex-col overflow-hidden bg-[color-mix(in_oklch,var(--el-brand-50)_35%,var(--background))]'>
      <div className='shrink-0 border-b bg-white px-4 py-4'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
          <div className='space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-xl font-semibold'>{student?.name || 'Select a student'}</h2>
              {student ? (
                <Badge variant='outline' className='rounded-full'>
                  <UserRound className='mr-1 h-3.5 w-3.5' />
                  {student.attendanceLabel}
                </Badge>
              ) : null}
            </div>
            <p className='text-muted-foreground text-sm'>
              {assignment.lesson} · {assignment.subtitle} · {assignment.dueLabel}
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Badge variant='outline' className='h-10 rounded-lg px-4 text-sm'>
              Score {displayScore} / {maxScore}
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
                    <p className='font-semibold'>
                      {taskType === 'assignment'
                        ? student?.submissionKind || 'submission'
                        : 'quiz attempt'}
                    </p>
                  </div>
                </div>

                {submission?.submission_text ? (
                  <div className='rounded-lg border px-4 py-3 text-sm text-muted-foreground'>
                    {submission.submission_text}
                  </div>
                ) : null}

                {submission?.file_urls?.length ? (
                  <div className='space-y-2'>
                    {submission.file_urls.map(fileUrl => (
                      <a
                        key={fileUrl}
                        href={fileUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='flex items-center justify-between rounded-lg border px-4 py-3 text-sm text-primary'
                      >
                        <span className='truncate'>{fileUrl.split('/').pop() || fileUrl}</span>
                        <ExternalLink className='h-4 w-4 shrink-0' />
                      </a>
                    ))}
                  </div>
                ) : null}

                {quizAttempt ? (
                  <div className='grid gap-3 rounded-lg border px-4 py-3 text-sm text-muted-foreground sm:grid-cols-2'>
                    <p>Attempt {quizAttempt.attempt_number || 1}</p>
                    <p>{quizAttempt.grade_display || quizAttempt.status}</p>
                    <p>Score: {quizAttempt.score ?? 0}</p>
                    <p>Percentage: {quizAttempt.percentage ?? 0}%</p>
                  </div>
                ) : null}

                {!submission?.submission_text && !submission?.file_urls?.length && !quizAttempt ? (
                  <div className='rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground'>
                    No submission content was attached to this task.
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className='text-xl font-semibold'>{rubricMatrix?.rubric.title || 'Assessment Rubric'}</h3>
              </div>

              <section className='rounded-xl border bg-background'>
                {rubricMatrix ? (
                  rubricMatrix.criteria.map(criteria => (
                    <div key={criteria.uuid ?? criteria.component_name} className='border-b px-4 py-4 last:border-b-0'>
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div>
                          <h4 className='text-base font-semibold'>{criteria.component_name}</h4>
                          <p className='text-muted-foreground text-sm'>
                            {criteria.description || criteria.weight_suggestion || 'Criterion'}
                          </p>
                        </div>
                        <p className='text-primary text-sm font-semibold'>
                          {rubricMatrix.scoring_levels.length} scoring levels
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='px-4 py-4 text-sm text-muted-foreground'>
                    No rubric matrix is attached to this task.
                  </div>
                )}
              </section>

              {taskType === 'assignment' ? (
                <div className='grid gap-4 rounded-xl border bg-background p-4'>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Score</label>
                      <Input
                        type='number'
                        min='0'
                        max={maxScore}
                        value={displayScore}
                        onChange={event => onScoreChange(event.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Max score</label>
                      <Input value={`${maxScore}`} readOnly />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Instructor comments</label>
                    <Textarea
                      value={comments}
                      onChange={event => onCommentsChange(event.target.value)}
                      placeholder='Add grading feedback'
                    />
                  </div>
                </div>
              ) : null}

              <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                {taskType === 'assignment' ? (
                  <Button className='h-11 rounded-lg' onClick={onGradeSubmission} disabled={isSavingGrade}>
                    {isSavingGrade ? 'Saving...' : 'Save Grade'}
                  </Button>
                ) : null}
                <Button variant='outline' onClick={onCloseDetails} className='h-11 rounded-lg'>
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
