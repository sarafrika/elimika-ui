import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AssignmentSubmission, AssignmentSubmissionAttachment, QuizAttempt, RubricMatrix } from '@/services/client/types.gen';
import { Files, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AttachmentResourceList } from '../../../../../components/assessment/AttachmentResourceList';
import { cn } from '../../../../../lib/utils';
import { toAttachmentResourceItems } from '../../../@student/_components/student-assignment-workspace';
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

  const [selectedLevels, setSelectedLevels] = useState<
    Record<string, string>
  >({});

  const assignment_maxScore = assignment?.max_point ?? 0;
  const quiz_maxScore = quizAttempt?.max_score ?? 0
  const maxScore = assignment_maxScore || quiz_maxScore

  const studentGradedScore = submission?.score

  const rubricScore = useMemo(() => {
    if (!rubricMatrix) return null;

    const earned = rubricMatrix.criteria.reduce((total, criterion) => {
      const selectedLevelUuid = selectedLevels[criterion.uuid];

      const level = rubricMatrix.scoring_levels.find(
        l => l.uuid === selectedLevelUuid
      );

      return total + (level?.points ?? 0);
    }, 0);

    return earned;
  }, [rubricMatrix, selectedLevels]);

  const scaledRubricScore = useMemo(() => {
    if (!rubricMatrix) return null;

    const earned = rubricMatrix.criteria.reduce((total, criterion) => {
      const selectedLevelUuid = selectedLevels[criterion.uuid];

      const level = rubricMatrix.scoring_levels.find(
        l => l.uuid === selectedLevelUuid
      );

      return total + (level?.points ?? 0);
    }, 0);

    const maxPointsPerCriterion = Math.max(
      ...rubricMatrix.scoring_levels.map(l => l.points)
    );

    const possible =
      rubricMatrix.criteria.length * maxPointsPerCriterion;

    if (possible === 0) return 0;

    return (earned / possible) * maxScore;
  }, [rubricMatrix, selectedLevels, maxScore]);


  const baseScore =
    submission?.score ??
    quizAttempt?.score ??
    student?.score ??
    0;

  const resolvedScore =
    scaledRubricScore !== null
      ? scaledRubricScore
      : baseScore;

  const displayScore =
    score ?? resolvedScore.toFixed(1);

  const rubricSummary = useMemo(() => {
    if (!rubricMatrix) {
      return {
        earned: 0,
        possible: 0,
        percentage: 0,
      };
    }

    const earned = rubricMatrix.criteria.reduce(
      (total, criterion) => {
        const selectedLevelUuid =
          selectedLevels[criterion.uuid as string];

        const level = rubricMatrix.scoring_levels.find(
          l => l.uuid === selectedLevelUuid
        );

        return total + (level?.points ?? 0);
      },
      0
    );

    const maxPointsPerCriterion = Math.max(
      ...rubricMatrix.scoring_levels.map(l => l.points)
    );

    const possible =
      rubricMatrix.criteria.length *
      maxPointsPerCriterion;

    const percentage =
      possible > 0 ? (earned / possible) * 100 : 0;

    return {
      earned,
      possible,
      percentage,
    };
  }, [rubricMatrix, selectedLevels]);

  useEffect(() => {
    if (scaledRubricScore !== null) {
      onScoreChange(String(Math.round(scaledRubricScore)));
    }
  }, [scaledRubricScore, onScoreChange]);

  return (
    <section className='flex h-full min-h-0 flex-col overflow-hidden bg-background'>
      <div className='shrink-0 border-b bg-background px-4 py-4'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
          <div className='space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-xl font-semibold'>{student?.name || 'Select a student'}</h2>
              {student ? (
                <Badge variant='outline' className='rounded-full'>
                  <UserRound className='mr-1 h-3.5 w-3.5' />
                  {student.submissionStatus}
                </Badge>
              ) : null}
            </div>
            <p className='text-muted-foreground text-sm'>
              {student?.submittedAt}
            </p>
            <p className='text-muted-foreground text-sm'>
              {assignment.lesson} · {assignment.subtitle} · {assignment.dueLabel}
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Badge variant="outline" className="h-10 rounded-lg px-4 text-sm">
              Score {studentGradedScore} / {maxScore}
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
          <article className='border-border/60 rounded-2xl border bg-background shadow-sm'>
            <div className='space-y-4 p-4'>
              <>
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

                  {student?.submissionText ? (
                    <div className='px-4 py-3 text-sm text-muted-foreground'>
                      {student.submissionText}
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

                  {!student?.submissionText && !student?.fileUrls?.length && !quizAttempt ? (
                    <div className='rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground'>
                      No submission content was attached to this task.
                    </div>
                  ) : null}
                </div>

                <AttachmentResourceList
                  attachments={toAttachmentResourceItems(
                    (submission?.attachments ??
                      []) as AssignmentSubmissionAttachment[]
                  )}
                  emptyMessage='No files were uploaded with the latest submission.'
                  previewLabel='Read file'
                />
              </>

              <div className='pt-6'>
                <h3 className='text-xl font-semibold'>{rubricMatrix?.rubric.title || 'Assessment Rubric'}</h3>
              </div>

              {!rubricMatrix ?
                <div className="p-3 rounded border bg-surface-muted border-border-muted text-text-muted text-sm font-medium">
                  No rubric assessment assigned to this assignment
                </div>
                : <section className="overflow-hidden rounded-lg border bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="min-w-[220px] px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                            Criterion
                          </th>

                          {rubricMatrix?.scoring_levels.map(level => (
                            <th
                              key={level.uuid}
                              className="min-w-[120px] px-2 py-2 text-center"
                            >
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold leading-none">
                                  {level.name}
                                </p>

                                <p className="text-primary text-sm font-bold leading-none">
                                  {level.points} pts
                                </p>

                                <p className="text-muted-foreground text-[10px] leading-tight">
                                  {level.performance_indicator}
                                </p>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {rubricMatrix?.criteria.map(criteria => (
                          <tr
                            key={criteria.uuid}
                            className="border-b last:border-b-0"
                          >
                            <td className="px-2 py-2 align-top">
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-tight">
                                  {criteria.component_name}
                                </p>

                                <p className="text-muted-foreground text-xs leading-snug">
                                  {criteria.description}
                                </p>
                              </div>
                            </td>

                            {rubricMatrix.scoring_levels.map(level => {
                              const selected =
                                selectedLevels[criteria.uuid as string] ===
                                level.uuid;

                              return (
                                <td
                                  key={level.uuid}
                                  className="px-2 py-2 text-center"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedLevels(prev => ({
                                        ...prev,
                                        [criteria.uuid]: level.uuid as string,
                                      }))
                                    }
                                    className={cn(
                                      "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-all",
                                      selected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                    )}
                                  >
                                    {selected ? "✓" : ""}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
                    <div>
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        Total Score
                      </p>

                      <p className="text-base font-semibold">
                        {rubricSummary.earned} / {rubricSummary.possible}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        Final Grade
                      </p>

                      <p className="text-primary text-xl font-bold">
                        {rubricSummary.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </section>}


              {taskType === 'assignment' ? (
                <div className='grid gap-4 rounded-xl border bg-background p-4'>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Score</label>
                      <Input
                        type="number"
                        min="0"
                        max={maxScore}
                        value={displayScore}
                        onChange={event => {
                          const value = Number(event.target.value);

                          const clamped = Math.min(Math.max(value, 0), maxScore);
                          onScoreChange(clamped);
                        }}
                        disabled={rubricScore !== null}
                      />
                      {rubricScore !== null ? (
                        <p className="text-xs text-muted-foreground">
                          Score is calculated from rubric selection
                        </p>
                      ) : null}
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

              <div className='flex flex-row items-center gap-4 justify-end'>
                {taskType === 'assignment' ? (
                  <Button className='h-11 rounded-lg disabled:bg-destructive/40' onClick={onGradeSubmission} disabled={isSavingGrade || studentGradedScore !== null}>
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
