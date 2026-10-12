'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileQuestion,
  Repeat2,
  Search,
  Target,
  Timer,
  Trophy,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent } from '@/context/student-context';
import { useClassesByIds, useQuizzesByIds } from '@/hooks/use-batched-lookups';
import { useClassAssessmentSchedules } from '@/hooks/use-class-assessment-schedules';
import { cn } from '@/lib/utils';
import { getClassEnrollmentsForStudentOptions } from '@/services/client/@tanstack/react-query.gen';
import type { ClassQuizSchedule, Quiz, QuizAttempt } from '@/services/client/types.gen';

// ─── Types ───────────────────────────────────────────────────────────────────

type ClassMeta = {
  classUuid: string;
  classTitle: string;
  courseTitle: string;
  enrollmentUuid?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value?: string | Date | null) {
  if (!value) return 'No deadline';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

function formatEnum(value?: string | null) {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Lifecycle → label, badge variant, and accent-bar/icon-chip tone for a quiz. */
function getQuizStatus(attempt?: QuizAttempt | null) {
  if (!attempt) {
    return {
      label: 'Not started',
      variant: 'secondary' as const,
      accent: 'bg-primary',
      chip: 'bg-primary/10 text-primary',
    };
  }
  const status = String(attempt.status || '').toLowerCase();
  if (attempt.is_completed || status.includes('graded') || status.includes('submitted')) {
    return {
      label: formatEnum(attempt.status) || 'Completed',
      variant: 'success' as const,
      accent: 'bg-success',
      chip: 'bg-success/10 text-success',
    };
  }
  if (status.includes('progress') || status.includes('started')) {
    return {
      label: 'In progress',
      variant: 'warning' as const,
      accent: 'bg-warning',
      chip: 'bg-warning/10 text-warning',
    };
  }
  return {
    label: formatEnum(attempt.status),
    variant: 'secondary' as const,
    accent: 'bg-primary',
    chip: 'bg-primary/10 text-primary',
  };
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  tone = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning';
}) {
  const chip =
    tone === 'success'
      ? 'bg-success/10 text-success'
      : tone === 'warning'
        ? 'bg-warning/10 text-warning'
        : 'bg-primary/10 text-primary';

  return (
    <div className='border-border/70 bg-card hover:border-primary/30 rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md'>
      <div className='flex items-center gap-4'>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', chip)}>
          <Icon className='h-5 w-5' />
        </div>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-sm'>{label}</p>
          <p className='text-foreground text-2xl font-bold tracking-tight'>{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz card ────────────────────────────────────────────────────────────────

function StudentQuizCard({
  classMeta,
  quiz,
  schedule,
  attempts,
}: {
  classMeta: ClassMeta;
  quiz?: Quiz;
  schedule: ClassQuizSchedule;
  attempts: QuizAttempt[];
}) {
  const latestAttempt = attempts[0] ?? null;
  const status = getQuizStatus(latestAttempt);

  const cell = (
    icon: React.ComponentType<{ className?: string }>,
    label: string,
    value: React.ReactNode
  ) => {
    const Icon = icon;
    return (
      <div className='flex flex-col gap-1 px-3 py-2'>
        <span className='text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase'>
          <Icon className='h-3 w-3' />
          {label}
        </span>
        <span className='text-foreground text-sm font-semibold'>{value}</span>
      </div>
    );
  };

  return (
    <article className='group border-border/70 bg-card hover:border-primary/30 relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md'>
      <div className={cn('absolute inset-x-0 top-0 h-1', status.accent)} />

      <div className='flex h-full flex-col gap-5 p-5 sm:p-6'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-3'>
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                status.chip
              )}
            >
              <ClipboardList className='h-5 w-5' />
            </div>
            <div className='min-w-0 space-y-1'>
              <p className='text-muted-foreground truncate text-[11px] font-semibold tracking-wide uppercase'>
                {classMeta.courseTitle}
              </p>
              <h3 className='text-foreground text-base leading-snug font-semibold sm:text-lg'>
                <span className='line-clamp-2'>{quiz?.title || 'Untitled quiz'}</span>
              </h3>
              <p className='text-muted-foreground truncate text-xs'>{classMeta.classTitle}</p>
            </div>
          </div>

          <Badge variant={status.variant} className='shrink-0'>
            {status.label}
          </Badge>
        </div>

        {quiz?.description ? (
          <p className='text-muted-foreground line-clamp-2 text-sm leading-relaxed'>
            {quiz.description}
          </p>
        ) : (
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Open this quiz to review the prompt and answer the questions.
          </p>
        )}

        <div className='divide-border/60 border-border/60 bg-background/60 grid grid-cols-3 divide-x rounded-xl border'>
          {cell(CalendarDays, 'Due', formatDate(schedule?.due_at))}
          {cell(
            Timer,
            'Time',
            schedule?.time_limit_override ??
              quiz?.time_limit_display ??
              (quiz?.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'Untimed')
          )}
          {cell(
            Repeat2,
            'Attempts',
            `${attempts.length}/${schedule?.attempt_limit_override ?? quiz?.attempts_allowed ?? '∞'}`
          )}
        </div>

        <div className='border-border/60 mt-auto flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
          {latestAttempt ? (
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Trophy className='text-warning h-4 w-4' />
              <span className='text-foreground font-medium'>
                {latestAttempt.grade_display ||
                  `${latestAttempt.score ?? 0}/${latestAttempt.max_score ?? 0}`}
              </span>
              latest score
            </div>
          ) : (
            <span className='text-muted-foreground text-sm'>Not attempted yet</span>
          )}

          <Button asChild size='sm' className='shrink-0'>
            <Link
              href={`/dashboard/student/assignment/quiz/${schedule.quiz_uuid}`}
              className='flex items-center gap-2'
            >
              <FileQuestion className='h-4 w-4' />
              {latestAttempt ? 'Open quiz' : 'Attempt quiz'}
              <ArrowRight className='h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

// ─── Workspace ─────────────────────────────────────────────────────────────────

export function StudentQuizWorkspace({ embedded = false }: { embedded?: boolean } = {}) {
  const student = useStudent();

  const [searchValue, setSearchValue] = useState('');

  // Same options as useStudentClassDefinitions so the enrolment list shares its cache entry.
  const enrollmentsQuery = useQuery({
    ...getClassEnrollmentsForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!student?.uuid,
  });

  const enrollmentRows = useMemo(
    () => enrollmentsQuery.data?.data?.content ?? [],
    [enrollmentsQuery.data]
  );

  const classUuids = useMemo(
    () =>
      Array.from(
        new Set(
          enrollmentRows
            .map(row => row.class_definition_uuid)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [enrollmentRows]
  );

  const { classMap, isLoading: classesLoading } = useClassesByIds(classUuids);
  const { quizSchedules, isLoading: schedulesLoading } = useClassAssessmentSchedules(classUuids);

  const classMetaById = useMemo(() => {
    const map = new Map<string, ClassMeta>();
    for (const row of enrollmentRows) {
      const classUuid = row.class_definition_uuid;
      if (!classUuid || map.has(classUuid)) continue;
      const summary = classMap[classUuid];
      const classTitle = row.class_title || summary?.title || 'Untitled class';
      map.set(classUuid, {
        classUuid,
        classTitle,
        courseTitle: summary?.course_title || classTitle,
        enrollmentUuid: row.latest_enrollment_uuid,
      });
    }
    return map;
  }, [classMap, enrollmentRows]);

  const scheduleRows = useMemo(
    () =>
      quizSchedules.flatMap(schedule => {
        const classMeta = schedule.class_definition_uuid
          ? classMetaById.get(schedule.class_definition_uuid)
          : undefined;
        return classMeta ? [{ classMeta, schedule }] : [];
      }),
    [classMetaById, quizSchedules]
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

  // One quizzes/search call; quizzes the student cannot read are simply absent.
  const { quizMap, isLoading: quizzesLoading } = useQuizzesByIds(quizUuids);

  const quizRows = useMemo(
    () =>
      scheduleRows.map(({ classMeta, schedule }) => {
        const quizUuid = schedule.quiz_uuid as string | undefined;
        const quiz: Quiz | undefined = quizUuid ? quizMap[quizUuid] : undefined;
        const attempts: QuizAttempt[] = [];
        return { classMeta, attempts, quiz, schedule };
      }),
    [quizMap, scheduleRows]
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
    enrollmentsQuery.isLoading || classesLoading || schedulesLoading || quizzesLoading;

  // ─── Render ───────────────────────────────────────────────────────────────

  const header = !embedded && (
    <header className='space-y-1.5'>
      <h1 className='text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>Quizzes</h1>
      <p className='text-muted-foreground max-w-2xl text-sm'>
        Open each scheduled quiz to answer its questions. Your attempt is graded on the server when
        you submit.
      </p>
    </header>
  );

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {header}
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-28 rounded-2xl' />
          ))}
        </div>
        <div className='grid gap-4 xl:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-56 rounded-2xl' />
          ))}
        </div>
      </div>
    );
  }

  const statTiles = [
    { icon: ClipboardList, label: 'Total quizzes', value: stats.total, tone: 'primary' as const },
    { icon: Target, label: 'Attempted', value: stats.attempted, tone: 'primary' as const },
    { icon: Trophy, label: 'Completed', value: stats.completed, tone: 'success' as const },
    { icon: CalendarDays, label: 'Scheduled', value: stats.scheduled, tone: 'warning' as const },
  ];

  return (
    <div className='space-y-6'>
      {header}

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {statTiles.map(tile => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </section>

      <div className='relative max-w-md'>
        <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder='Search quizzes by title, class, or course'
          className='pl-9'
        />
        {searchValue ? (
          <button
            aria-label='Clear search'
            className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition'
            onClick={() => setSearchValue('')}
            type='button'
          >
            <X className='h-4 w-4' />
          </button>
        ) : null}
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState
          variant='card'
          icon={ClipboardList}
          title='No quizzes found'
          description='Scheduled quizzes will appear here once your classes publish them.'
        />
      ) : (
        <div className='grid gap-4 xl:grid-cols-2'>
          {filteredRows.map(row => (
            <StudentQuizCard
              key={row.schedule.uuid}
              classMeta={row.classMeta}
              quiz={row.quiz}
              schedule={row.schedule}
              attempts={row.attempts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
