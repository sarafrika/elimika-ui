'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAssignmentSubmissionsQueryKey,
  getQuizAttemptsQueryKey,
  getStudentQuizReviewOptions,
  getStudentQuizReviewQueryKey,
  getSubmissionAttachmentsOptions,
  gradeQuizTextResponseMutation,
  gradeSubmissionMutation,
  searchAttemptsInfiniteOptions,
  searchAttemptsQueryKey,
  searchSubmissionsInfiniteOptions,
  searchSubmissionsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmission, QuizAttempt } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  isTaskGraded,
  isTaskSubmitted,
  isValidGrade,
  isWrittenQuestion,
  newestSubmissionsFirst,
  taskGradeLabel,
} from './grading';
import type { LessonGradingTask } from './LessonGradingPanel';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';

const AttachmentPreview = dynamic(
  () =>
    import('@/components/content-preview/AssignmentContentPreview').then(
      module => module.AssignmentContentPreview
    ),
  { loading: () => <WorkbookLoading /> }
);

type GradingProps = {
  task: LessonGradingTask;
  enrollmentId: string;
  onGraded: (grade: string) => void;
};

export function TaskGradingSheet({
  studentName,
  onClose,
  ...props
}: GradingProps & {
  studentName: string;
  onClose: () => void;
}) {
  return (
    <Sheet
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <SheetContent className='w-full sm:max-w-3xl'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle>
            {studentName} · {props.task.title}
          </SheetTitle>
          <SheetDescription>
            Review this student's work and save a score and feedback.
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto p-4'>
          {props.task.kind === 'assignment' ? (
            <AssignmentGrading {...props} />
          ) : (
            <QuizGrading {...props} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AssignmentGrading({ task, enrollmentId, onGraded }: GradingProps) {
  const [selectedId, setSelectedId] = useState('');
  const options = {
    query: {
      searchParams: { assignmentUuid: task.uuid, enrollmentUuid: enrollmentId },
      pageable: { size: WORKBOOK_PAGE_SIZE },
    },
  };
  const query = useInfiniteQuery({
    ...searchSubmissionsInfiniteOptions(options),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(task.uuid && enrollmentId),
    staleTime: STALE_TIMES.live,
  });
  const submissions = useMemo(
    () =>
      newestSubmissionsFirst(
        query.data?.pages
          .flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? [])))
          .filter(
            item =>
              item.assignment_uuid === task.uuid &&
              item.enrollment_uuid === enrollmentId &&
              item.uuid
          ) ?? []
      ),
    [query.data, task.uuid, enrollmentId]
  );
  const submission = submissions.find(item => item.uuid === selectedId) ?? submissions[0];
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || query.data?.pages.some(hasApiError))
    return <WorkbookError title='Unable to load submissions' retry={() => void query.refetch()} />;
  return (
    <div className='space-y-5'>
      {submissions.length > 0 ? (
        <>
          <div className='flex flex-row items-center justify-between'>
            <div className='flex flex-col gap-2' >
              <Label>Submission</Label>
              <Select value={submission?.uuid} onValueChange={setSelectedId}>
                <SelectTrigger aria-label='Choose submission'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {submissions.map(item => (
                    <SelectItem key={item.uuid} value={item.uuid!}>
                      {formatDateTime(item.submitted_at)} · {item.status.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Badge variant='secondary'>
              {submission?.submission_status_display || submission?.status.replaceAll('_', ' ')}
            </Badge>
          </div>

          {submission?.uuid && (
            <AssignmentSubmissionGrade
              key={submission.uuid}
              task={task}
              submission={submission}
              onGraded={onGraded}
            />
          )}
        </>
      ) : (
        <EmptyState
          title='No submission yet'
          description='This task is assigned to the student. Grading becomes available after they submit their work.'
        />
      )}

      {query.hasNextPage && (
        <Button
          variant='outline'
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Load more submissions
        </Button>
      )}
    </div>
  );
}

function AssignmentSubmissionGrade({
  task,
  submission,
  onGraded,
}: {
  task: LessonGradingTask;
  submission: AssignmentSubmission;
  onGraded: (grade: string) => void;
}) {
  const client = useQueryClient();
  const mutation = useMutation(gradeSubmissionMutation());
  const maxScore = submission.max_score ?? task.maxPoints ?? 100;
  const isReadOnly = isTaskGraded(submission);

  return (
    <div className='space-y-12'>
      {submission.submission_text && (
        <section className='space-y-2'>
          <h3 className='font-semibold'>Student Response</h3>

          <div className='text-sm'>
            <RichTextRenderer htmlString={submission.submission_text} />
          </div>
        </section>
      )}

      {submission.uuid && (
        <SubmissionFiles
          assignmentId={task.uuid}
          submissionId={submission.uuid}
          fileUrls={submission.file_urls ?? []}
        />
      )}

      {isTaskSubmitted(submission) ? (
        <GradeForm
          key={`${submission.uuid}-${submission.updated_date}-${submission.score}`}
          maximum={maxScore}
          initialScore={submission.score}
          initialFeedback={submission.instructor_comments}
          isPending={mutation.isPending}
          isReadOnly={isReadOnly}
          onSave={async (score, feedback) => {
            if (
              !task.uuid ||
              !submission.uuid ||
              !isTaskSubmitted(submission) ||
              mutation.isPending
            )
              return;
            const response = await mutation.mutateAsync({
              path: { assignmentUuid: task.uuid, submissionUuid: submission.uuid },
              query: { score, maxScore, comments: feedback },
            });
            if (hasApiError(response)) throw new Error(response.message || 'Unable to save grade.');
            onGraded(
              response.data ? taskGradeLabel(response.data, maxScore) : `${score} / ${maxScore}`
            );
            toast.success('Assignment grade saved.');
            await Promise.all([
              client.invalidateQueries({
                queryKey: getAssignmentSubmissionsQueryKey({ path: { assignmentUuid: task.uuid } }),
              }),
              client.invalidateQueries({
                queryKey: searchSubmissionsQueryKey({
                  query: {
                    searchParams: {
                      assignmentUuid: task.uuid,
                      enrollmentUuid: submission.enrollment_uuid,
                    },
                    pageable: {},
                  },
                }),
              }),
            ]);
          }}
        />
      ) : (
        <EmptyState
          title='Awaiting submission'
          description='Draft and returned work must be submitted before it can be graded.'
        />
      )}
    </div>
  );
}

function SubmissionFiles({
  assignmentId,
  submissionId,
  fileUrls,
}: {
  assignmentId: string;
  submissionId: string;
  fileUrls: string[];
}) {
  const query = useQuery({
    ...getSubmissionAttachmentsOptions({
      path: { assignmentUuid: assignmentId, submissionUuid: submissionId },
    }),
    enabled: Boolean(assignmentId && submissionId),
    staleTime: STALE_TIMES.live,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return (
      <WorkbookError title='Unable to load submission files' retry={() => void query.refetch()} />
    );
  return (
    <section className='space-y-3'>
      <h3 className='font-semibold'>Submission files</h3>
      {query.data?.data?.length ? (
        <AttachmentPreview attachments={query.data.data} />
      ) : fileUrls.length ? (
        fileUrls.map((url, index) => {
          const href = toAuthenticatedMediaUrl(url);
          return href ? (
            <Button asChild variant='outline' key={url}>
              <a href={href} target='_blank' rel='noopener noreferrer'>
                Open file {index + 1}
              </a>
            </Button>
          ) : null;
        })
      ) : (
        <p className='text-muted-foreground text-sm'>No files attached.</p>
      )}
    </section>
  );
}

function QuizGrading({ task, enrollmentId, onGraded }: GradingProps) {
  const [selectedId, setSelectedId] = useState('');
  const query = useInfiniteQuery({
    ...searchAttemptsInfiniteOptions({
      query: {
        searchParams: { quizUuid: task.uuid, enrollmentUuid: enrollmentId },
        pageable: { size: WORKBOOK_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(task.uuid && enrollmentId),
    staleTime: STALE_TIMES.live,
  });
  const attempts = useMemo(
    () =>
      newestSubmissionsFirst(
        query.data?.pages
          .flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? [])))
          .filter(
            item =>
              item.quiz_uuid === task.uuid && item.enrollment_uuid === enrollmentId && item.uuid
          ) ?? []
      ),
    [query.data, task.uuid, enrollmentId]
  );
  const attempt = attempts.find(item => item.uuid === selectedId) ?? attempts[0];

  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || query.data?.pages.some(hasApiError))
    return (
      <WorkbookError title='Unable to load quiz attempts' retry={() => void query.refetch()} />
    );
  return (
    <div className='space-y-5'>
      {attempts.length ? (
        <>
          <Label>Quiz attempt</Label>
          <Select value={attempt?.uuid} onValueChange={setSelectedId}>
            <SelectTrigger aria-label='Choose quiz attempt'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {attempts.map(item => (
                <SelectItem key={item.uuid} value={item.uuid!}>
                  Attempt {item.attempt_number ?? '—'} · {item.status.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {attempt?.uuid &&
            (!isTaskSubmitted(attempt) ? (
              <EmptyState
                title='Quiz in progress'
                description='Grading becomes available once the student submits this attempt.'
              />
            ) : (
              <QuizAttemptGrade key={attempt.uuid} attempt={attempt} onGraded={onGraded} />
            ))}
        </>
      ) : (
        <EmptyState
          title='No quiz attempt yet'
          description='This quiz is assigned to the student. Their submitted answers will appear here for grading.'
        />
      )}
      {query.hasNextPage && (
        <Button
          variant='outline'
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Load more attempts
        </Button>
      )}
    </div>
  );
}

function QuizAttemptGrade({
  attempt,
  onGraded,
}: {
  attempt: QuizAttempt;
  onGraded: (grade: string) => void;
}) {
  const client = useQueryClient();
  const mutation = useMutation(gradeQuizTextResponseMutation());
  const isReadOnly = isTaskGraded(attempt);
  // Mounted only for an identified, submitted attempt.
  const options = {
    path: { quizUuid: attempt.quiz_uuid, attemptUuid: attempt.uuid! },
    query: { enrollment_uuid: attempt.enrollment_uuid },
  };
  const query = useQuery({
    ...getStudentQuizReviewOptions(options),
    enabled: Boolean(attempt.uuid && attempt.quiz_uuid && attempt.enrollment_uuid),
    staleTime: STALE_TIMES.live,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return (
      <WorkbookError title='Unable to load quiz responses' retry={() => void query.refetch()} />
    );
  const review = query.data?.data;
  if (!review?.questions?.length) return <EmptyState title='No quiz responses available' />;
  return (
    <div className='space-y-5'>
      <p className='text-muted-foreground text-sm'>
        Objective answers are graded automatically. Grade each written answer below.
      </p>
      <Badge variant='secondary'>
        {review.status ?? attempt.status} · {review.score ?? attempt.score ?? 0} /{' '}
        {review.max_score ?? attempt.max_score ?? 0}
      </Badge>
      {[...review.questions]
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((question, index) => {
          const written = isWrittenQuestion(question.question_type);
          const selectedOption = question.options?.find(
            option => option.uuid === question.response?.selected_option_uuid
          );
          return (
            <section key={question.uuid ?? index} className='space-y-3 rounded-lg border p-4'>
              <h3 className='font-semibold'>Question {index + 1}</h3>
              <RichTextRenderer htmlString={question.question_text ?? ''} />
              <div className='bg-muted rounded-md p-3 text-sm whitespace-pre-wrap'>
                {question.response?.text_response ||
                  selectedOption?.option_text ||
                  'No answer provided'}
              </div>
              {written && question.uuid ? (
                <GradeForm
                  key={`${question.uuid}-${question.response?.points_earned}`}
                  maximum={question.points ?? 0}
                  initialScore={question.response?.points_earned}
                  isPending={mutation.isPending}
                  isReadOnly={isReadOnly}
                  label={`Score for question ${index + 1}`}
                  onSave={async (points, feedback) => {
                    if (
                      !attempt.quiz_uuid ||
                      !attempt.uuid ||
                      !question.uuid ||
                      !isTaskSubmitted(attempt) ||
                      mutation.isPending
                    )
                      return;
                    const response = await mutation.mutateAsync({
                      path: {
                        quizUuid: attempt.quiz_uuid,
                        attemptUuid: attempt.uuid,
                        questionUuid: question.uuid,
                      },
                      body: { points, feedback: feedback || null },
                    });
                    if (hasApiError(response))
                      throw new Error(response.message || 'Unable to save grade.');
                    const updated = response.data;
                    onGraded(
                      updated?.status.toUpperCase() === 'GRADED'
                        ? taskGradeLabel(updated)
                        : 'Grading in progress'
                    );
                    toast.success('Quiz response grade saved.');
                    await Promise.all([
                      client.invalidateQueries({ queryKey: getStudentQuizReviewQueryKey(options) }),
                      client.invalidateQueries({
                        queryKey: getQuizAttemptsQueryKey({
                          path: { quizUuid: attempt.quiz_uuid },
                          query: { pageable: {} },
                        }),
                      }),
                      client.invalidateQueries({
                        queryKey: searchAttemptsQueryKey({
                          query: {
                            searchParams: {
                              quizUuid: attempt.quiz_uuid,
                              enrollmentUuid: attempt.enrollment_uuid,
                            },
                            pageable: {},
                          },
                        }),
                      }),
                    ]);
                  }}
                />
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Auto-graded: {question.response?.points_earned ?? 0} / {question.points ?? 0}
                </p>
              )}
            </section>
          );
        })}
    </div>
  );
}

function GradeForm({
  maximum,
  initialScore,
  initialFeedback,
  isPending,
  isReadOnly = false,
  label = 'Score',
  onSave,
}: {
  maximum: number;
  initialScore?: number;
  initialFeedback?: string;
  isPending: boolean;
  isReadOnly?: boolean;
  label?: string;
  onSave: (score: number, feedback: string) => Promise<void>;
}) {
  const [score, setScore] = useState(
    initialScore == null ? '' : String(initialScore)
  );
  const [feedback, setFeedback] = useState(initialFeedback ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pending = saving || isPending;
  const readOnly = isReadOnly || pending;

  return (
    <form
      className='w-full space-y-3'
      onSubmit={async event => {
        event.preventDefault();

        if (readOnly) return;

        setError('');

        if (!isValidGrade(score, maximum)) {
          setError(`Enter a score between 0 and ${maximum}.`);
          return;
        }

        setSaving(true);

        try {
          await onSave(Number(score), feedback);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to save grade. Please try again.'
          );
        } finally {
          setSaving(false);
        }
      }}
    >
      <label className='block space-y-1'>
        <span className='text-sm font-medium'>
          {label} (out of {maximum})
        </span>

        <Input
          aria-label={label}
          type='number'
          min={0}
          max={maximum}
          step='any'
          required
          disabled={readOnly}
          value={score}
          onChange={event => setScore(event.target.value)}
          className='max-w-40'
        />
      </label>

      <label className='block space-y-1'>
        <span className='text-sm font-medium'>Feedback</span>

        <Textarea
          value={feedback}
          disabled={readOnly}
          onChange={event => setFeedback(event.target.value)}
          placeholder='Feedback for this student (optional)'
        />
      </label>

      {error && (
        <p role='alert' className='text-destructive text-sm'>
          {error}
        </p>
      )}

      <div className='flex justify-end'>
        <Button
          type='submit'
          disabled={
            readOnly || !isValidGrade(score, maximum)
          }
        >
          {pending && <Spinner />}
          Save grade
        </Button>
      </div>
    </form>
  );
}
