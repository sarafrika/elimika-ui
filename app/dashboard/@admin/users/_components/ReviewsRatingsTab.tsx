'use client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { ContentItem, DomainVerification } from '@/services/admin/credential-review';
import { fetchInstructorClasses } from '@/services/admin/user-profile-360';
import {
  getClassRatingSummaryOptions,
  getClassReviewsOptions,
  getCourseReviewsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../../_components/ui/admin-theme';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';

const REVIEW_PAGEABLE = { page: 0, size: 20 };

function Stars({ rating }: { rating?: number | null }) {
  if (rating == null) return <span className='text-muted-foreground text-xs'>No ratings</span>;
  return (
    <span className='text-foreground inline-flex items-center gap-1 text-sm font-medium'>
      <Star className='fill-warning text-warning size-3.5' />
      {Math.round(rating * 10) / 10}
    </span>
  );
}

interface NormalizedReview {
  id: string;
  rating?: number | null;
  headline?: string;
  comments?: string;
  date?: string;
}

function formatDate(value?: Date | string | null): string {
  if (!value) return '';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Collapsible row shell that lazily renders a rating + expandable review list. */
function ReviewRow({
  title,
  subtitle,
  rating,
  count,
  loading,
  reviews,
  open,
  onOpenChange,
}: {
  title: string;
  subtitle: string;
  rating?: number | null;
  count?: number;
  loading: boolean;
  reviews: NormalizedReview[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const expanded = open ?? internalOpen;
  const setExpanded = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
      return;
    }
    setInternalOpen(nextOpen);
  };

  return (
    <div className='border-border/60 bg-muted/20 rounded-md border'>
      <button
        type='button'
        onClick={() => setExpanded(!expanded)}
        className='flex w-full items-center justify-between gap-3 p-3 text-left'
      >
        <div className='flex min-w-0 items-center gap-2'>
          {expanded ? (
            <ChevronDown className='text-muted-foreground size-4 shrink-0' />
          ) : (
            <ChevronRight className='text-muted-foreground size-4 shrink-0' />
          )}
          <div className='min-w-0'>
            <p className='text-foreground truncate text-sm font-medium'>{title}</p>
            <p className='text-muted-foreground truncate text-xs'>{subtitle}</p>
          </div>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Stars rating={rating} />
          {count != null ? <span className='text-muted-foreground text-xs'>({count})</span> : null}
        </div>
      </button>
      {expanded ? (
        <div className='border-border/60 space-y-2 border-t p-3'>
          {loading ? (
            <p className='text-muted-foreground text-xs'>Loading reviews…</p>
          ) : reviews.length ? (
            reviews.map(review => (
              <div key={review.id} className='border-border/60 bg-card rounded-md border p-2.5'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-foreground truncate text-sm font-medium'>
                    {review.headline || 'Review'}
                  </p>
                  <Stars rating={review.rating} />
                </div>
                {review.comments ? (
                  <p className='text-muted-foreground mt-1 text-xs'>{review.comments}</p>
                ) : null}
                {review.date ? (
                  <p className='text-muted-foreground mt-1 text-[11px]'>{review.date}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className='text-muted-foreground text-xs'>No reviews yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CourseReviewRow({ course, active }: { course: ContentItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const reviewsQuery = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: course.uuid } }),
    enabled: active && open && Boolean(course.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const reviews = reviewsQuery.data?.data ?? [];
  const ratings = reviews.map(r => r.rating).filter((n): n is number => typeof n === 'number');
  const avg = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : null;
  return (
    <ReviewRow
      title={course.title}
      subtitle='Course'
      rating={avg}
      count={reviews.length}
      loading={reviewsQuery.isLoading}
      open={open}
      onOpenChange={setOpen}
      reviews={reviews.map(r => ({
        id: r.uuid ?? `${r.course_uuid}-${r.student_uuid}`,
        rating: r.rating,
        headline: r.headline,
        comments: r.comments,
        date: formatDate(r.created_date),
      }))}
    />
  );
}

function ClassReviewRow({
  klass,
  active,
}: {
  klass: { uuid: string; title: string };
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const summaryQuery = useQuery({
    ...getClassRatingSummaryOptions({ path: { uuid: klass.uuid } }),
    enabled: active && open && Boolean(klass.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const reviewsQuery = useQuery({
    ...getClassReviewsOptions({ path: { uuid: klass.uuid }, query: { pageable: REVIEW_PAGEABLE } }),
    enabled: active && open && Boolean(klass.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const summary = summaryQuery.data?.data;
  const reviews = reviewsQuery.data?.data?.content ?? [];
  return (
    <ReviewRow
      title={klass.title}
      subtitle='Class'
      rating={summary?.average_rating ?? null}
      count={summary?.review_count != null ? Number(summary.review_count) : reviews.length}
      loading={summaryQuery.isLoading || reviewsQuery.isLoading}
      open={open}
      onOpenChange={setOpen}
      reviews={reviews.map(r => ({
        id: r.uuid ?? `${klass.uuid}-${r.created_date}`,
        rating: r.rating,
        headline: r.headline,
        comments: r.comments ?? undefined,
        date: formatDate(r.created_date),
      }))}
    />
  );
}

export function ReviewsRatingsTab({
  instructorDomain,
  courses,
  instructorUuid,
  active,
}: {
  instructorDomain?: DomainVerification;
  courses: ContentItem[];
  instructorUuid?: string;
  active: boolean;
}) {
  const classesQuery = useQuery({
    queryKey: ['instructor-classes', instructorUuid],
    queryFn: () => fetchInstructorClasses(instructorUuid as string),
    enabled: active && Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
  });
  const classes = classesQuery.data ?? [];

  return (
    <div className='space-y-4'>
      {instructorDomain ? (
        <SectionCard title='Instructor rating' description='Overall reviews left by learners.'>
          <div className='flex items-center gap-4'>
            <div
              className={cn(
                'border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-md border px-5 py-3'
              )}
            >
              <span className='text-foreground text-2xl font-semibold'>
                {instructorDomain.averageRating != null
                  ? Math.round(instructorDomain.averageRating * 10) / 10
                  : '—'}
              </span>
              <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
                <Star className='fill-warning text-warning size-3' />
                {instructorDomain.reviewCount} review{instructorDomain.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className='min-w-0 flex-1 space-y-2'>
              {instructorDomain.reviews.length ? (
                instructorDomain.reviews.slice(0, 4).map(review => (
                  <div
                    key={review.id}
                    className='border-border/60 bg-muted/20 rounded-md border p-2.5'
                  >
                    <p className='text-foreground truncate text-sm font-medium'>{review.title}</p>
                    {review.subtitle ? (
                      <p className='text-muted-foreground truncate text-xs'>{review.subtitle}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className='text-muted-foreground text-sm'>No instructor reviews yet.</p>
              )}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title='Per-course ratings' description='Reviews broken down by course.'>
        {courses.length ? (
          <div className='space-y-2'>
            {courses.map(course => (
              <CourseReviewRow key={course.uuid} course={course} active={active} />
            ))}
          </div>
        ) : (
          <p className={`${adminTheme.sectionLabel} normal-case`}>No courses to rate.</p>
        )}
      </SectionCard>

      {instructorUuid ? (
        <SectionCard title='Per-class ratings' description='Reviews broken down by class.'>
          {classesQuery.isLoading ? (
            <SectionCardSkeleton rows={3} withHeader={false} />
          ) : classes.length ? (
            <div className='space-y-2'>
              {classes.map(klass => (
                <ClassReviewRow key={klass.uuid} klass={klass} active={active} />
              ))}
            </div>
          ) : (
            <p className={`${adminTheme.sectionLabel} normal-case`}>No classes to rate.</p>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
