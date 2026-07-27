'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useEnrollmentsByIds, useStudentsByIds } from '@/hooks/use-batched-lookups';
import { cx, getEmptyStateClasses } from '@/lib/design-system';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getQuizAttemptsOptions,
  getQuizAttemptsQueryKey,
  getStudentQuizReviewOptions,
  getStudentQuizReviewQueryKey,
  gradeQuizTextResponseMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { QuizAttempt } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock, FileQuestion } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
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

function statusOf(attempt: QuizAttempt) {
  return String(attempt.status || '').toLowerCase();
}

type GradeDraft = { points: string; feedback: string };

export default function InstructorQuizGradingPage() {
  const params = useParams();
  const quizId = params?.quizId as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>({});

  const attemptsQuery = useQuery({
    ...getQuizAttemptsOptions({ path: { quizUuid: quizId }, query: { pageable: {} } }),
    enabled: !!quizId,
    staleTime: STALE_TIMES.live,
  });

  const attempts = attemptsQuery.data?.data?.content ?? [];
  const pending = attempts.filter(a => statusOf(a) === 'submitted');
  const graded = attempts.filter(a => statusOf(a) === 'graded');

  // Resolve student names in two batched requests: attempt → enrollment → student.
  const enrollmentIds = useMemo(
    () => attempts.map(a => a.enrollment_uuid).filter((id): id is string => Boolean(id)),
    [attempts]
  );
  const { enrollmentMap } = useEnrollmentsByIds(enrollmentIds);
  const studentIds = useMemo(
    () =>
      Object.values(enrollmentMap)
        .map(enrollment => enrollment.student_uuid)
        .filter((id): id is string => Boolean(id)),
    [enrollmentMap]
  );
  const { studentMap } = useStudentsByIds(studentIds);

  const studentNameForAttempt = (attempt: QuizAttempt): string | undefined => {
    const enrollment = attempt.enrollment_uuid ? enrollmentMap[attempt.enrollment_uuid] : undefined;
    const student = enrollment?.student_uuid ? studentMap[enrollment.student_uuid] : undefined;
    return student?.full_name;
  };

  const enrollmentUuid = selectedAttempt?.enrollment_uuid;
  const attemptUuid = selectedAttempt?.uuid;

  const reviewQuery = useQuery({
    ...getStudentQuizReviewOptions({
      path: { quizUuid: quizId, attemptUuid: attemptUuid as string },
      query: { enrollment_uuid: enrollmentUuid as string },
    }),
    enabled: !!attemptUuid && !!enrollmentUuid,
    staleTime: STALE_TIMES.live,
  });
  const review = reviewQuery.data?.data;

  const gradeMut = useMutation(gradeQuizTextResponseMutation());

  const draftFor = (questionUuid: string, fallbackPoints?: number): GradeDraft =>
    drafts[questionUuid] ?? { points: String(fallbackPoints ?? ''), feedback: '' };

  const setDraft = (questionUuid: string, patch: Partial<GradeDraft>, fallbackPoints?: number) => {
    setDrafts(prev => ({
      ...prev,
      [questionUuid]: { ...draftFor(questionUuid, fallbackPoints), ...patch },
    }));
  };

  const gradeResponse = (questionUuid: string, maxPoints: number) => {
    if (!attemptUuid) return;
    const draft = draftFor(questionUuid);
    const points = Number(draft.points);
    if (Number.isNaN(points) || points < 0 || points > maxPoints) {
      toast.error(`Points must be between 0 and ${maxPoints}.`);
      return;
    }
    gradeMut.mutate(
      {
        path: { quizUuid: quizId, attemptUuid, questionUuid },
        body: { points, feedback: draft.feedback || null },
      },
      {
        onSuccess: response => {
          queryClient.invalidateQueries({
            queryKey: getStudentQuizReviewQueryKey({
              path: { quizUuid: quizId, attemptUuid },
              query: { enrollment_uuid: enrollmentUuid as string },
            }),
          });
          queryClient.invalidateQueries({
            queryKey: getQuizAttemptsQueryKey({
              path: { quizUuid: quizId },
              query: { pageable: {} },
            }),
          });
          const finalised = String(response.data?.status || '').toLowerCase() === 'graded';
          toast.success(finalised ? 'Response graded — attempt finalised' : 'Response graded');
          if (finalised) {
            setSelectedAttempt(null);
            setDrafts({});
          }
        },
        onError: () => toast.error('The grade could not be saved.'),
      }
    );
  };

  const closeSheet = () => {
    setSelectedAttempt(null);
    setDrafts({});
  };

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-5 sm:p-6'>
      <div className='border-border/60 space-y-3 border-b pb-5'>
        <Button
          variant='ghost'
          size='sm'
          className='-ml-2 rounded-full'
          onClick={() => router.back()}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
        <div className='flex items-center gap-3'>
          <ClipboardCheck className='text-primary h-6 w-6' />
          <h1 className='text-foreground text-2xl font-semibold'>Grade quiz submissions</h1>
        </div>
        <p className='text-muted-foreground text-sm'>
          Review submitted attempts and mark their written answers. Objective questions are graded
          automatically; an attempt is finalised once every written answer is marked.
        </p>
      </div>

      {attemptsQuery.isLoading ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-24 rounded-2xl' />
          ))}
        </div>
      ) : (
        <div className='space-y-6'>
          <section className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Clock className='text-warning h-4 w-4' />
              <h2 className='text-foreground text-lg font-semibold'>Pending grading</h2>
              <Badge variant='secondary'>{pending.length}</Badge>
            </div>

            {pending.length === 0 ? (
              <div className={cx(getEmptyStateClasses(), 'min-h-[160px]')}>
                <CheckCircle2 className='text-success h-8 w-8' />
                <p className='text-muted-foreground text-sm'>
                  Nothing awaiting grading. Submitted attempts with written answers will appear
                  here.
                </p>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2'>
                {pending.map(attempt => (
                  <Card key={attempt.uuid} className='border-border/60'>
                    <CardContent className='space-y-3 p-4'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='text-foreground text-sm font-medium'>
                          {studentNameForAttempt(attempt) ??
                            `Attempt #${attempt.attempt_number ?? '—'}`}
                        </p>
                        <Badge variant='warning'>Pending</Badge>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Attempt #{attempt.attempt_number ?? '—'} · Submitted{' '}
                        {formatDate(attempt.submitted_at)}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Auto-graded so far: {attempt.score ?? 0}/{attempt.max_score ?? 0}
                      </p>
                      <Button
                        size='sm'
                        className='w-full'
                        onClick={() => setSelectedAttempt(attempt)}
                      >
                        Grade written answers
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {graded.length > 0 ? (
            <section className='space-y-3'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='text-success h-4 w-4' />
                <h2 className='text-foreground text-lg font-semibold'>Graded</h2>
                <Badge variant='secondary'>{graded.length}</Badge>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                {graded.map(attempt => (
                  <Card key={attempt.uuid} className='border-border/60'>
                    <CardContent className='flex items-center justify-between gap-2 p-4'>
                      <div>
                        <p className='text-foreground text-sm font-medium'>
                          {studentNameForAttempt(attempt) ??
                            `Attempt #${attempt.attempt_number ?? '—'}`}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          Attempt #{attempt.attempt_number ?? '—'} · {attempt.score ?? 0}/
                          {attempt.max_score ?? 0} · {Math.round(Number(attempt.percentage ?? 0))}%
                        </p>
                      </div>
                      <Badge
                        variant={attempt.is_passed ? 'success' : 'destructive'}
                        className={cx(
                          attempt.is_passed && 'bg-success/15 text-success border-success/30 border'
                        )}
                      >
                        {attempt.is_passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {/* Grading sheet */}
      <Sheet open={!!selectedAttempt} onOpenChange={open => !open && closeSheet()}>
        <SheetContent side='right' className='w-full overflow-y-auto p-0 sm:max-w-2xl'>
          <SheetHeader className='border-b px-6 py-4'>
            <SheetTitle>
              {selectedAttempt
                ? (studentNameForAttempt(selectedAttempt) ??
                  `Attempt #${selectedAttempt.attempt_number ?? '—'}`)
                : 'Grade attempt'}
            </SheetTitle>
            <SheetDescription>
              Mark each written answer. Objective answers are shown for reference.
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-4 p-6'>
            {reviewQuery.isLoading ? (
              <>
                <Skeleton className='h-40 rounded-2xl' />
                <Skeleton className='h-40 rounded-2xl' />
              </>
            ) : !review ? (
              <div className={cx(getEmptyStateClasses(), 'min-h-[200px]')}>
                <FileQuestion className='text-primary/70 h-8 w-8' />
                <p className='text-muted-foreground text-sm'>
                  This attempt has no responses to review.
                </p>
              </div>
            ) : (
              (review.questions ?? [])
                .slice()
                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((question, index) => {
                  const questionUuid = question.uuid ?? `question-${index}`;
                  const maxPoints = Number(question.points ?? 0);
                  const response = question.response;
                  const text = isTextQuestionType(question.question_type);
                  const draft = draftFor(questionUuid, response?.points_earned);

                  return (
                    <Card key={questionUuid} className='border-border/60'>
                      <CardContent className='space-y-3 p-5'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline'>Question {index + 1}</Badge>
                          <Badge variant='secondary'>{formatEnum(question.question_type)}</Badge>
                          <Badge variant='secondary'>{`${maxPoints} pts`}</Badge>
                          {!text && response?.is_correct != null ? (
                            <Badge
                              variant={response.is_correct ? 'success' : 'destructive'}
                              className={cx(
                                'ml-auto',
                                response.is_correct &&
                                  'bg-success/15 text-success border-success/30 border'
                              )}
                            >
                              {response.is_correct ? 'Auto: correct' : 'Auto: incorrect'}
                            </Badge>
                          ) : null}
                        </div>

                        <p className='text-foreground font-medium'>{question.question_text}</p>

                        {text ? (
                          <>
                            <div className='border-border/60 bg-background/70 rounded-xl border p-4'>
                              <p className='text-muted-foreground text-xs'>Student answer</p>
                              <p className='mt-1 text-sm whitespace-pre-wrap'>
                                {response?.text_response || 'No answer provided'}
                              </p>
                            </div>

                            <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
                              <label className='flex flex-col gap-1'>
                                <span className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                                  Points (max {maxPoints})
                                </span>
                                <Input
                                  type='number'
                                  min={0}
                                  max={maxPoints}
                                  className='w-28'
                                  value={draft.points}
                                  onChange={e =>
                                    setDraft(
                                      questionUuid,
                                      { points: e.target.value },
                                      response?.points_earned
                                    )
                                  }
                                />
                              </label>
                              <Button
                                className='gap-2'
                                disabled={gradeMut.isPending}
                                onClick={() => gradeResponse(questionUuid, maxPoints)}
                              >
                                {gradeMut.isPending ? (
                                  <Spinner />
                                ) : (
                                  <CheckCircle2 className='h-4 w-4' />
                                )}
                                Save grade
                              </Button>
                            </div>

                            <Textarea
                              rows={3}
                              placeholder='Feedback for the student (optional)'
                              value={draft.feedback}
                              onChange={e =>
                                setDraft(
                                  questionUuid,
                                  { feedback: e.target.value },
                                  response?.points_earned
                                )
                              }
                            />
                          </>
                        ) : (
                          <div className='border-border/60 bg-background/70 rounded-xl border p-4'>
                            <p className='text-muted-foreground text-xs'>
                              Auto-graded: {response?.points_earned ?? 0}/{maxPoints} pts
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
