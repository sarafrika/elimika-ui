import { BookOpen, Clock, GraduationCap, Layers, Star, Users } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { CourseBlockAsyncProps } from '../types';

/**
 * The hero band and the four-cell stat strip beneath it — one card, as the
 * artboard draws it.
 *
 * A block: it takes props and renders. The gradient is built from `--primary`
 * and a darker step mixed from it, so the same component reads as purple on the
 * course-creator dashboard and teal on the organisation one without a single
 * hex in this file.
 */

export interface CourseHeroProps extends CourseBlockAsyncProps {
  title?: string;
  /**
   * The short blurb under the title — two lines, always. It is a summary, not the
   * description: the full text renders in the Overview tab's "About this course".
   * Unclamping it on wide screens let a long description fill the whole hero.
   */
  summary?: string;
  /** First chip is filled; the rest are outlined, as in the artboard. */
  categories?: readonly string[];
  /** Lifecycle status — rendered capitalised, e.g. "published". */
  status?: string;
  creatorName?: string;
  /** Line under the creator's name. */
  creatorRole?: string;
  /** 1–5. Hidden together with the review count when there are no reviews. */
  averageRating?: number;
  totalReviews?: number;
  enrolledCount?: number;

  /* — stat strip — */
  lessonCount?: number;
  contentItemCount?: number;
  /**
   * Parenthetical from the capability map's `content.countNote`, e.g. `locked`.
   * Renders as "68 (locked)" so the count is honest about what is readable.
   */
  contentCountNote?: string;
  /** Pre-formatted, e.g. "42h 30m". */
  duration?: string;
  /** Difficulty label, e.g. "Intermediate". */
  level?: string;

  className?: string;
}

const PLACEHOLDER = '—';

export function CourseHero({
  title,
  summary,
  categories,
  status,
  creatorName,
  creatorRole = 'Course creator',
  averageRating,
  totalReviews,
  enrolledCount,
  lessonCount,
  contentItemCount,
  contentCountNote,
  duration,
  level,
  loading,
  error,
  onRetry,
  className,
}: CourseHeroProps) {
  const [leadCategory, ...otherCategories] = categories ?? [];
  const hasRating = typeof averageRating === 'number' && (totalReviews ?? 0) > 0;

  return (
    <AsyncSection
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeleton={<CourseHeroSkeleton className={className} />}
      errorTitle='Couldn’t load this course'
    >
      <Card className={cn('gap-0 overflow-hidden py-0', className)}>
        <div
          className='relative h-[172px] sm:h-[200px] lg:h-[244px]'
          style={
            {
              /* The two brand steps the artboard calls b700 and b800, mixed from
                 --primary so every dashboard domain re-hues them for free. */
              '--course-brand-mid': 'color-mix(in oklch, var(--primary) 78%, black)',
              '--course-brand-deep': 'color-mix(in oklch, var(--primary) 55%, black)',
              backgroundImage: [
                'radial-gradient(120% 140% at 12% 0%, rgb(255 255 255 / 0.22) 0%, rgb(255 255 255 / 0) 55%)',
                'repeating-linear-gradient(115deg, rgb(255 255 255 / 0.05) 0 2px, rgb(255 255 255 / 0) 2px 22px)',
                'linear-gradient(135deg, var(--primary) 0%, var(--course-brand-deep) 100%)',
              ].join(', '),
            } as CSSProperties
          }
        >
          {/*
            The to-top scrim. Deliberately not tokenised: it sits over the brand
            gradient and always carries white text, in both themes, so it must
            stay this dark whatever the palette does.
          */}
          <div
            className='absolute inset-0'
            style={{
              backgroundImage:
                'linear-gradient(to top, rgb(7 10 18 / 0.86) 0%, rgb(7 10 18 / 0.42) 46%, rgb(7 10 18 / 0.08) 100%)',
            }}
          />

          <div className='absolute inset-x-0 bottom-0 px-4 py-5 sm:px-7 sm:py-6'>
            {(leadCategory || status) && (
              <div className='mb-3 flex flex-wrap gap-2'>
                {leadCategory ? (
                  <HeroChip variant='solid'>{leadCategory}</HeroChip>
                ) : null}
                {otherCategories.map(category => (
                  <HeroChip key={category}>{category}</HeroChip>
                ))}
                {status ? <HeroChip className='capitalize'>{status}</HeroChip> : null}
              </div>
            )}

            <h1 className='max-w-[780px] text-xl leading-[1.15] font-bold tracking-[-0.02em] text-white sm:text-2xl lg:text-[34px]'>
              {title ?? PLACEHOLDER}
            </h1>

            {summary ? (
              <p className='mt-2 line-clamp-2 max-w-[660px] text-sm leading-[1.5] text-white/85 sm:text-[15px]'>
                {summary}
              </p>
            ) : null}

            <div className='mt-4 flex flex-wrap items-center gap-x-[18px] gap-y-2 sm:mt-[18px]'>
              {creatorName ? (
                <div className='flex items-center gap-2.5'>
                  <span className='inline-flex size-9 items-center justify-center rounded-full border-2 border-white/70 bg-[var(--course-brand-mid)] text-xs font-bold text-white'>
                    {initialsOf(creatorName)}
                  </span>
                  <span className='block'>
                    <span className='block text-sm leading-[1.2] font-semibold text-white'>
                      {creatorName}
                    </span>
                    <span className='block text-xs text-white/70'>{creatorRole}</span>
                  </span>
                </div>
              ) : null}

              {hasRating ? (
                <>
                  <HeroDivider />
                  <span className='inline-flex items-center gap-1.5 text-sm text-white'>
                    <Star className='fill-chart-3 text-chart-3 size-4' />
                    <b className='font-bold'>{averageRating?.toFixed(1)}</b>
                    <span className='text-white/70'>
                      ({formatCount(totalReviews)} review{totalReviews === 1 ? '' : 's'})
                    </span>
                  </span>
                </>
              ) : null}

              {typeof enrolledCount === 'number' ? (
                <>
                  <HeroDivider />
                  <span className='inline-flex items-center gap-[7px] text-sm text-white'>
                    <Users className='size-4' />
                    {formatCount(enrolledCount)} enrolled
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stat strip — 1px gaps on the border colour show through as dividers. */}
        <div className='bg-border grid grid-cols-2 gap-px sm:grid-cols-4'>
          <HeroStat icon={<BookOpen className='size-5' />} label='Lessons' value={numberOr(lessonCount)} />
          <HeroStat
            icon={<Layers className='size-5' />}
            label='Content items'
            value={
              contentItemCount === undefined
                ? PLACEHOLDER
                : contentCountNote
                  ? `${formatCount(contentItemCount)} (${contentCountNote})`
                  : formatCount(contentItemCount)
            }
          />
          <HeroStat
            icon={<Clock className='size-5' />}
            label='Total duration'
            value={duration ?? PLACEHOLDER}
          />
          <HeroStat
            icon={<GraduationCap className='size-5' />}
            label='Level'
            value={level ?? PLACEHOLDER}
          />
        </div>
      </Card>
    </AsyncSection>
  );
}

export function CourseHeroSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <div className='bg-muted h-[172px] animate-pulse sm:h-[200px] lg:h-[244px]' />
      <div className='bg-border grid grid-cols-2 gap-px sm:grid-cols-4'>
        {[0, 1, 2, 3].map(cell => (
          <div key={cell} className='bg-card flex items-center gap-3 px-6 py-4'>
            <Skeleton className='size-10 rounded-xl' />
            <div className='flex-1 space-y-1.5'>
              <Skeleton className='h-2.5 w-20' />
              <Skeleton className='h-4 w-12' />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HeroChip({
  children,
  variant = 'outline',
  className,
}: {
  children: ReactNode;
  variant?: 'solid' | 'outline';
  className?: string;
}) {
  return (
    // Literal white, like the title above it: these chips sit on the always-dark
    // hero band, so they must not follow the surface tokens into dark mode.
    <span
      className={cn(
        'inline-flex h-[22px] items-center rounded-[10px] px-[9px] text-xs',
        variant === 'solid'
          ? 'bg-white/95 font-semibold text-[var(--course-brand-deep)]'
          : 'border border-white/40 bg-white/12 font-medium text-white',
        className
      )}
    >
      {children}
    </span>
  );
}

function HeroDivider() {
  return <span className='hidden h-6 w-px bg-white/30 sm:block' />;
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='bg-card flex items-center gap-3 px-4 py-4 sm:px-6'>
      <span className='bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl'>
        {icon}
      </span>
      <span className='min-w-0'>
        <span className='text-muted-foreground block text-[11px] font-semibold tracking-[0.06em] uppercase'>
          {label}
        </span>
        <span className='mt-0.5 block truncate text-base font-bold'>{value}</span>
      </span>
    </div>
  );
}

function numberOr(value: number | undefined): string {
  return value === undefined ? PLACEHOLDER : formatCount(value);
}

function formatCount(value: number | undefined): string {
  return value === undefined ? PLACEHOLDER : new Intl.NumberFormat('en-KE').format(value);
}

/** "Rift Technical Studio" → "RT". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
