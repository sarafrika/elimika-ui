import { Star } from 'lucide-react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { CourseBlockAsyncProps, CourseReview } from '../types';
import { courseInitials, formatCourseCount, formatCourseDate } from './_shared';

/**
 * The reviews tab — every viewer state has it, so it takes no `access`.
 *
 * The score panel and the review cards come out of the same call, so they share
 * one `<AsyncSection>`: there is no state in which one of them has data and the
 * other does not.
 *
 * ## The distribution is computed here
 *
 * `GET /courses/{uuid}/reviews` answers with the whole list rather than a page,
 * so the average, the total and the five bars are all derived from the array in
 * memory. That keeps the header and the bars describing the same set of reviews
 * — a count from one source and bars from another would disagree the moment a
 * review was hidden.
 *
 * The gold of a star is `chart-3`: a categorical mark, fixed across the six
 * dashboards, and deliberately not the brand hue that `[data-dashboard-domain]`
 * moves under it.
 */

/** How many stars are drawn in the row under the average. */
const STAR_SCALE = 5;

export interface ReviewsTabProps extends CourseBlockAsyncProps {
  /** Every review on the course. Ordering is fixed here, newest first. */
  reviews?: readonly CourseReview[];
  /**
   * Display names by `student_uuid`, when the route resolved them. A review the
   * map does not cover is credited to "Learner" rather than to an email address
   * — the response's `created_by` is an audit field, not a byline.
   */
  reviewerNames?: Readonly<Record<string, string>>;
  className?: string;
}

export function ReviewsTab({
  reviews,
  reviewerNames,
  loading,
  error,
  onRetry,
  className,
}: ReviewsTabProps) {
  const rows = reviews ?? [];
  const summary = summarise(rows);
  const ordered = [...rows].sort(byNewest);

  return (
    <AsyncSection
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={rows.length === 0}
      skeleton={<ReviewsTabSkeleton className={className} />}
      errorTitle='Couldn’t load reviews'
      emptyTitle='No reviews yet'
      emptyDescription='Learners can review this course once they have finished a class running it.'
      className={className}
    >
      <div className={cn('flex flex-col gap-[18px]', className)}>
        <RatingSummary summary={summary} />

        {ordered.map((review, index) => (
          <ReviewCard
            key={review.uuid ?? `${review.student_uuid}-${index}`}
            review={review}
            name={reviewerName(review, reviewerNames)}
          />
        ))}
      </div>
    </AsyncSection>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Score panel
 * ────────────────────────────────────────────────────────────────────────── */

/** One row of the 5→1 distribution. */
export interface CourseRatingBar {
  /** 5 down to 1. */
  star: number;
  /** How many reviews carried that score. */
  count: number;
  /** That count as a share of every scored review, 0–100. */
  percent: number;
}

export interface CourseRatingSummary {
  /** Mean of every score, or `undefined` when nothing has been scored. */
  average: number | undefined;
  total: number;
  /** Always five rows, 5 down to 1, even where a score has no reviews. */
  bars: CourseRatingBar[];
}

export interface RatingSummaryProps {
  summary: CourseRatingSummary;
  className?: string;
}

export function RatingSummary({ summary, className }: RatingSummaryProps) {
  const { average, total, bars } = summary;

  return (
    <Card
      className={cn(
        'grid items-center gap-7 px-5 py-[18px] sm:grid-cols-[190px_minmax(0,1fr)]',
        className
      )}
    >
      <div className='text-center'>
        <div className='text-[44px] leading-none font-extrabold tracking-[-0.03em]'>
          {average === undefined ? '—' : average.toFixed(1)}
        </div>
        <StarRow value={average ?? 0} className='mt-2' />
        <div className='text-muted-foreground mt-2 text-[12.5px]'>
          {formatCourseCount(total)} review{total === 1 ? '' : 's'}
        </div>
      </div>

      <div className='flex flex-col gap-[7px]'>
        {bars.map(bar => (
          <div
            key={bar.star}
            className='text-muted-foreground flex items-center gap-2.5 text-xs'
          >
            <span className='w-[26px] flex-none'>{bar.star}★</span>
            <Progress
              value={bar.percent}
              className='bg-muted h-[7px] flex-1'
              indicatorClassName='bg-chart-3'
              aria-label={`${bar.star} star reviews`}
            />
            <span className='w-[34px] flex-none text-right'>{formatCourseCount(bar.count)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Five stars, filled up to the whole number the average has actually reached —
 * 4.6 lights four, because a fifth filled star would claim a score the course
 * does not have. The precise figure is the 44px number beside it.
 */
function StarRow({ value, className }: { value: number; className?: string }) {
  const filled = Math.max(0, Math.min(STAR_SCALE, Math.floor(value)));

  return (
    <div className={cn('flex justify-center gap-[3px]', className)} aria-hidden>
      {Array.from({ length: STAR_SCALE }, (_unused, index) => (
        <Star
          key={index}
          className={cn(
            'size-4',
            index < filled ? 'fill-chart-3 text-chart-3' : 'fill-border text-border'
          )}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Review card
 * ────────────────────────────────────────────────────────────────────────── */

function ReviewCard({ review, name }: { review: CourseReview; name: string }) {
  const date = formatCourseDate(review.created_date);

  return (
    <Card className='gap-0 px-5 py-4'>
      <div className='flex items-center gap-[11px]'>
        <span
          aria-hidden
          className='bg-muted text-foreground/80 inline-flex size-[34px] flex-none items-center justify-center rounded-full text-xs font-bold'
        >
          {courseInitials(name)}
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-[13.5px] font-semibold'>{name}</span>
          {date ? <span className='text-muted-foreground block text-[11.5px]'>{date}</span> : null}
        </span>
        <span className='text-chart-3 flex-none text-[13px] font-bold'>
          {review.rating.toFixed(1)} ★
        </span>
      </div>

      {review.headline ? (
        <div className='mt-2.5 text-[13.5px] font-bold'>{review.headline}</div>
      ) : null}
      {review.comments ? (
        <p className='text-foreground/80 mt-[5px] text-[13px] leading-[1.6]'>{review.comments}</p>
      ) : null}
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeleton
 * ────────────────────────────────────────────────────────────────────────── */

export function ReviewsTabSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-[18px]', className)}>
      <Card className='grid items-center gap-7 px-5 py-[18px] sm:grid-cols-[190px_minmax(0,1fr)]'>
        <div className='flex flex-col items-center'>
          <Skeleton className='h-11 w-20' />
          <Skeleton className='mt-2 h-4 w-24' />
          <Skeleton className='mt-2 h-3 w-20' />
        </div>
        <div className='flex flex-col gap-[7px]'>
          {[0, 1, 2, 3, 4].map(bar => (
            <div key={bar} className='flex items-center gap-2.5'>
              <Skeleton className='h-3 w-[26px] flex-none' />
              <Skeleton className='h-[7px] flex-1 rounded-full' />
              <Skeleton className='h-3 w-[34px] flex-none' />
            </div>
          ))}
        </div>
      </Card>

      {[0, 1].map(card => (
        <Card key={card} className='gap-0 px-5 py-4'>
          <div className='flex items-center gap-[11px]'>
            <Skeleton className='size-[34px] flex-none rounded-full' />
            <div className='min-w-0 flex-1 space-y-1.5'>
              <Skeleton className='h-3 w-32 max-w-full' />
              <Skeleton className='h-2.5 w-20' />
            </div>
            <Skeleton className='h-3 w-12 flex-none' />
          </div>
          <Skeleton className='mt-3 h-3.5 w-64 max-w-full' />
          <Skeleton className='mt-2.5 h-3 w-full' />
          <Skeleton className='mt-1.5 h-3 w-4/5' />
        </Card>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Derivation
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Average, total and the five bars, from the reviews already in memory.
 *
 * A score outside 1–5 is counted in the total and the average — it is a real
 * review — but it lands in no bar, because there is no bar for it to land in.
 */
export function summarise(reviews: readonly CourseReview[]): CourseRatingSummary {
  const counts = [0, 0, 0, 0, 0];
  let sum = 0;
  let scored = 0;

  for (const review of reviews) {
    if (typeof review.rating !== 'number' || !Number.isFinite(review.rating)) continue;
    sum += review.rating;
    scored += 1;

    const bucket = Math.round(review.rating);
    if (bucket >= 1 && bucket <= STAR_SCALE) counts[bucket - 1] = (counts[bucket - 1] ?? 0) + 1;
  }

  const bars: CourseRatingBar[] = [];
  for (let star = STAR_SCALE; star >= 1; star -= 1) {
    const count = counts[star - 1] ?? 0;
    bars.push({ star, count, percent: scored === 0 ? 0 : (count / scored) * 100 });
  }

  return {
    average: scored === 0 ? undefined : sum / scored,
    total: reviews.length,
    bars,
  };
}

function byNewest(left: CourseReview, right: CourseReview): number {
  return time(right.created_date) - time(left.created_date);
}

function time(value: Date | undefined): number {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Who to credit. An anonymous review says so; a review whose author the route
 * did not resolve is credited generically rather than by the audit field.
 */
function reviewerName(
  review: CourseReview,
  names: Readonly<Record<string, string>> | undefined
): string {
  if (review.is_anonymous) return 'Anonymous learner';
  return names?.[review.student_uuid] ?? 'Learner';
}
