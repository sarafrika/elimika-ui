'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { cx, getEmptyStateClasses } from '@/lib/design-system';
import { STALE_TIMES } from '@/lib/query-client';
import { Student } from '@/services/api/schema';
import {
  getEnrollmentsForClassOptions,
  getQuizAttemptsOptions,
  getQuizAttemptsQueryKey,
  getQuizSchedulesOptions,
  getStudentQuizReviewOptions,
  getStudentQuizViewOptions,
  startQuizAttemptMutation,
  submitQuizAttemptMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassQuizSchedule,
  Enrollment,
  QuizAttempt,
  QuizResponseSubmission,
  StudentQuizQuestion,
} from '@/services/client/types.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  FileQuestion,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// ── Types & helpers ───────────────────────────────────────────────────────────

type ClassMeta = {
  classUuid: string;
  classTitle: string;
  courseTitle: string;
  enrollmentUuid?: string;
};

type StudentClassDefinitionRow = ReturnType<
  typeof useStudentClassDefinitions
>['classDefinitions'][number];

type ResolvedClassDetails = {
  class_definition?: { title?: string; uuid?: string };
  course_name?: string;
  name?: string;
  title?: string;
  uuid?: string;
};

/** Single answer per question: an option uuid (choice questions) or free text. */
type AnswerMap = Record<string, string>;

type QuizPhase = 'intro' | 'attempt' | 'result';

function getClassTitle(classDetails?: ResolvedClassDetails) {
  return (
    classDetails?.class_definition?.title ||
    classDetails?.title ||
    classDetails?.name ||
    'Untitled class'
  );
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'No deadline';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatEnum(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isTextQuestionType(questionType?: string) {
  const type = String(questionType || '').toUpperCase();
  return type === 'SHORT_ANSWER' || type === 'SHORT_TEXT' || type === 'ESSAY';
}

function scoreTier(percentage: number): 'pass' | 'borderline' | 'fail' {
  if (percentage >= 70) return 'pass';
  if (percentage >= 50) return 'borderline';
  return 'fail';
}

// ── Server-graded result card ─────────────────────────────────────────────────

function ResultCard({ attempt }: { attempt: QuizAttempt }) {
  const percentage = Math.round(Number(attempt.percentage ?? 0));
  const passed = attempt.is_passed;
  const pending = String(attempt.status || '').toLowerCase() === 'submitted';
  const tier = pending ? 'borderline' : passed ? 'pass' : scoreTier(percentage);

  const styles = {
    pass: {
      card: 'border-success/30 bg-success/5',
      badge: 'bg-success/15 text-success border-success/30',
      label: 'Passed',
    },
    borderline: {
      card: 'border-warning/30 bg-warning/5',
      badge: 'bg-warning/15 text-warning border-warning/30',
      label: pending ? 'Awaiting grading' : 'Almost there',
    },
    fail: {
      card: 'border-destructive/30 bg-destructive/5',
      badge: 'bg-destructive/10 text-destructive border-destructive/30',
      label: 'Needs improvement',
    },
  }[tier];

  return (
    <Card className={cx('border', styles.card)}>
      <CardContent className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <div className='bg-background/80 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border'>
            {pending ? (
              <Clock className='text-warning h-6 w-6' />
            ) : passed ? (
              <CheckCircle2 className='text-success h-6 w-6' />
            ) : (
              <XCircle className='text-destructive h-6 w-6' />
            )}
          </div>
          <div>
            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
              Your score
            </p>
            <p className='text-foreground text-3xl leading-none font-bold'>
              {attempt.score ?? 0}
              <span className='text-muted-foreground text-lg font-medium'>
                /{attempt.max_score ?? 0}
              </span>
            </p>
          </div>
        </div>
        <span
          className={cx(
            'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
            styles.badge
          )}
        >
          {pending ? styles.label : `${percentage}% · ${styles.label}`}
        </span>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StudentQuizSubmissionPage() {
  const params = useParams();
  const quizId = params?.id as string;
  const router = useRouter();
  const student = useStudent();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [attemptUuid, setAttemptUuid] = useState<string | undefined>();
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [resultAttempt, setResultAttempt] = useState<QuizAttempt | undefined>();
  const [showReview, setShowReview] = useState(false);

  // ── Resolve the student's enrollment for this quiz via their class schedules ──
  const { classDefinitions, loading: classDefinitionsLoading } = useStudentClassDefinitions(
    student as Student
  );

  const classItems = useMemo(
    () =>
      (classDefinitions ?? [])
        .map((classDefinition: StudentClassDefinitionRow) => {
          const classDetails = classDefinition.classDetails as ResolvedClassDetails | undefined;
          return {
            classTitle: getClassTitle(classDetails),
            classUuid:
              classDefinition.uuid || classDetails?.uuid || classDetails?.class_definition?.uuid,
            courseTitle:
              classDefinition.course?.name || classDetails?.course_name || 'Untitled course',
          };
        })
        .filter((item): item is { classTitle: string; classUuid: string; courseTitle: string } =>
          Boolean(item.classUuid)
        ),
    [classDefinitions]
  );

  const classEnrollmentQueries = useQueries({
    queries: classItems.map(classItem => ({
      ...getEnrollmentsForClassOptions({ path: { uuid: classItem.classUuid } }),
      enabled: !!classItem.classUuid,
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
  });

  const classMetaList = useMemo<ClassMeta[]>(
    () =>
      classItems.map((classItem, index) => {
        const enrollments = classEnrollmentQueries[index]?.data?.data ?? [];
        const matchingEnrollment =
          enrollments.find((e: Enrollment) => e.student_uuid === student?.uuid) ?? null;
        return { ...classItem, enrollmentUuid: matchingEnrollment?.uuid };
      }),
    [classEnrollmentQueries, classItems, student?.uuid]
  );

  const quizScheduleQueries = useQueries({
    queries: classMetaList.map(classMeta => ({
      ...getQuizSchedulesOptions({ path: { classUuid: classMeta.classUuid } }),
      enabled: !!classMeta.classUuid,
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
  });

  const matchingScheduleRow = useMemo(() => {
    for (let index = 0; index < classMetaList.length; index++) {
      const classMeta = classMetaList[index];
      if (!classMeta) continue;
      const schedules = quizScheduleQueries[index]?.data?.data ?? [];
      const schedule = schedules.find((s: ClassQuizSchedule) => s.quiz_uuid === quizId);
      if (schedule) return { classMeta, schedule };
    }
    return null;
  }, [classMetaList, quizScheduleQueries, quizId]);

  const enrollmentUuid = matchingScheduleRow?.classMeta.enrollmentUuid;
  const schedule = matchingScheduleRow?.schedule;

  // ── Secure student view (no answer key) + this student's attempts ────────────
  const studentQuizQuery = useQuery({
    ...getStudentQuizViewOptions({
      path: { quizUuid: quizId },
      query: { enrollment_uuid: enrollmentUuid as string },
    }),
    enabled: !!quizId && !!enrollmentUuid,
    staleTime: STALE_TIMES.entity,
  });
  const studentQuiz = studentQuizQuery.data?.data;

  const quizAttemptsQuery = useQuery({
    ...getQuizAttemptsOptions({ path: { quizUuid: quizId }, query: { pageable: {} } }),
    enabled: !!quizId,
    staleTime: STALE_TIMES.live,
  });

  const attempts = useMemo<QuizAttempt[]>(() => {
    const all = quizAttemptsQuery.data?.data?.content ?? [];
    return all
      .filter(a => !enrollmentUuid || a.enrollment_uuid === enrollmentUuid)
      .slice()
      .sort((l, r) => (r.attempt_number ?? 0) - (l.attempt_number ?? 0));
  }, [quizAttemptsQuery.data, enrollmentUuid]);

  const latestAttempt = attempts[0] ?? null;
  const inProgressAttempt = attempts.find(a => String(a.status).toLowerCase() === 'in_progress');
  const attemptsAllowed = schedule?.attempt_limit_override ?? studentQuiz?.attempts_allowed ?? null;
  const attemptsRemaining = attemptsAllowed == null || attempts.length < attemptsAllowed;

  const questions = useMemo<StudentQuizQuestion[]>(
    () =>
      (studentQuiz?.questions ?? [])
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [studentQuiz]
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const startMut = useMutation(startQuizAttemptMutation());
  const submitMut = useMutation(submitQuizAttemptMutation());

  // ── Graded review (only after the attempt is graded) ─────────────────────────
  const reviewEnabled =
    phase === 'result' &&
    showReview &&
    !!attemptUuid &&
    !!enrollmentUuid &&
    String(resultAttempt?.status || '').toLowerCase() === 'graded';

  const reviewQuery = useQuery({
    ...getStudentQuizReviewOptions({
      path: { quizUuid: quizId, attemptUuid: attemptUuid as string },
      query: { enrollment_uuid: enrollmentUuid as string },
    }),
    enabled: reviewEnabled,
    staleTime: STALE_TIMES.entity,
  });
  const review = reviewQuery.data?.data;

  const isPageLoading =
    classDefinitionsLoading ||
    classEnrollmentQueries.some(q => q.isLoading) ||
    quizScheduleQueries.some(q => q.isLoading) ||
    (!!enrollmentUuid && studentQuizQuery.isLoading) ||
    quizAttemptsQuery.isLoading;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const startAttempt = () => {
    if (!enrollmentUuid) {
      toast.error('We could not find your enrollment for this quiz.');
      return;
    }
    startMut.mutate(
      { path: { quizUuid: quizId }, query: { enrollment_uuid: enrollmentUuid } },
      {
        onSuccess: response => {
          setAttemptUuid(response.data?.uuid);
          setAnswers({});
          setResultAttempt(undefined);
          setShowReview(false);
          setPhase('attempt');
        },
        onError: () => toast.error('No remaining attempts are allowed for this quiz.'),
      }
    );
  };

  const submitAttempt = () => {
    if (!enrollmentUuid || !attemptUuid) return;
    const responses: QuizResponseSubmission[] = [];
    for (const question of questions) {
      const value = answers[question.uuid ?? ''];
      if (!question.uuid || value == null || value === '') continue;
      if (isTextQuestionType(question.question_type)) {
        responses.push({ question_uuid: question.uuid, text_response: value });
      } else {
        responses.push({ question_uuid: question.uuid, selected_option_uuid: value });
      }
    }

    submitMut.mutate(
      {
        path: { quizUuid: quizId, attemptUuid },
        query: { enrollment_uuid: enrollmentUuid },
        body: { responses },
      },
      {
        onSuccess: response => {
          setResultAttempt(response.data);
          setShowReview(false);
          setPhase('result');
          queryClient.invalidateQueries({
            queryKey: getQuizAttemptsQueryKey({
              path: { quizUuid: quizId },
              query: { pageable: {} },
            }),
          });
          const graded = String(response.data?.status || '').toLowerCase() === 'graded';
          toast.success(graded ? 'Quiz graded' : 'Quiz submitted for grading');
        },
        onError: () => toast.error('This attempt could not be submitted.'),
      }
    );
  };

  const reviewCompletedAttempt = (attempt: QuizAttempt) => {
    setAttemptUuid(attempt.uuid);
    setResultAttempt(attempt);
    setShowReview(true);
    setPhase('result');
  };

  // ── Loading / not-found ──────────────────────────────────────────────────────
  if (isPageLoading) {
    return (
      <div className='mx-auto w-full max-w-4xl space-y-6 p-5 sm:p-6'>
        <Skeleton className='h-10 w-40 rounded-full' />
        <Skeleton className='h-32 rounded-2xl' />
        <div className='grid gap-3 md:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-20 rounded-2xl' />
          ))}
        </div>
        <Skeleton className='h-40 rounded-2xl' />
      </div>
    );
  }

  if (!matchingScheduleRow || !studentQuiz) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center'>
        <FileQuestion className='text-primary/70 h-10 w-10' />
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>Quiz not available</h3>
          <p className='text-muted-foreground max-w-lg text-sm'>
            This quiz may not be scheduled for your current classes yet.
          </p>
        </div>
        <Button variant='outline' onClick={() => router.push('/dashboard/assignment')}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to assignments
        </Button>
      </div>
    );
  }

  const metaCells = [
    { label: 'Due date', value: formatDate(schedule?.due_at) },
    {
      label: 'Time limit',
      value: studentQuiz.time_limit_minutes ? `${studentQuiz.time_limit_minutes} min` : 'Not timed',
    },
    { label: 'Attempts', value: `${attempts.length} / ${attemptsAllowed ?? '∞'}` },
    {
      label: 'Passing score',
      value: studentQuiz.passing_score != null ? `${studentQuiz.passing_score}%` : 'Not set',
    },
  ];

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8'>
      {/* Header */}
      <div className='border-border/60 space-y-3 border-b pb-5'>
        <Button
          variant='ghost'
          size='sm'
          className='mb-2 -ml-2 rounded-full'
          onClick={() => router.push('/dashboard/assignment')}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          All quizzes
        </Button>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='secondary'>{matchingScheduleRow.classMeta.courseTitle}</Badge>
          <Badge variant='outline'>{matchingScheduleRow.classMeta.classTitle}</Badge>
        </div>
        <h1 className='text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>
          {studentQuiz.title || 'Quiz'}
        </h1>
        {studentQuiz.description ? (
          <p className='text-muted-foreground text-sm'>{studentQuiz.description}</p>
        ) : null}
      </div>

      {/* Meta grid */}
      <div className='grid gap-3 md:grid-cols-4'>
        {metaCells.map(cell => (
          <div
            key={cell.label}
            className='border-border/60 bg-background/70 rounded-2xl border p-3'
          >
            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
              {cell.label}
            </p>
            <p className='text-foreground mt-1 text-sm font-medium'>{cell.value}</p>
          </div>
        ))}
      </div>

      {/* ── Intro phase ── */}
      {phase === 'intro' && (
        <div className='space-y-4'>
          {studentQuiz.instructions ? (
            <div className='border-border/60 bg-card/80 flex items-start gap-3 rounded-2xl border p-4'>
              <Sparkles className='text-primary mt-0.5 h-5 w-5 shrink-0' />
              <div className='space-y-1'>
                <p className='text-foreground text-sm font-medium'>Instructions</p>
                <p className='text-muted-foreground text-sm'>{studentQuiz.instructions}</p>
              </div>
            </div>
          ) : null}

          {latestAttempt && String(latestAttempt.status).toLowerCase() !== 'in_progress' ? (
            <div className='space-y-3'>
              <ResultCard attempt={latestAttempt} />
              {String(latestAttempt.status).toLowerCase() === 'graded' ? (
                <Button variant='outline' onClick={() => reviewCompletedAttempt(latestAttempt)}>
                  Review last attempt
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className='flex flex-wrap gap-3'>
            <Button
              className='gap-2'
              onClick={startAttempt}
              disabled={startMut.isPending || (!inProgressAttempt && !attemptsRemaining)}
            >
              {startMut.isPending ? <Spinner /> : <FileQuestion className='h-4 w-4' />}
              {inProgressAttempt ? 'Resume attempt' : 'Start attempt'}
            </Button>
            {!inProgressAttempt && !attemptsRemaining ? (
              <Badge variant='outline' className='px-3 py-2'>
                No attempts remaining
              </Badge>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Attempt phase ── */}
      {phase === 'attempt' && (
        <div className='space-y-4'>
          <div className='border-border/60 bg-card/80 flex items-start gap-3 rounded-2xl border p-4'>
            <Sparkles className='text-primary mt-0.5 h-5 w-5 shrink-0' />
            <p className='text-muted-foreground text-sm'>
              Answer each question below. Your quiz is graded on the server when you submit —
              correct answers stay hidden until then.
            </p>
          </div>

          {questions.length === 0 ? (
            <div className={cx(getEmptyStateClasses(), 'min-h-[200px]')}>
              <FileQuestion className='text-primary/70 h-10 w-10' />
              <p className='text-muted-foreground text-sm'>
                This quiz has no questions configured yet.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {questions.map((question, index) => {
                const questionUuid = question.uuid ?? `question-${index}`;
                const value = answers[questionUuid] ?? '';
                const options = (question.options ?? [])
                  .slice()
                  .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

                return (
                  <Card key={questionUuid} className='border-border/60'>
                    <CardContent className='space-y-4 p-5'>
                      <div className='space-y-2'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline'>Question {index + 1}</Badge>
                          <Badge variant='secondary'>{formatEnum(question.question_type)}</Badge>
                          <Badge variant='secondary'>{`${question.points ?? 0} pts`}</Badge>
                        </div>
                        <p className='text-foreground font-medium'>{question.question_text}</p>
                      </div>

                      {isTextQuestionType(question.question_type) ? (
                        <Textarea
                          rows={String(question.question_type).toUpperCase() === 'ESSAY' ? 6 : 3}
                          value={value}
                          onChange={e =>
                            setAnswers(prev => ({ ...prev, [questionUuid]: e.target.value }))
                          }
                          placeholder='Type your answer here...'
                        />
                      ) : (
                        <div className='space-y-2'>
                          {options.map(option => {
                            const optionUuid = option.uuid ?? '';
                            const selected = value === optionUuid;
                            return (
                              <button
                                key={optionUuid}
                                type='button'
                                onClick={() =>
                                  setAnswers(prev => ({ ...prev, [questionUuid]: optionUuid }))
                                }
                                className={cx(
                                  'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition',
                                  selected && 'border-primary/40 bg-primary/5'
                                )}
                              >
                                {selected ? (
                                  <CheckCircle2 className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                                ) : (
                                  <Circle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                                )}
                                <span className='text-sm'>{option.option_text}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-end'>
            <Button
              className='gap-2'
              onClick={submitAttempt}
              disabled={submitMut.isPending || questions.length === 0}
            >
              {submitMut.isPending ? <Spinner /> : <Send className='h-4 w-4' />}
              Submit quiz
            </Button>
          </div>
        </div>
      )}

      {/* ── Result phase ── */}
      {phase === 'result' && resultAttempt && (
        <div className='space-y-4'>
          <ResultCard attempt={resultAttempt} />

          {String(resultAttempt.status).toLowerCase() === 'submitted' ? (
            <div className='border-warning/30 bg-warning/5 flex items-start gap-3 rounded-2xl border p-4'>
              <Clock className='text-warning mt-0.5 h-5 w-5 shrink-0' />
              <p className='text-muted-foreground text-sm'>
                Your objective answers are graded. Written answers are awaiting instructor grading —
                your final score will update once they are marked.
              </p>
            </div>
          ) : (
            <div className='flex flex-wrap gap-3'>
              {!showReview ? (
                <Button variant='outline' onClick={() => setShowReview(true)}>
                  Review answers
                </Button>
              ) : null}
            </div>
          )}

          {showReview && reviewQuery.isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-40 rounded-2xl' />
              <Skeleton className='h-40 rounded-2xl' />
            </div>
          ) : null}

          {showReview && review ? (
            <div className='space-y-4'>
              {(review.questions ?? [])
                .slice()
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((question, index) => {
                  const correct = question.response?.is_correct;
                  const selectedOptionUuid = question.response?.selected_option_uuid;
                  const textResponse = question.response?.text_response;
                  const options = (question.options ?? [])
                    .slice()
                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

                  return (
                    <Card
                      key={question.uuid ?? index}
                      className={cx(
                        'border-border/60',
                        correct === true && 'border-success/30',
                        correct === false && 'border-destructive/30'
                      )}
                    >
                      <CardContent className='space-y-4 p-5'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline'>Question {index + 1}</Badge>
                          <Badge variant='secondary'>{formatEnum(question.question_type)}</Badge>
                          <Badge variant='secondary'>
                            {`${question.response?.points_earned ?? 0}/${question.points ?? 0} pts`}
                          </Badge>
                          {correct != null ? (
                            <Badge
                              variant={correct ? 'default' : 'destructive'}
                              className={cx(
                                'ml-auto',
                                correct && 'bg-success/15 text-success border-success/30 border'
                              )}
                            >
                              <span className='flex items-center gap-1'>
                                {correct ? (
                                  <CheckCircle2 className='h-3 w-3' />
                                ) : (
                                  <XCircle className='h-3 w-3' />
                                )}
                                {correct ? 'Correct' : 'Incorrect'}
                              </span>
                            </Badge>
                          ) : null}
                        </div>

                        <p className='text-foreground font-medium'>{question.question_text}</p>

                        {isTextQuestionType(question.question_type) ? (
                          <div className='border-border/60 bg-background/70 rounded-xl border p-4'>
                            <p className='text-muted-foreground text-xs'>Your answer</p>
                            <p className='mt-1 text-sm'>{textResponse || 'No answer provided'}</p>
                          </div>
                        ) : (
                          <div className='space-y-2'>
                            {options.map(option => {
                              const isCorrect = option.is_correct;
                              const isSelected = option.uuid === selectedOptionUuid;
                              return (
                                <div
                                  key={option.uuid}
                                  className={cx(
                                    'flex w-full items-start gap-3 rounded-2xl border p-3',
                                    isCorrect && 'border-success/40 bg-success/5',
                                    isSelected &&
                                      !isCorrect &&
                                      'border-destructive/40 bg-destructive/5'
                                  )}
                                >
                                  {isCorrect ? (
                                    <CheckCircle2 className='text-success mt-0.5 h-4 w-4 shrink-0' />
                                  ) : isSelected ? (
                                    <XCircle className='text-destructive mt-0.5 h-4 w-4 shrink-0' />
                                  ) : (
                                    <Circle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                                  )}
                                  <span className='text-sm'>{option.option_text}</span>
                                  {isCorrect ? (
                                    <Badge className='border-success/30 bg-success/15 text-success ml-auto shrink-0 border'>
                                      Correct
                                    </Badge>
                                  ) : isSelected ? (
                                    <Badge variant='destructive' className='ml-auto shrink-0'>
                                      Your answer
                                    </Badge>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : null}

          <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
            {attemptsRemaining ? (
              <Button variant='outline' className='gap-2' onClick={() => setPhase('intro')}>
                Back to overview
              </Button>
            ) : (
              <span />
            )}
            <Button className='gap-2' onClick={() => router.push('/dashboard/assignment')}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
