'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import {
  getEnrollmentsForClassOptions,
  getQuizAttemptsOptions,
  getQuizByUuidOptions,
  getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassQuizSchedule, Enrollment, Quiz, QuizAttempt } from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import { ClipboardList, FileQuestion, Search } from 'lucide-react';
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

type QuizRow = {
  classMeta: ClassMeta;
  attempts: QuizAttempt[];
  quiz: Quiz;
  schedule: ClassQuizSchedule;
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentQuizWorkspace() {
  const student = useStudent();

  const [searchValue, setSearchValue] = useState('');

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

  const isLoading =
    classDefinitionsLoading ||
    classEnrollmentQueries.some(q => q.isLoading) ||
    quizScheduleQueries.some(q => q.isLoading) ||
    quizDetailQueries.some(q => q.isLoading) ||
    quizAttemptQueries.some(q => q.isLoading);

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
            Open each scheduled quiz to answer its questions. Your attempt is graded on the server
            when you submit.
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

                    <div className='flex flex-wrap items-center gap-3'>
                      <Button>
                        <Link
                          className='flex flex-row items-center gap-2'
                          href={`/dashboard/assignment/quiz/${row?.quiz?.uuid}`}
                        >
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
    </div>
  );
}
