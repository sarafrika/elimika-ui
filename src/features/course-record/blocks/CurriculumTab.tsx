'use client';

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Eye,
  FileText,
  Link as LinkIcon,
  Lock,
  Mic,
  Video,
} from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  type CourseAccess,
  type CourseBlockAsyncProps,
  type CourseContentLevel,
  courseCapability,
} from '../types';

/**
 * The curriculum tab — the lesson accordion.
 *
 * ## The lock is in the data, not in the CSS
 *
 * When the viewer's capability row says the content level is anything but
 * `full`, the API does not transmit the content items at all: an
 * `OrganisationCourseLesson` comes back with `content_count` and no `contents`.
 * This block renders the locked notice **instead of** the item list and never
 * reads `lesson.items` in that branch, so there is nothing in the DOM to unhide
 * and nothing in the payload to read out of the network tab. If items are ever
 * present alongside a gated access level, that is a server bug, not something to
 * paper over here.
 *
 * A block: props in, markup out. Expand/collapse is local UI state, not data.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Content items
 * ────────────────────────────────────────────────────────────────────────── */

export const COURSE_CONTENT_KINDS = ['video', 'document', 'quiz', 'audio', 'link'] as const;

export type CourseContentKind = (typeof COURSE_CONTENT_KINDS)[number];

interface ContentKindStyle {
  label: string;
  /** Tint of the 32px icon box. Content-type tints are the one sanctioned use of `chart-*`. */
  box: string;
  icon: ReactNode;
}

const CONTENT_KINDS: Record<CourseContentKind, ContentKindStyle> = {
  video: {
    label: 'Video',
    box: 'bg-chart-2/15 text-chart-2',
    icon: <Video className='size-4' />,
  },
  document: {
    label: 'Document',
    box: 'bg-[var(--info)]/10 text-[var(--info)]',
    icon: <FileText className='size-4' />,
  },
  quiz: {
    label: 'Quiz',
    box: 'bg-chart-3/20 text-chart-3',
    icon: <CircleHelp className='size-4' />,
  },
  audio: {
    label: 'Audio',
    box: 'bg-chart-4/15 text-chart-4',
    icon: <Mic className='size-4' />,
  },
  link: {
    label: 'Link',
    box: 'bg-muted text-muted-foreground',
    icon: <LinkIcon className='size-4' />,
  },
};

/**
 * Normalise whatever the API calls a content type — `content_category`, a MIME
 * type, a content-type name — into one of the five kinds the tab draws.
 * Anything unrecognised reads as a document, which is what the artboard's own
 * fallback does.
 */
export function courseContentKind(value: string | undefined | null): CourseContentKind {
  const token = (value ?? '').toLowerCase();
  if (!token) return 'document';
  if (/video|mp4|webm|mov|screencast|recording/.test(token)) return 'video';
  if (/audio|mp3|wav|podcast|voice/.test(token)) return 'audio';
  if (/quiz|assessment|question|exam|test/.test(token)) return 'quiz';
  if (/link|url|external|resource/.test(token)) return 'link';
  return 'document';
}

/* ────────────────────────────────────────────────────────────────────────────
 * View models
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseCurriculumItem {
  /** Stable key. Falls back to the index when the API withholds the uuid. */
  uuid?: string;
  title: string;
  kind: CourseContentKind;
  /** Renders the "Required" chip. */
  required?: boolean;
}

export interface CourseCurriculumLesson {
  /** Position in the course, shown in the gradient square. */
  number: number;
  title: string;
  /** The one-line objective under the title. */
  objective?: string;
  /** Shown in the header row and in the locked notice. */
  itemCount?: number;
  /** Pre-formatted, e.g. "3h 10m". */
  duration?: string;
  /**
   * The content items. **Absent whenever the viewer's access is gated** — the
   * response does not carry them, and this block does not ask for them.
   */
  items?: readonly CourseCurriculumItem[];
}

/** The locked notice's tail, per content level. `full` is never locked. */
const LOCKED_NOTE: Record<Exclude<CourseContentLevel, 'full'>, string> = {
  outline: 'locked until your training application is approved.',
  syllabus: 'locked until your enrolment is confirmed.',
};

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface CurriculumTabProps extends CourseBlockAsyncProps {
  /** From the API. Decides the badge, the lock and the read-only note. */
  access: CourseAccess;
  lessons?: readonly CourseCurriculumLesson[];
  /** Header chip. Defaults to `lessons.length`. */
  lessonCount?: number;
  /** Header chip. The capability map's `content.countNote` is appended to it. */
  contentItemCount?: number;
  /** Lessons open on first render. Everything is collapsed by default. */
  defaultOpen?: readonly number[];
  /** Wires the per-item "Read" action. Omitted, the action renders inert. */
  onReadItem?: (item: CourseCurriculumItem, lesson: CourseCurriculumLesson) => void;
  className?: string;
}

export function CurriculumTab({
  access,
  lessons,
  lessonCount,
  contentItemCount,
  defaultOpen,
  onReadItem,
  loading,
  error,
  onRetry,
  className,
}: CurriculumTabProps) {
  const capability = courseCapability(access);
  const { level, badge, countNote, readonlyNote } = capability.content;
  const lockedNote = level === 'full' ? undefined : LOCKED_NOTE[level];
  const locked = lockedNote !== undefined;
  // Only the pending applicant's chrome is amber; every other state is
  // brand-hued, and the gate tone is what the capability map distinguishes them by.
  const warnTone = capability.gate?.tone === 'warning';
  // The creator is the one viewer who can change this content; everyone else,
  // admins included, reads it in place.
  const viewOnly = !capability.canEdit;

  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set(defaultOpen ?? []));

  const toggle = useCallback((number: number) => {
    setOpen(current => {
      const next = new Set(current);
      if (!next.delete(number)) next.add(number);
      return next;
    });
  }, []);

  const allNumbers = useMemo(() => (lessons ?? []).map(lesson => lesson.number), [lessons]);
  const expandAll = useCallback(() => setOpen(new Set(allNumbers)), [allNumbers]);
  const collapseAll = useCallback(() => setOpen(new Set<number>()), []);

  const shownLessonCount = lessonCount ?? lessons?.length;
  const itemsLabel =
    contentItemCount === undefined
      ? undefined
      : countNote
        ? `${formatCount(contentItemCount)} (${countNote})`
        : formatCount(contentItemCount);
  const summary = [
    shownLessonCount === undefined
      ? undefined
      : `${formatCount(shownLessonCount)} lesson${shownLessonCount === 1 ? '' : 's'}`,
    itemsLabel === undefined ? undefined : `${itemsLabel} items`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={cn('min-w-0', className)}>
      {/* ── chips + expand controls ─────────────────────────────────── */}
      <div className='mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
        <div className='flex flex-wrap items-center gap-2'>
          {summary ? (
            <Chip>
              <BookOpen className='size-[13px]' aria-hidden />
              {summary}
            </Chip>
          ) : null}

          <Chip
            className={cn(
              'font-semibold',
              warnTone
                ? 'border-warning/35 bg-warning/10 text-warning'
                : 'border-primary/30 bg-primary/10 text-primary'
            )}
          >
            {badge}
          </Chip>

          {viewOnly ? (
            <Chip className='text-muted-foreground'>
              <Lock className='size-[13px]' aria-hidden />
              View-only · no download
            </Chip>
          ) : null}
        </div>

        <div className='flex items-center gap-1'>
          <ExpandButton onClick={expandAll} disabled={allNumbers.length === 0}>
            Expand all
          </ExpandButton>
          <ExpandButton onClick={collapseAll} disabled={allNumbers.length === 0}>
            Collapse all
          </ExpandButton>
        </div>
      </div>

      {/* ── lessons ─────────────────────────────────────────────────── */}
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!lessons || lessons.length === 0}
        skeleton={<CurriculumListSkeleton />}
        errorTitle='Couldn’t load the curriculum'
        emptyTitle='No lessons yet'
        emptyDescription='Lessons appear here as soon as the creator publishes them.'
      >
        <div className='flex flex-col gap-2.5'>
          {(lessons ?? []).map(lesson => (
            <LessonRow
              key={lesson.number}
              lesson={lesson}
              open={open.has(lesson.number)}
              locked={locked}
              lockedNote={lockedNote}
              onToggle={toggle}
              onReadItem={onReadItem}
            />
          ))}
        </div>
      </AsyncSection>

      {/* ── read-only footer ────────────────────────────────────────── */}
      <p className='text-muted-foreground mt-3 flex items-center gap-[7px] text-xs'>
        <Lock className='size-3.5 flex-none' aria-hidden />
        {readonlyNote}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pieces
 * ────────────────────────────────────────────────────────────────────────── */

function LessonRow({
  lesson,
  open,
  locked,
  lockedNote,
  onToggle,
  onReadItem,
}: {
  lesson: CourseCurriculumLesson;
  open: boolean;
  locked: boolean;
  lockedNote: string | undefined;
  onToggle: (number: number) => void;
  onReadItem?: (item: CourseCurriculumItem, lesson: CourseCurriculumLesson) => void;
}) {
  const panelId = `course-lesson-${lesson.number}`;
  const items = lesson.items ?? [];
  const count = lesson.itemCount ?? items.length;
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className='bg-card overflow-hidden rounded-xl border shadow-sm'>
      <button
        type='button'
        onClick={() => onToggle(lesson.number)}
        aria-expanded={open}
        aria-controls={panelId}
        className='hover:bg-muted/40 flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors'
      >
        <span
          className='inline-flex size-[38px] flex-none items-center justify-center rounded-lg text-[13px] font-bold text-white'
          style={{
            /* The two brand steps the artboard calls b600 and b800, mixed from
               --primary so every dashboard domain re-hues them for free. */
            backgroundImage:
              'linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 55%, black) 100%)',
          }}
        >
          {lesson.number}
        </span>

        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-semibold tracking-[-0.005em]'>{lesson.title}</span>
          {lesson.objective ? (
            <span className='text-muted-foreground mt-0.5 block truncate text-xs'>
              {lesson.objective}
            </span>
          ) : null}
        </span>

        <span className='text-muted-foreground flex flex-none items-center gap-2.5 text-xs'>
          {count > 0 ? <span className='hidden sm:inline'>{count} items</span> : null}
          {lesson.duration ? <span>{lesson.duration}</span> : null}
          <Chevron className='text-muted-foreground/70 size-4' aria-hidden />
        </span>
      </button>

      {open ? (
        <div id={panelId} className='border-t'>
          {locked ? (
            <div className='border-border/70 bg-muted text-muted-foreground m-2.5 flex items-center gap-2.5 rounded-lg border border-dashed px-3.5 py-3 text-xs'>
              <Lock className='size-[15px] flex-none' aria-hidden />
              <span>
                <b className='text-foreground/80 font-semibold'>{count} content items</b>
                {lockedNote ? ` — ${lockedNote}` : null}
              </span>
            </div>
          ) : (
            <div className='p-2'>
              {items.map((item, index) => (
                <ContentRow
                  key={item.uuid ?? `${lesson.number}-${index}`}
                  item={item}
                  onRead={onReadItem ? () => onReadItem(item, lesson) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ContentRow({
  item,
  onRead,
}: {
  item: CourseCurriculumItem;
  onRead?: () => void;
}) {
  const kind = CONTENT_KINDS[item.kind] ?? CONTENT_KINDS.document;

  return (
    <div className='hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2.5 py-[9px] transition-colors'>
      <span
        className={cn(
          'inline-flex size-8 flex-none items-center justify-center rounded-[10px]',
          kind.box
        )}
        aria-hidden
      >
        {kind.icon}
      </span>

      <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>{item.title}</span>

      {item.required ? (
        <span className='bg-muted text-muted-foreground flex-none rounded-[8px] px-[7px] py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase'>
          Required
        </span>
      ) : null}

      <span className='text-muted-foreground hidden w-[74px] flex-none text-right text-xs sm:block'>
        {kind.label}
      </span>

      {onRead ? (
        <button
          type='button'
          onClick={onRead}
          className='hover:bg-muted text-foreground inline-flex h-11 flex-none items-center gap-1.5 rounded-[9px] border px-2.5 text-xs font-semibold transition-colors sm:h-7'
        >
          <Eye className='size-[13px]' aria-hidden />
          Read
        </button>
      ) : (
        <span className='text-muted-foreground inline-flex h-7 flex-none items-center gap-1.5 rounded-[9px] border px-2.5 text-xs font-semibold'>
          <Eye className='size-[13px]' aria-hidden />
          Read
        </span>
      )}
    </div>
  );
}

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-foreground/80 inline-flex h-[26px] items-center gap-1.5 rounded-[10px] border px-2.5 text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  );
}

function ExpandButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className='text-muted-foreground hover:text-foreground rounded-[10px] px-2.5 py-1.5 text-[13px] transition-colors disabled:opacity-50'
    >
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

export function CurriculumTabSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-[26px] w-36 rounded-[10px]' />
          <Skeleton className='h-[26px] w-28 rounded-[10px]' />
        </div>
        <Skeleton className='h-[26px] w-40 rounded-[10px]' />
      </div>
      <CurriculumListSkeleton />
      <Skeleton className='mt-3 h-3 w-72' />
    </div>
  );
}

function CurriculumListSkeleton() {
  return (
    <div className='flex flex-col gap-2.5'>
      {[0, 1, 2, 3, 4].map(row => (
        <div key={row} className='bg-card rounded-xl border px-4 py-3.5 shadow-sm'>
          <div className='flex items-center gap-3.5'>
            <Skeleton className='size-[38px] flex-none rounded-lg' />
            <div className='min-w-0 flex-1 space-y-1.5'>
              <Skeleton className='h-3.5 w-2/5' />
              <Skeleton className='h-3 w-3/5' />
            </div>
            <Skeleton className='h-3 w-24 flex-none' />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-KE').format(value);
}
