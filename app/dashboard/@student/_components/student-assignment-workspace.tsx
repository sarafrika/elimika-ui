// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudent } from '@/context/student-context';
import { cn } from '@/lib/utils';
import {
  getDueSummary,
  getStudentAssignmentSubmissionState,
  useStudentAssignmentData,
  type StudentAssignmentFilterTab,
  type StudentAssignmentRow,
} from '@/src/features/dashboard/student-assessment/useStudentAssignmentData';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  Layers,
  Search,
  SearchX,
  Send,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type FilterTab = StudentAssignmentFilterTab;
type SortKey = 'due' | 'course' | 'title';

// ── Exported helpers (also consumed by assignment/[id]/page.tsx) ──────────────

function normalizeAttachmentSize(value?: bigint | number) {
  return typeof value === 'bigint' ? Number(value) : value;
}

export function toAttachmentResourceItems<T extends { file_size_bytes?: bigint | number }>(
  attachments: T[]
) {
  return attachments.map(attachment => ({
    ...attachment,
    file_size_bytes: normalizeAttachmentSize(attachment.file_size_bytes),
  }));
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function formatDate(value?: string | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (value === null || value === undefined || value === '') return 'No deadline';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  const resolvedOptions: Intl.DateTimeFormatOptions = options ?? {
    dateStyle: 'medium',
    timeStyle: 'short',
  };
  return new Intl.DateTimeFormat('en-US', resolvedOptions).format(date);
}

function getGradeTone(percentage?: number | null) {
  if (percentage == null) return 'text-muted-foreground';
  if (percentage >= 80) return 'text-success';
  if (percentage >= 60) return 'text-primary';
  if (percentage >= 40) return 'text-warning';
  return 'text-destructive';
}

/** Colored accent bar + icon-chip tone keyed off the submission lifecycle + urgency. */
function getStatusTone(stateKey: string, dueTone: string) {
  if (stateKey === 'graded') return { accent: 'bg-success', chip: 'bg-success/10 text-success' };
  if (stateKey === 'returned') return { accent: 'bg-warning', chip: 'bg-warning/10 text-warning' };
  if (stateKey === 'submitted') return { accent: 'bg-primary', chip: 'bg-primary/10 text-primary' };
  // pending — escalate with the deadline
  if (dueTone === 'danger') return { accent: 'bg-destructive', chip: 'bg-destructive/10 text-destructive' };
  if (dueTone === 'warning') return { accent: 'bg-warning', chip: 'bg-warning/10 text-warning' };
  return { accent: 'bg-primary', chip: 'bg-primary/10 text-primary' };
}

// ── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  helper,
  tone = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  helper: string;
  tone?: 'primary' | 'success' | 'warning';
}) {
  const chip =
    tone === 'success'
      ? 'bg-success/10 text-success'
      : tone === 'warning'
        ? 'bg-warning/10 text-warning'
        : 'bg-primary/10 text-primary';

  return (
    <div className='rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md'>
      <div className='flex items-center gap-4'>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', chip)}>
          <Icon className='h-5 w-5' />
        </div>
        <div className='min-w-0'>
          <p className='text-sm text-muted-foreground'>{label}</p>
          <p className='text-2xl font-bold tracking-tight text-foreground'>{value}</p>
          <p className='truncate text-xs text-muted-foreground'>{helper}</p>
        </div>
      </div>
    </div>
  );
}

// ── Assignment card ───────────────────────────────────────────────────────────

function StudentAssignmentCard({
  row,
  state,
  due,
}: {
  row: StudentAssignmentRow;
  state: ReturnType<typeof getStudentAssignmentSubmissionState>;
  due: ReturnType<typeof getDueSummary>;
}) {
  const tone = getStatusTone(state.key, due.tone);
  const hasSubmission = Boolean(row.latestSubmission);
  const percentage = row.latestSubmission?.percentage;
  const dueValue = row.schedule?.due_at ?? row.assignment?.due_date;
  const showDueBadge = !['submitted', 'graded'].includes(state.key);

  const stat = (label: string, value: React.ReactNode, valueClass?: string) => (
    <div className='flex flex-col gap-0.5 px-3 py-2'>
      <span className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </span>
      <span className={cn('text-sm font-semibold text-foreground', valueClass)}>{value}</span>
    </div>
  );

  return (
    <article className='group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md'>
      <div className={cn('absolute inset-x-0 top-0 h-1', tone.accent)} />

      <div className='flex h-full flex-col gap-5 p-5 sm:p-6'>
        {/* Header */}
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-3'>
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tone.chip)}>
              <FileText className='h-5 w-5' />
            </div>
            <div className='min-w-0 space-y-1'>
              <p className='truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                {row.classMeta.courseTitle}
              </p>
              <h3 className='text-base font-semibold leading-snug text-foreground sm:text-lg'>
                <span className='line-clamp-2'>{row.assignment?.title || 'Untitled assignment'}</span>
              </h3>
              <p className='flex items-center gap-1.5 truncate text-xs text-muted-foreground'>
                <CalendarDays className='h-3.5 w-3.5 shrink-0' />
                {row.classMeta.classTitle} · Due {formatDate(dueValue)}
              </p>
            </div>
          </div>

          <Badge variant={state.variant} className='shrink-0'>
            {state.label}
          </Badge>
        </div>

        {/* Description preview */}
        {row.assignment?.description ? (
          <div className='line-clamp-2 text-sm leading-relaxed text-muted-foreground [&_p]:leading-relaxed'>
            <RichTextRenderer htmlString={row.assignment.description} maxChars={160} />
          </div>
        ) : null}

        {/* Meta grid */}
        <div className='grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-background/60'>
          {stat('Points', row.assignment?.points_display || row.assignment?.max_points || '—')}
          {stat('Resources', row.attachments.length)}
          {stat(
            'Score',
            percentage == null ? 'Pending' : `${Math.round(percentage)}%`,
            getGradeTone(percentage)
          )}
        </div>

        {/* Footer */}
        <div className='mt-auto flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0 space-y-0.5'>
            <p className='text-sm font-medium text-foreground'>{state.helper}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {hasSubmission
                ? row.latestSubmission?.submitted_at
                  ? `Submitted ${formatDate(row.latestSubmission.submitted_at)}`
                  : 'Submission available for review'
                : showDueBadge
                  ? due.label
                  : 'Awaiting your submission'}
            </p>
          </div>

          <Button asChild size='sm' className='shrink-0'>
            <Link
              href={`/dashboard/assignment/${row.assignment?.uuid}`}
              className='flex items-center gap-2'
            >
              {hasSubmission ? 'Open submission' : 'Submit assignment'}
              <ArrowRight className='h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

// ── Workspace ───────────────────────────────────────────────────────────────

export function StudentAssignmentWorkspace({ embedded = false }: { embedded?: boolean } = {}) {
  const student = useStudent();

  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('due');

  const { assignmentRows, isLoading } = useStudentAssignmentData();

  // Decorate every schedule row once with its lifecycle state + due urgency.
  const decorated = useMemo(
    () =>
      assignmentRows.map(row => ({
        row,
        state: getStudentAssignmentSubmissionState(row),
        due: getDueSummary(row.schedule?.due_at ?? row.assignment?.due_date),
      })),
    [assignmentRows]
  );

  const stats = useMemo(() => {
    const total = decorated.length;
    let pending = 0;
    let submitted = 0;
    let graded = 0;
    let returned = 0;
    const percentages: number[] = [];

    for (const { row, state } of decorated) {
      if (state.key === 'pending') pending += 1;
      else if (state.key === 'submitted') submitted += 1;
      else if (state.key === 'graded') graded += 1;
      else if (state.key === 'returned') returned += 1;

      if (typeof row.latestSubmission?.percentage === 'number') {
        percentages.push(row.latestSubmission.percentage);
      }
    }

    const averageScore = percentages.length
      ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
      : 0;
    const withSubmission = total - pending;
    const progress = total > 0 ? Math.round((withSubmission / total) * 100) : 0;

    return { total, pending, submitted, graded, returned, averageScore, progress };
  }, [decorated]);

  const processedRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return decorated
      .filter(({ row, state }) => {
        const matchesTab = activeTab === 'all' ? true : state.key === activeTab;
        const matchesSearch =
          !query ||
          [row.assignment?.title, row.assignment?.description, row.classMeta.courseTitle, row.classMeta.classTitle]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(query));
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'course') {
          return (a.row.classMeta.courseTitle || '').localeCompare(b.row.classMeta.courseTitle || '');
        }
        if (sortBy === 'title') {
          return (a.row.assignment?.title || '').localeCompare(b.row.assignment?.title || '');
        }
        const ad = a.row.schedule?.due_at ?? a.row.assignment?.due_date;
        const bd = b.row.schedule?.due_at ?? b.row.assignment?.due_date;
        const at = ad ? new Date(ad).getTime() : Number.POSITIVE_INFINITY;
        const bt = bd ? new Date(bd).getTime() : Number.POSITIVE_INFINITY;
        return at - bt;
      });
  }, [decorated, activeTab, searchValue, sortBy]);

  // ── Guard states ─────────────────────────────────────────────────────────

  if (!student?.uuid) {
    return (
      <EmptyState
        variant='card'
        icon={UserRound}
        title='Student profile required'
        description='Assignments become available once a student profile is active on this account.'
      />
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {!embedded && <Skeleton className='h-16 w-full max-w-md rounded-lg' />}
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-28 rounded-2xl' />
          ))}
        </div>
        <Skeleton className='h-28 rounded-2xl' />
        <div className='grid gap-4 lg:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-56 rounded-2xl' />
          ))}
        </div>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <EmptyState
        variant='card'
        icon={BookOpen}
        title='No assignments yet'
        description='Assignments will appear here once your enrolled classes publish assessment schedules.'
      />
    );
  }

  const statTiles = [
    { icon: Layers, label: 'Assignments', value: stats.total, helper: 'Across your classes', tone: 'primary' as const },
    { icon: Clock3, label: 'Pending', value: stats.pending, helper: 'Awaiting your work', tone: 'warning' as const },
    { icon: Send, label: 'Awaiting grade', value: stats.submitted + stats.returned, helper: 'Submitted or returned', tone: 'primary' as const },
    { icon: GraduationCap, label: 'Average score', value: `${stats.averageScore}%`, helper: stats.graded > 0 ? 'From graded work' : 'No graded work yet', tone: 'success' as const },
  ];

  const filterTabs: { value: FilterTab; label: string; count: number }[] = [
    { value: 'pending', label: 'Pending', count: stats.pending },
    { value: 'submitted', label: 'Submitted', count: stats.submitted },
    { value: 'graded', label: 'Graded', count: stats.graded },
    { value: 'returned', label: 'Returned', count: stats.returned },
    { value: 'all', label: 'All', count: stats.total },
  ];

  return (
    <div className='space-y-6'>
      {!embedded && (
        <header className='space-y-1.5'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
            Assignments
          </h1>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Review coursework, upload your submissions, and track grading feedback from your
            instructors.
          </p>
        </header>
      )}

      {/* Stat tiles */}
      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {statTiles.map(tile => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </section>

      {/* Progress + toolbar */}
      <section className='space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='min-w-0 space-y-1'>
            <div className='flex items-center gap-2'>
              <ClipboardCheck className='h-4 w-4 text-primary' />
              <p className='text-sm font-semibold text-foreground'>
                {stats.progress}% of assigned work has a submission
              </p>
            </div>
            <Progress value={stats.progress} className='h-2 w-full max-w-md' />
          </div>

          <div className='flex w-full min-w-0 flex-col gap-3 lg:w-auto lg:flex-row lg:items-center'>
            <div className='relative min-w-0 flex-1 lg:w-72'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                className='w-full pl-9 text-sm'
                onChange={event => setSearchValue(event.target.value)}
                placeholder='Search assignments'
                value={searchValue}
              />
              {searchValue ? (
                <button
                  aria-label='Clear search'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground'
                  onClick={() => setSearchValue('')}
                  type='button'
                >
                  <X className='h-4 w-4' />
                </button>
              ) : null}
            </div>

            <Tabs onValueChange={value => setSortBy(value as SortKey)} value={sortBy}>
              <TabsList className='grid w-full grid-cols-3 lg:w-[220px]'>
                <TabsTrigger value='due'>Due</TabsTrigger>
                <TabsTrigger value='course'>Course</TabsTrigger>
                <TabsTrigger value='title'>Title</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Tabs onValueChange={value => setActiveTab(value as FilterTab)} value={activeTab}>
          <div className='overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent'>
            <TabsList className='inline-flex min-w-max gap-1'>
              {filterTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className='gap-1.5'>
                  {tab.label}
                  <span className='rounded-full bg-muted-foreground/15 px-1.5 text-[11px] font-semibold text-muted-foreground'>
                    {tab.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </section>

      {/* Card grid */}
      {processedRows.length === 0 ? (
        <EmptyState
          variant='card'
          icon={SearchX}
          title='No assignments match this filter'
          description='Adjust the active tab or search term to review your pending and completed work.'
        />
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {processedRows.map(({ row, state, due }) => (
            <StudentAssignmentCard
              key={`${row.classMeta.classUuid}-${row.schedule?.uuid ?? row.assignment?.uuid}`}
              row={row}
              state={state}
              due={due}
            />
          ))}
        </div>
      )}
    </div>
  );
}
