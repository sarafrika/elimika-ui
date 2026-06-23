'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useStudent } from '@/context/student-context';
import { useQuizDetails } from '@/hooks/use-quiz-details';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import {
  getEnrollmentsForClassOptions,
  getQuizAttemptsOptions,
  getQuizByUuidOptions,
  getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassQuizSchedule,
  Enrollment,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  QuizQuestionOption,
} from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  FileQuestion,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Student } from '../../../../services/api/schema';

// ─── Types ───────────────────────────────────────────────────────────────────

type ClassMeta = {
  classUuid: string;
  classTitle: string;
  courseTitle: string;
  enrollmentUuid?: string;
};

type QuizMode = 'attempt' | 'review';

type QuizRow = {
  classMeta: ClassMeta;
  attempts: QuizAttempt[];
  quiz: Quiz;
  schedule: ClassQuizSchedule;
};

type AnswerMap = Record<string, string | string[]>;
type StudentClassDefinitionRow = ReturnType<
  typeof useStudentClassDefinitions
>['classDefinitions'][number];
type QuizQuestionWithOptions = QuizQuestion & { options: QuizQuestionOption[] };
type ResolvedClassDetails = {
  class_definition?: { title?: string; uuid?: string };
  course_name?: string;
  name?: string;
  title?: string;
  uuid?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatEnum(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getAttemptBadgeVariant(status?: string) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('graded') || normalized.includes('submitted')) return 'success' as const;
  if (normalized.includes('in_progress') || normalized.includes('started'))
    return 'warning' as const;
  return 'secondary' as const;
}

/** Derive a semantic result tier from a 0-100 percentage. */
function getScoreTier(percentage: number): 'pass' | 'borderline' | 'fail' {
  if (percentage >= 70) return 'pass';
  if (percentage >= 50) return 'borderline';
  return 'fail';
}

// ─── Score Summary Card ───────────────────────────────────────────────────────

type QuizResult = {
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
};

function ScoreSummaryCard({ result }: { result: QuizResult }) {
  const tier = getScoreTier(result.percentage);

  const tierStyles = {
    pass: {
      card: 'border-success/30 bg-success/5',
      badge: 'bg-success/15 text-success border-success/30',
      progress: 'bg-success',
      label: 'Passed',
    },
    borderline: {
      card: 'border-warning/30 bg-warning/5',
      badge: 'bg-warning/15 text-warning border-warning/30',
      progress: 'bg-warning',
      label: 'Almost there',
    },
    fail: {
      card: 'border-destructive/30 bg-destructive/5',
      badge: 'bg-destructive/10 text-destructive border-destructive/30',
      progress: 'bg-destructive',
      label: 'Needs improvement',
    },
  }[tier];

  return (
    <Card className={cx('border', tierStyles.card)}>
      <CardContent className='p-5'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          {/* Left: icon + score */}
          <div className='flex items-center gap-4'>
            <div className='bg-background/80 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border'>
              <Trophy className='text-primary h-6 w-6' />
            </div>
            <div>
              <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                Your score
              </p>
              <p className='text-foreground text-3xl font-bold leading-none'>
                {result.earnedPoints}
                <span className='text-muted-foreground text-lg font-medium'>
                  /{result.totalPoints}
                </span>
              </p>
            </div>
          </div>

          {/* Right: percentage badge + stats */}
          <div className='flex flex-col items-start gap-2 sm:items-end'>
            <span
              className={cx(
                'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
                tierStyles.badge
              )}
            >
              {result.percentage}% · {tierStyles.label}
            </span>

            <div className='text-muted-foreground flex gap-4 text-xs'>
              <span className='text-success flex items-center gap-1 font-medium'>
                <CheckCircle2 className='h-3.5 w-3.5' />
                {result.correctCount} correct
              </span>
              <span className='text-destructive flex items-center gap-1 font-medium'>
                <XCircle className='h-3.5 w-3.5' />
                {result.incorrectCount} incorrect
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className='mt-4 space-y-1.5'>
          <Progress
            value={result.percentage}
            className='h-2 bg-muted'
            // The indicator color is controlled via a CSS variable on the root;
            // we inject an inline style scoped to this element only.
            style={{ '--progress-indicator': `var(--${tier === 'pass' ? 'success' : tier === 'borderline' ? 'warning' : 'destructive'})` } as React.CSSProperties}
          />
          <div className='text-muted-foreground flex justify-between text-xs'>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentQuizWorkspace() {
  const student = useStudent();

  const [searchValue, setSearchValue] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRow | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, AnswerMap>>({});
  const [mode, setMode] = useState<QuizMode>('attempt');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const { classDefinitions, loading: classDefinitionsLoading } =
    useStudentClassDefinitions(student as Student);

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
        .filter(
          (
            classItem
          ): classItem is { classTitle: string; classUuid: string; courseTitle: string } =>
            Boolean(classItem.classUuid)
        ),
    [classDefinitions]
  );

  const classEnrollmentQueries = useQueries({
    queries: classItems.map(classItem => ({
      ...getEnrollmentsForClassOptions({ path: { uuid: classItem.classUuid } }),
      enabled: !!classItem.classUuid,
      staleTime: 5 * 60 * 1000,
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
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const scheduleRows = useMemo(
    () =>
      classMetaList.flatMap((classMeta, index) => {
        const schedules = quizScheduleQueries[index]?.data?.data ?? [];
        return schedules.map((schedule: ClassQuizSchedule) => ({ classMeta, schedule }));
      }),
    [classMetaList, quizScheduleQueries]
  );

  const quizUuids = useMemo(
    () =>
      Array.from(
        new Set(
          scheduleRows
            .map(({ schedule }) => schedule.quiz_uuid as string | undefined)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [scheduleRows]
  );

  const quizDetailQueries = useQueries({
    queries: quizUuids.map(quizUuid => ({
      ...getQuizByUuidOptions({ path: { uuid: quizUuid } }),
      enabled: !!quizUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const quizAttemptQueries = useQueries({
    queries: quizUuids.map(quizUuid => ({
      ...getQuizAttemptsOptions({ path: { quizUuid }, query: { pageable: {} } }),
      enabled: !!quizUuid,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const quizMap = useMemo(() => {
    const map = new Map<string, Quiz>();
    quizUuids.forEach((quizUuid, index) => {
      const quiz = quizDetailQueries[index]?.data?.data;
      if (quiz) map.set(quizUuid, quiz);
    });
    return map;
  }, [quizDetailQueries, quizUuids]);

  const attemptMap = useMemo(() => {
    const map = new Map<string, QuizAttempt[]>();
    quizUuids.forEach((quizUuid, index) => {
      const attempts = quizAttemptQueries[index]?.data?.data?.content ?? [];
      map.set(quizUuid, attempts);
    });
    return map;
  }, [quizAttemptQueries, quizUuids]);

  const quizRows = useMemo<QuizRow[]>(
    () =>
      scheduleRows
        .map(({ classMeta, schedule }) => {
          const quizUuid = schedule.quiz_uuid as string | undefined;
          if (!quizUuid) return null;
          const quiz = quizMap.get(quizUuid);
          if (!quiz) return null;
          const attempts = (attemptMap.get(quizUuid) ?? []).filter(
            (attempt: QuizAttempt) =>
              !classMeta.enrollmentUuid || attempt.enrollment_uuid === classMeta.enrollmentUuid
          );
          return { classMeta, attempts, quiz, schedule };
        })
        .filter((row): row is QuizRow => Boolean(row))
        .sort((l, r) => {
          const lt = new Date(l.schedule?.due_at || l.schedule?.visible_at || 0).getTime();
          const rt = new Date(r.schedule?.due_at || r.schedule?.visible_at || 0).getTime();
          return lt - rt;
        }),
    [attemptMap, quizMap, scheduleRows]
  );

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return quizRows;
    return quizRows.filter(row =>
      [row.quiz?.title, row.quiz?.description, row.classMeta.classTitle, row.classMeta.courseTitle]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    );
  }, [quizRows, searchValue]);

  const stats = useMemo(() => {
    const total = quizRows.length;
    const attempted = quizRows.filter(row => row.attempts.length > 0).length;
    const scheduled = quizRows.filter(
      row => row.schedule?.visible_at || row.schedule?.due_at
    ).length;
    const completed = quizRows.filter(row =>
      row.attempts.some((attempt: QuizAttempt) => Boolean(attempt.is_completed))
    ).length;
    return { attempted, completed, scheduled, total };
  }, [quizRows]);

  const { questions, isLoading: questionsLoading } = useQuizDetails(
    selectedQuiz?.quiz?.uuid as string,
    !!selectedQuiz
  );
  const quizQuestions = questions as QuizQuestionWithOptions[];
  const selectedQuizUuid = selectedQuiz?.quiz?.uuid ?? '';
  const selectedAnswers = selectedQuizUuid ? (answerDrafts[selectedQuizUuid] ?? {}) : {};

  const normalizeAnswer = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const isLoading =
    classDefinitionsLoading ||
    classEnrollmentQueries.some(q => q.isLoading) ||
    quizScheduleQueries.some(q => q.isLoading) ||
    quizDetailQueries.some(q => q.isLoading) ||
    quizAttemptQueries.some(q => q.isLoading);

  const setAnswerValue = (questionUuid: string, value: string | string[]) => {
    if (!selectedQuiz?.quiz?.uuid) return;
    setAnswerDrafts(current => ({
      ...current,
      [selectedQuizUuid]: {
        ...(current[selectedQuizUuid] ?? {}),
        [questionUuid]: value,
      },
    }));
  };

  const toggleOption = (questionUuid: string, optionUuid: string, multiple: boolean) => {
    if (!selectedQuiz?.quiz?.uuid) return;
    const currentValue = selectedAnswers[questionUuid];
    if (!multiple) {
      setAnswerValue(questionUuid, optionUuid);
      return;
    }
    const currentOptions = Array.isArray(currentValue) ? currentValue : [];
    const nextOptions = currentOptions.includes(optionUuid)
      ? currentOptions.filter(v => v !== optionUuid)
      : [...currentOptions, optionUuid];
    setAnswerValue(questionUuid, nextOptions);
  };

  const handleFinishAttempt = () => {
    if (!quizQuestions?.length) return;
    const result = calculateQuizResult(quizQuestions, selectedAnswers);
    setQuizResult(result);
    setMode('review');
  };

  const handleRetakeQuiz = () => {
    if (!selectedQuizUuid) return;
    setAnswerDrafts(current => ({ ...current, [selectedQuizUuid]: {} }));
    setQuizResult(null);
    setMode('attempt');
  };

  const handleCloseSheet = () => {
    setSelectedQuiz(null);
    setQuizResult(null);
    setMode('attempt');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6'>
      {/* ── Page header & stats ── */}
      <section className='space-y-4'>
        <div className='space-y-2'>
          <Badge variant='outline' className='border-primary/30 bg-primary/5 text-primary w-fit'>
            Quiz workspace
          </Badge>
          <h1 className='text-foreground text-2xl font-semibold sm:text-3xl'>
            Review and attempt scheduled quizzes
          </h1>
          <p className='text-muted-foreground max-w-3xl text-sm'>
            Open each scheduled quiz to read the questions and work through your answers without
            exposing the correct options.
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {[
            { label: 'Total quizzes', value: stats.total },
            { label: 'Attempted', value: stats.attempted },
            { label: 'Completed attempts', value: stats.completed },
            { label: 'Scheduled deadlines', value: stats.scheduled },
          ].map(stat => (
            <Card key={stat.label} className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <p className='text-muted-foreground text-sm'>{stat.label}</p>
                <p className='text-foreground mt-2 text-2xl font-semibold'>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Quiz list ── */}
      <section className='space-y-4'>
        <div className='border-border/60 bg-card/90 flex flex-col gap-4 rounded-[28px] border p-5 sm:p-6'>
          <div className='relative'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder='Search quizzes by title, class, or course'
              className='pl-9'
            />
          </div>
        </div>

        {isLoading ? (
          <div className='grid gap-4 xl:grid-cols-2'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-52 rounded-[28px]' />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className={cx(getEmptyStateClasses(), 'min-h-[280px]')}>
            <ClipboardList className='text-primary/70 h-10 w-10' />
            <div className='space-y-1 text-center'>
              <h3 className='text-lg font-semibold'>No quizzes found</h3>
              <p className='text-muted-foreground max-w-lg text-sm'>
                Scheduled quizzes will appear here once your classes publish them.
              </p>
            </div>
          </div>
        ) : (
          <div className='grid gap-4 xl:grid-cols-2'>
            {filteredRows.map(row => {
              const latestAttempt = row.attempts[0] ?? null;

              return (
                <Card
                  key={row.schedule.uuid}
                  className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}
                >
                  <CardHeader className='space-y-3 p-5 pb-3 sm:p-6'>
                    <div className='flex flex-wrap gap-2'>
                      <Badge variant='secondary'>{row.classMeta.courseTitle}</Badge>
                      <Badge variant='outline'>{row.classMeta.classTitle}</Badge>
                      <Badge variant={getAttemptBadgeVariant(latestAttempt?.status)}>
                        {latestAttempt ? formatEnum(latestAttempt.status) : 'Not started'}
                      </Badge>
                    </div>
                    <div className='space-y-1'>
                      <h2 className='text-foreground text-lg font-semibold'>{row.quiz.title}</h2>
                      <p className='text-muted-foreground text-sm'>
                        {row.quiz.description ||
                          'Open this quiz to review the prompt and answer the questions.'}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-4 p-5 pt-0 sm:p-6 sm:pt-0'>
                    <div className='grid gap-3 sm:grid-cols-3'>
                      {[
                        { label: 'Due', value: formatDate(row.schedule?.due_at) },
                        {
                          label: 'Time limit',
                          value:
                            row.schedule?.time_limit_override ??
                            row.quiz?.time_limit_display ??
                            row.quiz?.time_limit_minutes ??
                            'Not timed',
                        },
                        {
                          label: 'Attempts',
                          value: `${row.attempts.length} / ${row.schedule?.attempt_limit_override ?? row.quiz?.attempts_allowed ?? 'N/A'}`,
                        },
                      ].map(cell => (
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

                    <div className='flex flex-wrap gap-3'>
                      <Button className='gap-2' onClick={() => setSelectedQuiz(row)}>
                        View
                      </Button>

                      <Button >
                        <Link className='flex flex-row gap-2' href={`/dashboard/assignment/quiz/${row?.quiz?.uuid}`} >
                          <FileQuestion className='h-4 w-4' />
                          Attempt quiz
                        </Link>
                      </Button>



                      {latestAttempt ? (
                        <Badge variant='outline' className='px-3 py-2'>
                          Latest score:{' '}
                          {latestAttempt.grade_display ||
                            `${latestAttempt.score ?? 0}/${latestAttempt.max_score ?? 0}`}
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Quiz attempt sheet ── */}
      <Sheet open={!!selectedQuiz} onOpenChange={open => !open && handleCloseSheet()}>
        <SheetContent side='right' className='w-full overflow-hidden p-0 sm:max-w-3xl lg:max-w-5xl'>
          <div className='flex h-full flex-col'>
            <SheetHeader className='border-b px-6 py-4'>
              <SheetTitle>{selectedQuiz?.quiz?.title || 'Quiz attempt'}</SheetTitle>
              <SheetDescription>
                {selectedQuiz
                  ? `${selectedQuiz.classMeta.courseTitle} · ${selectedQuiz.classMeta.classTitle}`
                  : 'Work through each question below.'}
              </SheetDescription>
            </SheetHeader>

            {!selectedQuiz ? null : (
              <div className='flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-6'>
                <div className='flex max-h-[80vh] flex-col gap-5 overflow-hidden'>

                  {/* Meta grid */}
                  <div className='grid gap-3 md:grid-cols-4'>
                    {[
                      { label: 'Due date', value: formatDate(selectedQuiz.schedule?.due_at) },
                      {
                        label: 'Time limit',
                        value:
                          selectedQuiz.schedule?.time_limit_override ??
                          selectedQuiz.quiz?.time_limit_display ??
                          selectedQuiz.quiz?.time_limit_minutes ??
                          'Not timed',
                      },
                      { label: 'Attempts used', value: selectedQuiz.attempts.length },
                      {
                        label: 'Passing score',
                        value:
                          selectedQuiz.schedule?.passing_score_override ??
                          selectedQuiz.quiz?.passing_score ??
                          'Not set',
                      },
                    ].map(cell => (
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

                  {/* Score summary — shown after finishing */}
                  {mode === 'review' && quizResult ? (
                    <ScoreSummaryCard result={quizResult} />
                  ) : (
                    <div className='border-border/60 bg-card/80 flex items-start gap-3 rounded-2xl border p-4'>
                      <Sparkles className='text-primary mt-0.5 h-5 w-5 shrink-0' />
                      <div className='space-y-1'>
                        <p className='text-foreground text-sm font-medium'>Student view</p>
                        <p className='text-muted-foreground text-sm'>
                          Correct options remain hidden here. Your selections stay in this workspace
                          while you review the quiz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Questions list */}
                  <div className='flex-1 space-y-6 overflow-y-auto pr-1'>
                    {questionsLoading ? (
                      <>
                        <Skeleton className='h-40 rounded-[28px]' />
                        <Skeleton className='h-40 rounded-[28px]' />
                        <Skeleton className='h-40 rounded-[28px]' />
                      </>
                    ) : questions.length === 0 ? (
                      <div className={cx(getEmptyStateClasses(), 'min-h-[240px]')}>
                        <FileQuestion className='text-primary/70 h-10 w-10' />
                        <div className='space-y-1 text-center'>
                          <h3 className='text-lg font-semibold'>No questions available</h3>
                          <p className='text-muted-foreground max-w-lg text-sm'>
                            This quiz does not have any questions configured yet.
                          </p>
                        </div>
                      </div>
                    ) : (
                      questions
                        .slice()
                        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                        .map((question: QuizQuestionWithOptions, index: number) => {
                          const questionUuid = question.uuid ?? `question-${index}`;
                          const optionCount = question.options?.length ?? 0;
                          const multipleAnswersAllowed =
                            String(question.question_type || '').toUpperCase() ===
                            'MULTIPLE_CHOICE' &&
                            (question.options ?? []).filter(o => o.is_correct).length > 1;

                          const currentValue = selectedAnswers[questionUuid];
                          const selectedOptionValues = Array.isArray(currentValue)
                            ? currentValue
                            : currentValue
                              ? [currentValue]
                              : [];

                          const questionType = String(question.question_type || '').toUpperCase();

                          const isTextQuestion =
                            questionType === 'SHORT_TEXT' ||
                            questionType === 'SHORT_ANSWER' ||
                            questionType === 'ESSAY';

                          // Per-question correctness for review indicator
                          const isQuestionCorrect =
                            mode === 'review'
                              ? (() => {
                                const questionType = String(
                                  question.question_type || ''
                                ).toLowerCase();

                                if (questionType === 'multiple_choice') {
                                  const correctIds = (question.options ?? [])
                                    .filter(o => o.is_correct)
                                    .map(o => o.uuid);

                                  return (
                                    selectedOptionValues.length === correctIds.length &&
                                    selectedOptionValues.every(id => correctIds.includes(id))
                                  );
                                }

                                if (
                                  questionType === 'short_answer' ||
                                  questionType === 'short_text' ||
                                  questionType === 'essay'
                                ) {
                                  const expected =
                                    question.options
                                      ?.find(o => o.is_correct)
                                      ?.option_text?.trim()
                                      .toLowerCase() ?? '';

                                  return (
                                    String(currentValue || '')
                                      .trim()
                                      .toLowerCase() === expected
                                  );
                                }

                                return false;
                              })()
                              : null;

                          return (
                            <Card
                              key={questionUuid}
                              className={cx(
                                'border-border/60 transition-colors',
                                mode === 'review' && isQuestionCorrect === true &&
                                'border-success/30',
                                mode === 'review' && isQuestionCorrect === false &&
                                'border-destructive/30'
                              )}
                            >
                              <CardContent className='space-y-4 p-5'>
                                {/* Question header */}
                                <div className='space-y-2'>
                                  <div className='flex flex-wrap items-center gap-2'>
                                    <Badge variant='outline'>Question {index + 1}</Badge>
                                    <Badge variant='secondary'>
                                      {formatEnum(question.question_type)}
                                    </Badge>
                                    <Badge variant='secondary'>
                                      {question.points_display || `${question.points ?? 0} pts`}
                                    </Badge>
                                    {/* Per-question result badge in review mode */}
                                    {mode === 'review' && (
                                      <Badge
                                        variant={
                                          isQuestionCorrect ? 'default' : 'destructive'
                                        }
                                        className={cx(
                                          'ml-auto',
                                          isQuestionCorrect &&
                                          'bg-success/15 text-success border-success/30 border'
                                        )}
                                      >
                                        {isQuestionCorrect ? (
                                          <span className='flex items-center gap-1'>
                                            <CheckCircle2 className='h-3 w-3' /> Correct
                                          </span>
                                        ) : (
                                          <span className='flex items-center gap-1'>
                                            <XCircle className='h-3 w-3' /> Incorrect
                                          </span>
                                        )}
                                      </Badge>
                                    )}
                                  </div>

                                  <p className='text-foreground font-medium'>
                                    {question.question_text}
                                  </p>

                                  {optionCount > 0 && (
                                    <p className='text-muted-foreground text-xs'>
                                      {multipleAnswersAllowed
                                        ? 'Select all options that apply.'
                                        : 'Select one answer.'}
                                    </p>
                                  )}
                                </div>

                                {/* MCQ options */}
                                {/* Question Answer Area */}
                                {isTextQuestion ? (
                                  <div className='space-y-3'>
                                    {mode === 'attempt' && (
                                      <Textarea
                                        rows={questionType === 'ESSAY' ? 6 : 3}
                                        value={typeof currentValue === 'string' ? currentValue : ''}
                                        onChange={e => setAnswerValue(questionUuid, e.target.value)}
                                        placeholder={
                                          questionType === 'ESSAY'
                                            ? 'Write your essay here...'
                                            : 'Type your answer here...'
                                        }
                                      />
                                    )}

                                    {mode === 'review' && (
                                      (() => {
                                        const submittedAnswer = String(currentValue || '');

                                        const correctAnswer =
                                          question.options?.find(o => o.is_correct)?.option_text || '';

                                        const isCorrect =
                                          normalizeAnswer(submittedAnswer) ===
                                          normalizeAnswer(correctAnswer);

                                        return (
                                          <div className='space-y-2'>
                                            <div
                                              className={cx(
                                                'rounded-xl border p-4',
                                                isCorrect
                                                  ? 'border-success/40 bg-success/5'
                                                  : 'border-destructive/40 bg-destructive/5'
                                              )}
                                            >
                                              <p className='text-muted-foreground text-xs'>
                                                Your answer
                                              </p>
                                              <p className='mt-1 text-sm'>
                                                {submittedAnswer || 'No answer provided'}
                                              </p>
                                            </div>

                                            {!isCorrect && correctAnswer && (
                                              <div className='rounded-xl border border-success/40 bg-success/5 p-4'>
                                                <p className='text-muted-foreground text-xs'>
                                                  Correct answer
                                                </p>
                                                <p className='mt-1 text-sm'>
                                                  {correctAnswer}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()
                                    )}
                                  </div>
                                ) : (
                                  <div className='space-y-2'>
                                    {question.options
                                      .slice()
                                      .sort(
                                        (a, b) =>
                                          (a.display_order ?? 0) -
                                          (b.display_order ?? 0)
                                      )
                                      .map(option => {
                                        const optionUuid = option.uuid!;
                                        const isSelected =
                                          selectedOptionValues.includes(optionUuid);
                                        const isCorrect = option.is_correct;

                                        return (
                                          <button
                                            key={optionUuid}
                                            type='button'
                                            disabled={mode === 'review'}
                                            onClick={() => {
                                              if (mode === 'review') return;

                                              toggleOption(
                                                questionUuid,
                                                optionUuid,
                                                multipleAnswersAllowed
                                              );
                                            }}
                                            className={cx(
                                              'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition',
                                              mode === 'attempt' &&
                                              isSelected &&
                                              'border-primary/40 bg-primary/5',
                                              mode === 'review' &&
                                              isCorrect &&
                                              'border-success/40 bg-success/5',
                                              mode === 'review' &&
                                              isSelected &&
                                              !isCorrect &&
                                              'border-destructive/40 bg-destructive/5'
                                            )}
                                          >
                                            {mode === 'review' ? (
                                              isCorrect ? (
                                                <CheckCircle2 className='text-success mt-0.5 h-4 w-4 shrink-0' />
                                              ) : isSelected ? (
                                                <XCircle className='text-destructive mt-0.5 h-4 w-4 shrink-0' />
                                              ) : (
                                                <Circle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                                              )
                                            ) : (
                                              <Circle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                                            )}

                                            <span className='text-sm'>
                                              {option.option_text}
                                            </span>

                                            {mode === 'review' && isCorrect && (
                                              <Badge className='ml-auto shrink-0 border border-success/30 bg-success/15 text-success'>
                                                Correct
                                              </Badge>
                                            )}

                                            {mode === 'review' &&
                                              isSelected &&
                                              !isCorrect && (
                                                <Badge
                                                  variant='destructive'
                                                  className='ml-auto shrink-0'
                                                >
                                                  Your answer
                                                </Badge>
                                              )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className='flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                    {mode === 'attempt' ? (
                      <>
                        <Button
                          type='button'
                          variant='outline'
                          className='gap-2'
                          onClick={() => {
                            if (!selectedQuiz?.quiz?.uuid) return;
                            setAnswerDrafts(current => ({
                              ...current,
                              [selectedQuizUuid]: {},
                            }));
                          }}
                        >
                          <RotateCcw className='h-4 w-4' />
                          Clear answers
                        </Button>
                        <Button type='button' className='gap-2' onClick={handleFinishAttempt}>
                          <Send className='h-4 w-4' />
                          Finish attempt
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* In review mode: retake or close */}
                        <Button
                          type='button'
                          variant='outline'
                          className='gap-2'
                          onClick={handleRetakeQuiz}
                        >
                          <RotateCcw className='h-4 w-4' />
                          Retake quiz
                        </Button>
                        <Button
                          type='button'
                          className='gap-2'
                          onClick={handleCloseSheet}
                        >
                          Done
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Score calculation (exported for tests) ───────────────────────────────────

export type { QuizResult };

export function calculateQuizResult(
  questions: QuizQuestionWithOptions[],
  answers: AnswerMap
): QuizResult {
  let earnedPoints = 0;
  let totalPoints = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  const normalizeAnswer = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  questions.forEach(question => {
    const points = Number(question.points ?? 0);
    totalPoints += points;

    const answer = answers[question.uuid!];
    const type = String(question.question_type).toLowerCase();

    if (type === 'multiple_choice') {
      const correctOptions = question.options.filter(o => o.is_correct).map(o => o.uuid);
      const selectedOptions = Array.isArray(answer) ? answer : answer ? [answer] : [];
      const isCorrect =
        selectedOptions.length === correctOptions.length &&
        selectedOptions.every(id => correctOptions.includes(id));

      if (isCorrect) {
        earnedPoints += points;
        correctCount++;
      } else {
        incorrectCount++;
      }
    }

    if (
      type === 'short_answer' ||
      type === 'short_text'
    ) {
      const expectedAnswer =
        question.options
          ?.find(o => o.is_correct)
          ?.option_text?.trim()
          .toLowerCase() ?? '';

      const submittedAnswer =
        String(answer || '').trim().toLowerCase();

      const isCorrect =
        normalizeAnswer(submittedAnswer) ===
        normalizeAnswer(expectedAnswer);

      if (isCorrect) {
        earnedPoints += points;
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  });

  return {
    earnedPoints,
    totalPoints,
    percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
    correctCount,
    incorrectCount,
  };
}