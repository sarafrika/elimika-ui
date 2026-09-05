'use client';

import { Check } from 'lucide-react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { CourseBlockAsyncProps } from '../types';
import {
  type CourseReaderItem,
  type CourseReaderLesson,
  courseReaderKind,
} from './_reader';

/**
 * The reader's left column — the lesson tree.
 *
 * Twelve lessons as numbered rows; the open one expands into its content items,
 * each a selectable row that drives the pane. Completion ticks and the progress
 * bar are the learner's alone: they are drawn from `showProgress`, which the view
 * derives from the capability map, so nothing in here inspects `access`.
 *
 * A block — props in, markup out. Which lesson is open and which item is showing
 * are the route's state, not this component's, because the pane and the tree have
 * to agree on both.
 */

export interface CourseReaderTreeProps extends CourseBlockAsyncProps {
  lessons?: readonly CourseReaderLesson[];
  /** Header meta, e.g. "12 lessons · 68 items". Either half may be absent. */
  lessonCount?: number;
  itemCount?: number;

  /** The expanded lesson. Its `items` are the only ones the tree ever lists. */
  openLessonUuid?: string;
  /** The item the pane is showing. */
  selectedItemUuid?: string;
  onSelectLesson?: (lesson: CourseReaderLesson) => void;
  onSelectItem?: (item: CourseReaderItem, lesson: CourseReaderLesson) => void;

  /**
   * Completion ticks and the progress bar. True only for the viewer whose
   * progress is actually recorded — the enrolled learner.
   */
  showProgress?: boolean;
  /** 0–100. Rendered only alongside {@link CourseReaderTreeProps.showProgress}. */
  progressPercent?: number;
  /** Lessons finished, for the "7 of 12 lessons" tail. */
  lessonsCompleted?: number;

  className?: string;
}

export function CourseReaderTree({
  lessons,
  lessonCount,
  itemCount,
  openLessonUuid,
  selectedItemUuid,
  onSelectLesson,
  onSelectItem,
  showProgress,
  progressPercent,
  lessonsCompleted,
  loading,
  error,
  onRetry,
  className,
}: CourseReaderTreeProps) {
  const lessonTotal = lessonCount ?? lessons?.length;
  const summary = [
    lessonTotal === undefined
      ? undefined
      : `${formatCount(lessonTotal)} lesson${lessonTotal === 1 ? '' : 's'}`,
    itemCount === undefined ? undefined : `${formatCount(itemCount)} items`,
  ]
    .filter(Boolean)
    .join(' · ');

  const percent = showProgress && progressPercent !== undefined ? clamp(progressPercent) : undefined;
  const progressNote =
    percent === undefined
      ? undefined
      : [
          `${Math.round(percent)}% complete`,
          lessonsCompleted !== undefined && lessonTotal !== undefined
            ? `${formatCount(lessonsCompleted)} of ${formatCount(lessonTotal)} lessons`
            : undefined,
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <div className='border-b px-4 py-3.5'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[13px] font-bold'>Course contents</span>
          {summary ? (
            <span className='text-muted-foreground text-[11.5px]'>{summary}</span>
          ) : null}
        </div>

        {percent === undefined ? null : (
          <div className='mt-2.5'>
            <Progress
              value={percent}
              className='bg-muted h-1.5'
              aria-label='Course progress'
            />
            <div className='text-muted-foreground mt-1.5 text-[11.5px]'>{progressNote}</div>
          </div>
        )}
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!lessons || lessons.length === 0}
        skeleton={<TreeSkeleton />}
        errorTitle='Couldn’t load the contents'
        emptyTitle='No lessons yet'
        emptyDescription='Lessons appear here as soon as the creator publishes them.'
        className='m-2'
      >
        <div className='p-2'>
          {(lessons ?? []).map(lesson => (
            <LessonBranch
              key={lesson.uuid}
              lesson={lesson}
              open={lesson.uuid === openLessonUuid}
              selectedItemUuid={selectedItemUuid}
              showProgress={showProgress}
              onSelectLesson={onSelectLesson}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      </AsyncSection>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pieces
 * ────────────────────────────────────────────────────────────────────────── */

function LessonBranch({
  lesson,
  open,
  selectedItemUuid,
  showProgress,
  onSelectLesson,
  onSelectItem,
}: {
  lesson: CourseReaderLesson;
  open: boolean;
  selectedItemUuid: string | undefined;
  showProgress: boolean | undefined;
  onSelectLesson: ((lesson: CourseReaderLesson) => void) | undefined;
  onSelectItem: ((item: CourseReaderItem, lesson: CourseReaderLesson) => void) | undefined;
}) {
  const items = open ? (lesson.items ?? []) : [];
  // Completion is a learner's fact. Where progress is not recorded there is
  // nothing to tick, so the row reads the same for every other viewer.
  const done = Boolean(showProgress && lesson.completed);
  const panelId = `course-reader-lesson-${lesson.uuid}`;

  return (
    <div>
      <button
        type='button'
        onClick={() => onSelectLesson?.(lesson)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'flex min-h-11 w-full items-center gap-[9px] rounded-[10px] px-2 py-2 text-left transition-colors xl:min-h-0',
          open ? 'bg-primary/10' : 'hover:bg-muted/60'
        )}
      >
        <span
          className={cn(
            'inline-flex size-[22px] flex-none items-center justify-center rounded-[7px] text-[11px] font-bold',
            open
              ? 'bg-primary text-primary-foreground'
              : done
                ? 'bg-success/15 text-success'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {lesson.number}
        </span>

        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[12.5px]',
            open ? 'text-foreground font-bold' : 'text-foreground/80 font-medium'
          )}
        >
          {lesson.title}
        </span>

        {done ? (
          <Check className='text-success size-3.5 flex-none stroke-[2.2]' aria-label='Completed' />
        ) : (
          <span className='flex size-3.5 flex-none items-center justify-center' aria-hidden>
            <span className='bg-muted-foreground/40 size-1.5 rounded-full' />
          </span>
        )}
      </button>

      {open && items.length > 0 ? (
        <div id={panelId} className='border-muted ml-4 border-l pt-0.5 pb-1.5 pl-3.5'>
          {items.map(item => (
            <ItemRow
              key={item.uuid}
              item={item}
              selected={item.uuid === selectedItemUuid}
              onSelect={onSelectItem ? () => onSelectItem(item, lesson) : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ItemRow({
  item,
  selected,
  onSelect,
}: {
  item: CourseReaderItem;
  selected: boolean;
  onSelect: (() => void) | undefined;
}) {
  const kind = courseReaderKind(item.kind);
  const Icon = kind.icon;

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'flex min-h-11 w-full items-center gap-[9px] rounded-[10px] px-[9px] py-[7px] text-left transition-colors xl:min-h-0',
        selected ? 'bg-primary/10' : 'hover:bg-muted/60'
      )}
    >
      <Icon
        className={cn(
          'size-3.5 flex-none stroke-[1.9]',
          selected ? 'text-primary' : 'text-muted-foreground/70'
        )}
        aria-hidden
      />

      <span
        className={cn(
          'min-w-0 flex-1 truncate text-xs',
          selected ? 'text-primary font-bold' : 'text-foreground/80 font-medium'
        )}
      >
        {item.title}
      </span>

      {item.length ? (
        <span className='text-muted-foreground/70 flex-none text-[10.5px]'>{item.length}</span>
      ) : null}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

/** The tree's rows. Matches the six-lesson shape the reader opens with. */
function TreeSkeleton() {
  return (
    <div className='p-2'>
      {[0, 1, 2, 3, 4, 5].map(row => (
        <div key={row} className='flex items-center gap-[9px] px-2 py-2'>
          <Skeleton className='size-[22px] flex-none rounded-[7px]' />
          <Skeleton className='h-3 flex-1' />
          <Skeleton className='size-3.5 flex-none rounded-full' />
        </div>
      ))}
    </div>
  );
}

/** Header included, for a caller skeletoning the whole column. */
export function CourseReaderTreeSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <div className='border-b px-4 py-3.5'>
        <div className='flex items-center justify-between gap-2'>
          <Skeleton className='h-3.5 w-28' />
          <Skeleton className='h-3 w-24' />
        </div>
      </div>
      <TreeSkeleton />
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-KE').format(value);
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
