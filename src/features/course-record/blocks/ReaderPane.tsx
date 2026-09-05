'use client';

import { ArrowLeft, ArrowRight, Bookmark, Check, Play, Share } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { CourseBlockAsyncProps } from '../types';
import {
  type CourseReaderItem,
  type CourseReaderLicenceSetId,
  courseReaderKind,
} from './_reader';

/**
 * The reader's middle column — the content pane.
 *
 * One card, three bodies. Which one renders is decided by the item's `kind`, not
 * by the viewer: a video gets the player frame, a document gets the article, a
 * quiz gets the question cards.
 *
 * ## The answer key
 *
 * A quiz option is marked correct **only** when `answerKey` is true — the
 * creator, a platform admin and approved trainers, never a learner. The view
 * derives that from the capability map's licence set, and this block reads
 * `option.correct` in exactly one place, behind that flag. If the field ever
 * arrives for a learner that is a server bug: withholding it is the server's job
 * as well as this component's.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Bodies
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderVideo {
  /** The paragraph under the frame. */
  description?: string;
  /** 0–100 — how far through the viewer is. */
  progressPercent?: number;
  /** Elapsed, pre-formatted: "04:02". */
  position?: string;
  /** Total, pre-formatted: "18:24". */
  duration?: string;
  /** The right-hand line on the scrubber: "1080p · captions on". */
  quality?: string;
  onPlay?: () => void;
}

/**
 * The article, as blocks. A response that carries markup passes one `html`
 * block; one that carries fields passes the rest.
 */
export type CourseReaderProseBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: readonly string[]; ordered?: boolean }
  /** The tinted pull-out the artboard draws mid-article. */
  | { kind: 'callout'; label: string; text: string }
  /** Pre-sanitised HTML from the content response. */
  | { kind: 'html'; html: string };

export interface CourseReaderQuizOption {
  uuid: string;
  label: string;
  /** Read in one place only, and only when the viewer holds the answer key. */
  correct?: boolean;
}

export interface CourseReaderQuizQuestion {
  uuid: string;
  /** The header line's tail: "single choice", "numeric", "multiple choice". */
  type?: string;
  prompt: string;
  /** Absent for a question with nothing to pick, e.g. a numeric answer. */
  options?: readonly CourseReaderQuizOption[];
}

export interface CourseReaderQuiz {
  questionCount?: number;
  /** Percentage, e.g. 70. */
  passMark?: number;
  /** Percentage of the course grade, e.g. 15. */
  weight?: number;
  questions?: readonly CourseReaderQuizQuestion[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Footer copy
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The line between the two nav links, keyed by the licence the viewer reads
 * under — which is what actually differs. The learner's progress is recorded;
 * a trainer preparing a session records nothing; the creator is looking at their
 * own material rendered as a learner sees it.
 */
export const COURSE_READER_FOOTER_NOTES: Record<CourseReaderLicenceSetId, string> = {
  owner: 'Previewing as a learner would see it',
  admin: 'Reading for moderation · nothing is recorded',
  trainer: 'Preparing to teach · nothing is recorded',
  learner: 'Marking complete as you read',
};

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderPaneProps extends CourseBlockAsyncProps {
  /** What is being read. Absent renders the pane's empty state. */
  item?: CourseReaderItem;
  /** Position within the open lesson, for "Item 3 of 6". */
  position?: number;
  itemTotal?: number;

  /** Whichever body matches `item.kind`. */
  video?: CourseReaderVideo;
  document?: readonly CourseReaderProseBlock[];
  quiz?: CourseReaderQuiz;

  /**
   * Marks the correct quiz option and switches the quiz note to "Answer key
   * visible". Never true for the viewer being assessed.
   */
  answerKey?: boolean;
  /** The diagonal ownership mark. Absent for the creator, who owns the page. */
  watermarkText?: string;
  /** The footer's middle line — see {@link COURSE_READER_FOOTER_NOTES}. */
  footerNote?: string;

  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;

  className?: string;
}

export function CourseReaderPane({
  item,
  position,
  itemTotal,
  video,
  document: prose,
  quiz,
  answerKey,
  watermarkText,
  footerNote,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  onShare,
  onBookmark,
  loading,
  error,
  onRetry,
  className,
}: CourseReaderPaneProps) {
  const kind = courseReaderKind(item?.kind);

  const meta = [
    position === undefined
      ? undefined
      : itemTotal === undefined
        ? `Item ${position}`
        : `Item ${position} of ${itemTotal}`,
    item?.length,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <AsyncSection
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!item}
      skeleton={<CourseReaderPaneSkeleton className={className} />}
      errorTitle='Couldn’t load this item'
      emptyTitle='Nothing selected'
      emptyDescription='Pick an item from the course contents to start reading.'
      className={className}
    >
      <Card className={cn('relative gap-0 overflow-hidden py-0', className)}>
        {watermarkText ? <Watermark text={watermarkText} /> : null}

        {/* ── header ───────────────────────────────────────────────── */}
        <div className='flex items-start justify-between gap-4 px-[22px] pt-[18px] pb-3.5'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <span
                className={cn(
                  'inline-flex h-[22px] items-center rounded-[9px] px-2 text-[11px] font-bold tracking-[0.03em] uppercase',
                  kind.chip
                )}
              >
                {kind.label}
              </span>

              {meta ? (
                <span className='text-muted-foreground text-[11.5px]'>{meta}</span>
              ) : null}

              {item?.required ? (
                <span className='bg-muted text-muted-foreground inline-flex h-[22px] items-center rounded-[9px] px-2 text-[10.5px] font-bold tracking-[0.04em] uppercase'>
                  Required
                </span>
              ) : null}
            </div>

            <h1 className='mt-[9px] text-[23px] leading-[1.25] font-bold tracking-[-0.02em]'>
              {item?.title}
            </h1>
          </div>

          {onShare || onBookmark ? (
            <div className='flex flex-none items-center gap-[7px]'>
              {onShare ? (
                <PaneAction label='Share this item' onClick={onShare}>
                  <Share className='size-[15px]' aria-hidden />
                </PaneAction>
              ) : null}
              {onBookmark ? (
                <PaneAction label='Bookmark this item' onClick={onBookmark}>
                  <Bookmark className='size-[15px]' aria-hidden />
                </PaneAction>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ── body ─────────────────────────────────────────────────── */}
        {item?.kind === 'video' ? <VideoBody video={video} /> : null}
        {item?.kind === 'quiz' ? <QuizBody quiz={quiz} answerKey={answerKey} /> : null}
        {/* Everything that is neither a player nor a quiz reads as an article. */}
        {item && item.kind !== 'video' && item.kind !== 'quiz' ? (
          <DocumentBody blocks={prose} />
        ) : null}

        {/* ── footer ───────────────────────────────────────────────── */}
        <div className='bg-muted mt-4 flex items-center justify-between gap-4 border-t px-[22px] py-4'>
          <PaneNav label={previousLabel} onClick={onPrevious} direction='previous' />
          {footerNote ? (
            <span className='text-muted-foreground hidden text-xs sm:inline'>{footerNote}</span>
          ) : null}
          <PaneNav label={nextLabel} onClick={onNext} direction='next' />
        </div>
      </Card>
    </AsyncSection>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Video
 * ────────────────────────────────────────────────────────────────────────── */

function VideoBody({ video }: { video: CourseReaderVideo | undefined }) {
  const percent = video?.progressPercent === undefined ? 0 : clamp(video.progressPercent);
  const elapsed = [video?.position, video?.duration].filter(Boolean).join(' / ');

  return (
    <div>
      {/*
        The player surface is always dark, in both themes, because it always
        carries white chrome over it. The two steps are the palette's own neutral
        800 and 950 — fixed values, not the surface tokens that follow the theme.
      */}
      <div
        className='relative mx-[22px] h-[220px] overflow-hidden rounded-[14px] sm:h-[300px]'
        style={
          {
            backgroundImage:
              'linear-gradient(135deg, var(--el-neutral-800) 0%, var(--el-neutral-950) 100%)',
          } as CSSProperties
        }
      >
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, rgb(255 255 255 / 0.03) 0 2px, rgb(255 255 255 / 0) 2px 26px)',
          }}
        />

        <div className='absolute inset-0 flex items-center justify-center'>
          {video?.onPlay ? (
            <button
              type='button'
              onClick={video.onPlay}
              aria-label='Play'
              className='inline-flex size-16 items-center justify-center rounded-full border-[1.5px] border-white/50 bg-white/15 transition-colors hover:bg-white/25'
            >
              <Play className='size-[26px] fill-white text-white' aria-hidden />
            </button>
          ) : (
            <span className='inline-flex size-16 items-center justify-center rounded-full border-[1.5px] border-white/50 bg-white/15'>
              <Play className='size-[26px] fill-white text-white' aria-hidden />
            </span>
          )}
        </div>

        <div className='absolute inset-x-0 bottom-0 px-4 py-3.5'>
          <div className='h-1 overflow-hidden rounded-full bg-white/20'>
            <div className='h-full rounded-full bg-white' style={{ width: `${percent}%` }} />
          </div>
          <div className='mt-2 flex items-center justify-between text-[11.5px] text-white/80'>
            <span>{elapsed}</span>
            <span>{video?.quality}</span>
          </div>
        </div>
      </div>

      {video?.description ? (
        <div className='px-[22px] pt-[18px] pb-1'>
          <p className='text-foreground/80 text-sm leading-[1.7]'>{video.description}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Document
 * ────────────────────────────────────────────────────────────────────────── */

function DocumentBody({ blocks }: { blocks: readonly CourseReaderProseBlock[] | undefined }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className='px-[22px] pt-1 pb-1.5'>
        <p className='text-muted-foreground text-sm'>This item has no body yet.</p>
      </div>
    );
  }

  return (
    <div className='max-w-[660px] px-[22px] pt-1 pb-1.5'>
      {blocks.map((block, index) => (
        // Prose blocks have no identity of their own; position is the key.
        <ProseBlock key={`${block.kind}-${index}`} block={block} />
      ))}
    </div>
  );
}

const PROSE_PARAGRAPH = 'mb-3.5 text-[15px] leading-[1.75] text-foreground/90';

function ProseBlock({ block }: { block: CourseReaderProseBlock }) {
  if (block.kind === 'heading') {
    return (
      <h2 className='mt-[22px] mb-2 text-[17px] font-bold tracking-[-0.01em]'>{block.text}</h2>
    );
  }

  if (block.kind === 'list') {
    const items = block.items.map((text, index) => (
      // Same as the blocks themselves: a list line is identified by its place.
      <li key={`${index}-${text.slice(0, 24)}`}>{text}</li>
    ));
    const className = 'mb-3.5 pl-5 text-[15px] leading-[1.85] text-foreground/90';
    return block.ordered === false ? (
      <ul className={cn(className, 'list-disc')}>{items}</ul>
    ) : (
      <ol className={cn(className, 'list-decimal')}>{items}</ol>
    );
  }

  if (block.kind === 'callout') {
    return (
      <div className='border-primary bg-primary/10 mb-4 rounded-r-xl border-l-[3px] px-4 py-[13px]'>
        <div className='text-primary text-xs font-bold tracking-[0.04em] uppercase'>
          {block.label}
        </div>
        <p className='text-foreground/90 mt-1.5 text-sm leading-[1.6]'>{block.text}</p>
      </div>
    );
  }

  if (block.kind === 'html') {
    return (
      // The response's own markup, styled by descendant selectors so it reads
      // like the transcribed article above without a typography plugin.
      <div
        className={cn(
          'text-foreground/90 text-[15px] leading-[1.75]',
          '[&_p]:mb-3.5 [&_h2]:mt-[22px] [&_h2]:mb-2 [&_h2]:text-[17px] [&_h2]:font-bold',
          '[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-[15px] [&_h3]:font-bold',
          '[&_ol]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-5',
          '[&_a]:text-primary [&_a]:underline [&_b]:font-bold [&_strong]:font-bold',
          '[&_img]:my-3 [&_img]:rounded-lg'
        )}
        // The content endpoint returns sanitised lesson markup.
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    );
  }

  return <p className={PROSE_PARAGRAPH}>{block.text}</p>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Quiz
 * ────────────────────────────────────────────────────────────────────────── */

function QuizBody({
  quiz,
  answerKey,
}: {
  quiz: CourseReaderQuiz | undefined;
  answerKey: boolean | undefined;
}) {
  const questions = quiz?.questions ?? [];
  const chips = [
    quiz?.questionCount === undefined
      ? undefined
      : `${quiz.questionCount} question${quiz.questionCount === 1 ? '' : 's'}`,
    quiz?.passMark === undefined ? undefined : `Pass mark ${quiz.passMark}%`,
    quiz?.weight === undefined ? undefined : `Weight ${quiz.weight}%`,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className='px-[22px] pt-1 pb-1.5'>
      <div className='mb-4 flex flex-wrap gap-2.5'>
        {chips.map(chip => (
          <span
            key={chip}
            className='text-foreground/80 inline-flex h-[26px] items-center rounded-[10px] border px-2.5 text-xs'
          >
            {chip}
          </span>
        ))}
        <span className='bg-primary/10 text-primary inline-flex h-[26px] items-center rounded-[10px] px-2.5 text-xs font-semibold'>
          {/* The one difference the key makes to the chrome. */}
          {answerKey ? 'Answer key visible' : 'Attempt available'}
        </span>
      </div>

      {questions.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          This quiz has no questions published yet.
        </p>
      ) : (
        questions.map((question, index) => (
          <QuestionCard
            key={question.uuid}
            question={question}
            number={index + 1}
            answerKey={answerKey}
          />
        ))
      )}
    </div>
  );
}

function QuestionCard({
  question,
  number,
  answerKey,
}: {
  question: CourseReaderQuizQuestion;
  number: number;
  answerKey: boolean | undefined;
}) {
  const options = question.options ?? [];

  return (
    <div
      className={cn(
        'mb-3 rounded-[14px] border px-[18px] py-4',
        // A question with nothing to pick — a numeric or free-text answer —
        // recedes, exactly as the artboard draws its second card.
        options.length === 0 && 'opacity-[.62]'
      )}
    >
      <div className='text-muted-foreground text-xs font-bold'>
        {[`Question ${number}`, question.type].filter(Boolean).join(' · ')}
      </div>

      <div className='mt-[7px] text-[15px] leading-[1.5] font-semibold'>{question.prompt}</div>

      {options.length > 0 ? (
        <div className='mt-3 flex flex-col gap-2'>
          {options.map(option => {
            // The single place `correct` is read, and only behind the key.
            const marked = Boolean(answerKey && option.correct);
            return (
              <div
                key={option.uuid}
                className={cn(
                  'flex items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-[13.5px]',
                  marked
                    ? 'border-success bg-success/10 text-foreground border-[1.5px] font-semibold'
                    : 'text-foreground/80 border'
                )}
              >
                {marked ? (
                  <span className='bg-success inline-flex size-[15px] flex-none items-center justify-center rounded-full'>
                    <Check className='size-[9px] stroke-[4] text-white' aria-hidden />
                  </span>
                ) : (
                  <span
                    className='border-muted-foreground/40 size-[15px] flex-none rounded-full border-[1.5px]'
                    aria-hidden
                  />
                )}
                {option.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pieces
 * ────────────────────────────────────────────────────────────────────────── */

function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-0 z-[2] grid grid-cols-3 grid-rows-4 place-items-center overflow-hidden select-none'
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(mark => (
        <span
          key={mark}
          className='text-foreground/5 rotate-[-24deg] text-[13px] font-bold tracking-[0.09em] whitespace-nowrap'
        >
          {text}
        </span>
      ))}
    </div>
  );
}

function PaneAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
      className='text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-11 items-center justify-center rounded-[10px] border transition-colors xl:size-8'
    >
      {children}
    </button>
  );
}

function PaneNav({
  label,
  onClick,
  direction,
}: {
  label: string | undefined;
  onClick: (() => void) | undefined;
  direction: 'previous' | 'next';
}) {
  if (!label) return <span />;

  const next = direction === 'next';
  const content = (
    <>
      {next ? null : <ArrowLeft className='size-[15px] flex-none' aria-hidden />}
      <span className='truncate'>{label}</span>
      {next ? <ArrowRight className='size-[15px] flex-none' aria-hidden /> : null}
    </>
  );
  const className = cn(
    'inline-flex min-w-0 items-center gap-2 text-sm',
    next ? 'text-primary font-semibold' : 'text-foreground/80'
  );

  return onClick ? (
    <button type='button' onClick={onClick} className={cn(className, 'hover:underline')}>
      {content}
    </button>
  ) : (
    <span className={className}>{content}</span>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeleton
 * ────────────────────────────────────────────────────────────────────────── */

export function CourseReaderPaneSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <div className='px-[22px] pt-[18px] pb-3.5'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-[22px] w-16 rounded-[9px]' />
          <Skeleton className='h-3 w-28' />
        </div>
        <Skeleton className='mt-3 h-6 w-3/5' />
      </div>
      <div className='mx-[22px] h-[220px] rounded-[14px]'>
        <Skeleton className='size-full rounded-[14px]' />
      </div>
      <div className='space-y-2 px-[22px] pt-[18px] pb-1'>
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-11/12' />
        <Skeleton className='h-3 w-4/5' />
      </div>
      <div className='bg-muted mt-4 flex items-center justify-between gap-4 border-t px-[22px] py-4'>
        <Skeleton className='h-3.5 w-32' />
        <Skeleton className='h-3 w-40' />
        <Skeleton className='h-3.5 w-32' />
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
