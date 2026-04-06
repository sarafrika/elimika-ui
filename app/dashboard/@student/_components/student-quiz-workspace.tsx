'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { useQuizDetails } from '@/hooks/use-quiz-details';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import {
  getEnrollmentsForClassOptions,
  getQuizAttemptsOptions,
  getQuizByUuidOptions,
  getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  FileQuestion,
  RotateCcw,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ClassMeta = {
  classUuid: string;
  classTitle: string;
  courseTitle: string;
  enrollmentUuid?: string;
};

type QuizRow = {
  classMeta: ClassMeta;
  attempts: any[];
  quiz: any;
  schedule: any;
};

type AnswerMap = Record<string, string | string[]>;

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

export function StudentQuizWorkspace() {
  const student = useStudent();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [searchValue, setSearchValue] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRow | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, AnswerMap>>({});

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'quiz', title: 'Quiz', url: '/dashboard/quiz', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const { classDefinitions, loading: classDefinitionsLoading } =
    useStudentClassDefinitions(student);

  const classItems = useMemo(
    () =>
      (classDefinitions ?? [])
        .map((classDefinition: any) => ({
          classTitle:
            classDefinition.classDetails?.title ||
            classDefinition.classDetails?.name ||
            'Untitled class',
          classUuid: (classDefinition.uuid || classDefinition.classDetails?.uuid) as
            | string
            | undefined,
          courseTitle:
            classDefinition.course?.name ||
            classDefinition.course?.title ||
            classDefinition.classDetails?.course_name ||
            'Untitled course',
        }))
        .filter(
          (
            classItem
          ): classItem is {
            classTitle: string;
            classUuid: string;
            courseTitle: string;
          } => Boolean(classItem.classUuid)
        ),
    [classDefinitions]
  );

  const classEnrollmentQueries = useQueries({
    queries: classItems.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.classUuid },
      }),
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
          enrollments.find((enrollment: any) => enrollment.student_uuid === student?.uuid) ?? null;

        return {
          ...classItem,
          enrollmentUuid: matchingEnrollment?.uuid,
        };
      }),
    [classEnrollmentQueries, classItems, student?.uuid]
  );

  const quizScheduleQueries = useQueries({
    queries: classMetaList.map(classMeta => ({
      ...getQuizSchedulesOptions({
        path: { classUuid: classMeta.classUuid },
      }),
      enabled: !!classMeta.classUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const scheduleRows = useMemo(
    () =>
      classMetaList.flatMap((classMeta, index) => {
        const schedules = quizScheduleQueries[index]?.data?.data ?? [];
        return schedules.map((schedule: any) => ({ classMeta, schedule }));
      }),
    [classMetaList, quizScheduleQueries]
  );

  const quizUuids = useMemo(
    () =>
      Array.from(
        new Set(
          scheduleRows
            .map(({ schedule }) => schedule.quiz_uuid as string | undefined)
            .filter((quizUuid): quizUuid is string => Boolean(quizUuid))
        )
      ),
    [scheduleRows]
  );

  const quizDetailQueries = useQueries({
    queries: quizUuids.map(quizUuid => ({
      ...getQuizByUuidOptions({
        path: { uuid: quizUuid },
      }),
      enabled: !!quizUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const quizAttemptQueries = useQueries({
    queries: quizUuids.map(quizUuid => ({
      ...getQuizAttemptsOptions({
        path: { quizUuid },
      }),
      enabled: !!quizUuid,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const quizMap = useMemo(() => {
    const map = new Map<string, any>();
    quizUuids.forEach((quizUuid, index) => {
      const quiz = quizDetailQueries[index]?.data?.data;
      if (quiz) {
        map.set(quizUuid, quiz);
      }
    });
    return map;
  }, [quizDetailQueries, quizUuids]);

  const attemptMap = useMemo(() => {
    const map = new Map<string, any[]>();

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
            (attempt: any) =>
              !classMeta.enrollmentUuid || attempt.enrollment_uuid === classMeta.enrollmentUuid
          );

          return {
            classMeta,
            attempts,
            quiz,
            schedule,
          };
        })
        .filter((row): row is QuizRow => Boolean(row))
        .sort((left, right) => {
          const leftTime = new Date(
            left.schedule?.due_at || left.schedule?.visible_at || 0
          ).getTime();
          const rightTime = new Date(
            right.schedule?.due_at || right.schedule?.visible_at || 0
          ).getTime();
          return leftTime - rightTime;
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
      row.attempts.some((attempt: any) => Boolean(attempt.is_completed))
    ).length;

    return { attempted, completed, scheduled, total };
  }, [quizRows]);

  const { questions, isLoading: questionsLoading } = useQuizDetails(
    selectedQuiz?.quiz?.uuid as string,
    !!selectedQuiz
  );

  const selectedAnswers = selectedQuiz ? (answerDrafts[selectedQuiz.quiz.uuid] ?? {}) : {};

  const isLoading =
    classDefinitionsLoading ||
    classEnrollmentQueries.some(query => query.isLoading) ||
    quizScheduleQueries.some(query => query.isLoading) ||
    quizDetailQueries.some(query => query.isLoading) ||
    quizAttemptQueries.some(query => query.isLoading);

  const setAnswerValue = (questionUuid: string, value: string | string[]) => {
    if (!selectedQuiz?.quiz?.uuid) return;

    setAnswerDrafts(current => ({
      ...current,
      [selectedQuiz.quiz.uuid]: {
        ...(current[selectedQuiz.quiz.uuid] ?? {}),
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
      ? currentOptions.filter(value => value !== optionUuid)
      : [...currentOptions, optionUuid];

    setAnswerValue(questionUuid, nextOptions);
  };

  const handleFinishAttempt = () => {
    toast.success('Quiz answers captured locally for review.');
  };

  return (
    <div className='space-y-6'>
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
          <Card className={getStatCardClasses()}>
            <CardContent className='p-0'>
              <p className='text-muted-foreground text-sm'>Total quizzes</p>
              <p className='text-foreground mt-2 text-2xl font-semibold'>{stats.total}</p>
            </CardContent>
          </Card>
          <Card className={getStatCardClasses()}>
            <CardContent className='p-0'>
              <p className='text-muted-foreground text-sm'>Attempted</p>
              <p className='text-foreground mt-2 text-2xl font-semibold'>{stats.attempted}</p>
            </CardContent>
          </Card>
          <Card className={getStatCardClasses()}>
            <CardContent className='p-0'>
              <p className='text-muted-foreground text-sm'>Completed attempts</p>
              <p className='text-foreground mt-2 text-2xl font-semibold'>{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className={getStatCardClasses()}>
            <CardContent className='p-0'>
              <p className='text-muted-foreground text-sm'>Scheduled deadlines</p>
              <p className='text-foreground mt-2 text-2xl font-semibold'>{stats.scheduled}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className='space-y-4'>
        <div className='border-border/60 bg-card/90 flex flex-col gap-4 rounded-[28px] border p-5 sm:p-6'>
          <div className='relative'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              placeholder='Search quizzes by title, class, or course'
              className='pl-9'
            />
          </div>
        </div>

        {isLoading ? (
          <div className='grid gap-4 xl:grid-cols-2'>
            <Skeleton className='h-52 rounded-[28px]' />
            <Skeleton className='h-52 rounded-[28px]' />
            <Skeleton className='h-52 rounded-[28px]' />
            <Skeleton className='h-52 rounded-[28px]' />
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
                      <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                        <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                          Due
                        </p>
                        <p className='text-foreground mt-1 text-sm font-medium'>
                          {formatDate(row.schedule?.due_at)}
                        </p>
                      </div>
                      <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                        <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                          Time limit
                        </p>
                        <p className='text-foreground mt-1 text-sm font-medium'>
                          {row.schedule?.time_limit_override ??
                            row.quiz?.time_limit_display ??
                            row.quiz?.time_limit_minutes ??
                            'Not timed'}
                        </p>
                      </div>
                      <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                        <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                          Attempts
                        </p>
                        <p className='text-foreground mt-1 text-sm font-medium'>
                          {row.attempts.length} /{' '}
                          {row.schedule?.attempt_limit_override ??
                            row.quiz?.attempts_allowed ??
                            'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-3'>
                      <Button className='gap-2' onClick={() => setSelectedQuiz(row)}>
                        <FileQuestion className='h-4 w-4' />
                        Attempt quiz
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

      <Dialog open={!!selectedQuiz} onOpenChange={open => !open && setSelectedQuiz(null)}>
        <DialogContent className='max-h-[92vh] max-w-5xl overflow-hidden'>
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.quiz?.title || 'Quiz attempt'}</DialogTitle>
            <DialogDescription>
              {selectedQuiz
                ? `${selectedQuiz.classMeta.courseTitle} · ${selectedQuiz.classMeta.classTitle}`
                : 'Work through each question below.'}
            </DialogDescription>
          </DialogHeader>

          {!selectedQuiz ? null : (
            <div className='flex max-h-[80vh] flex-col gap-5 overflow-hidden'>
              <div className='grid gap-3 md:grid-cols-4'>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Due date
                  </p>
                  <p className='text-foreground mt-1 text-sm font-medium'>
                    {formatDate(selectedQuiz.schedule?.due_at)}
                  </p>
                </div>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Time limit
                  </p>
                  <p className='text-foreground mt-1 text-sm font-medium'>
                    {selectedQuiz.schedule?.time_limit_override ??
                      selectedQuiz.quiz?.time_limit_display ??
                      selectedQuiz.quiz?.time_limit_minutes ??
                      'Not timed'}
                  </p>
                </div>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Attempts used
                  </p>
                  <p className='text-foreground mt-1 text-sm font-medium'>
                    {selectedQuiz.attempts.length}
                  </p>
                </div>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Passing score
                  </p>
                  <p className='text-foreground mt-1 text-sm font-medium'>
                    {selectedQuiz.schedule?.passing_score_override ??
                      selectedQuiz.quiz?.passing_score ??
                      'Not set'}
                  </p>
                </div>
              </div>

              <div className='border-border/60 bg-card/80 flex items-start gap-3 rounded-2xl border p-4'>
                <Sparkles className='text-primary mt-0.5 h-5 w-5 shrink-0' />
                <div className='space-y-1'>
                  <p className='text-foreground text-sm font-medium'>Student view</p>
                  <p className='text-muted-foreground text-sm'>
                    Correct options remain hidden here. Your selections stay in this workspace while
                    you review the quiz.
                  </p>
                </div>
              </div>

              <div className='flex-1 space-y-4 overflow-y-auto pr-1'>
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
                    .sort(
                      (left: any, right: any) =>
                        (left.display_order ?? 0) - (right.display_order ?? 0)
                    )
                    .map((question: any, index: number) => {
                      const optionCount = Array.isArray(question.options)
                        ? question.options.length
                        : 0;
                      const multipleAnswersAllowed =
                        String(question.question_type || '').toUpperCase() === 'MULTIPLE_CHOICE' &&
                        (question.options ?? []).filter((option: any) => option.is_correct).length >
                          1;
                      const currentValue = selectedAnswers[question.uuid];
                      const selectedOptionValues = Array.isArray(currentValue)
                        ? currentValue
                        : currentValue
                          ? [currentValue]
                          : [];

                      return (
                        <Card key={question.uuid} className='border-border/60'>
                          <CardContent className='space-y-4 p-5'>
                            <div className='space-y-2'>
                              <div className='flex flex-wrap items-center gap-2'>
                                <Badge variant='outline'>Question {index + 1}</Badge>
                                <Badge variant='secondary'>
                                  {formatEnum(question.question_type)}
                                </Badge>
                                <Badge variant='secondary'>
                                  {question.points_display || `${question.points ?? 0} pts`}
                                </Badge>
                              </div>
                              <p className='text-foreground font-medium'>
                                {question.question_text}
                              </p>
                              {optionCount > 0 ? (
                                <p className='text-muted-foreground text-xs'>
                                  {multipleAnswersAllowed
                                    ? 'Select all options that apply.'
                                    : 'Select one answer.'}
                                </p>
                              ) : null}
                            </div>

                            {optionCount > 0 ? (
                              <div className='space-y-2'>
                                {(question.options ?? [])
                                  .slice()
                                  .sort(
                                    (left: any, right: any) =>
                                      (left.display_order ?? 0) - (right.display_order ?? 0)
                                  )
                                  .map((option: any) => {
                                    const isSelected = selectedOptionValues.includes(option.uuid);

                                    return (
                                      <button
                                        key={option.uuid}
                                        type='button'
                                        className={cx(
                                          'border-border/60 bg-background/70 flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition',
                                          isSelected && 'border-primary/40 bg-primary/5'
                                        )}
                                        onClick={() =>
                                          toggleOption(
                                            question.uuid,
                                            option.uuid,
                                            multipleAnswersAllowed
                                          )
                                        }
                                      >
                                        {multipleAnswersAllowed ? (
                                          <CheckCircle2
                                            className={cx(
                                              'mt-0.5 h-4 w-4 shrink-0',
                                              isSelected ? 'text-primary' : 'text-muted-foreground'
                                            )}
                                          />
                                        ) : (
                                          <Circle
                                            className={cx(
                                              'mt-0.5 h-4 w-4 shrink-0',
                                              isSelected ? 'text-primary' : 'text-muted-foreground'
                                            )}
                                          />
                                        )}
                                        <span className='text-foreground text-sm'>
                                          {option.option_text}
                                        </span>
                                      </button>
                                    );
                                  })}
                              </div>
                            ) : (
                              <Textarea
                                rows={
                                  String(question.question_type || '').toUpperCase() === 'ESSAY'
                                    ? 6
                                    : 3
                                }
                                value={typeof currentValue === 'string' ? currentValue : ''}
                                onChange={event =>
                                  setAnswerValue(question.uuid, event.target.value)
                                }
                                placeholder='Type your answer here'
                              />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                )}
              </div>

              <div className='flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                <Button
                  type='button'
                  variant='outline'
                  className='gap-2'
                  onClick={() => {
                    if (!selectedQuiz?.quiz?.uuid) return;
                    setAnswerDrafts(current => ({
                      ...current,
                      [selectedQuiz.quiz.uuid]: {},
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
