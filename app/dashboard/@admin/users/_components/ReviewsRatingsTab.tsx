'use client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { ContentItem, DomainVerification } from '@/services/admin/credential-review';
import { fetchInstructorClasses } from '@/services/admin/user-profile-360';
import type { ClassReview, CourseReview } from '@/services/client';
import {
  getClassRatingSummary,
  getClassReviews,
  getCourseReviews,
} from '@/services/client';
import { adminTheme } from '../../_components/ui/admin-theme';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';

function Stars({ rating }: { rating?: number | null }) {
  if (rating == null) return <span className='text-xs text-muted-foreground'>No ratings</span>;
  return (
    <span className='inline-flex items-center gap-1 text-sm font-medium text-foreground'>
      <Star className='size-3.5 fill-warning text-warning' />
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
}: {
  title: string;
  subtitle: string;
  rating?: number | null;
  count?: number;
  loading: boolean;
  reviews: NormalizedReview[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className='rounded-md border border-border/60 bg-muted/20'>
      <button
        type='button'
        onClick={() => setOpen(value => !value)}
        className='flex w-full items-center justify-between gap-3 p-3 text-left'
      >
        <div className='flex min-w-0 items-center gap-2'>
          {open ? (
            <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
          ) : (
            <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
          )}
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium text-foreground'>{title}</p>
            <p className='truncate text-xs text-muted-foreground'>{subtitle}</p>
          </div>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Stars rating={rating} />
          {count != null ? (
            <span className='text-xs text-muted-foreground'>({count})</span>
          ) : null}
        </div>
      </button>
      {open ? (
        <div className='space-y-2 border-t border-border/60 p-3'>
          {loading ? (
            <p className='text-xs text-muted-foreground'>Loading reviews…</p>
          ) : reviews.length ? (
            reviews.map(review => (
              <div key={review.id} className='rounded-md border border-border/60 bg-card p-2.5'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='truncate text-sm font-medium text-foreground'>
                    {review.headline || 'Review'}
                  </p>
                  <Stars rating={review.rating} />
                </div>
                {review.comments ? (
                  <p className='mt-1 text-xs text-muted-foreground'>{review.comments}</p>
                ) : null}
                {review.date ? (
                  <p className='mt-1 text-[11px] text-muted-foreground'>{review.date}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className='text-xs text-muted-foreground'>No reviews yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CourseReviewRow({ course, active }: { course: ContentItem; active: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['course-reviews', course.uuid],
    queryFn: () => getCourseReviews({ path: { courseUuid: course.uuid } }),
    enabled: active && Boolean(course.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const reviews = ((data?.data?.data ?? []) as CourseReview[]) ?? [];
  const ratings = reviews.map(r => r.rating).filter((n): n is number => typeof n === 'number');
  const avg = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : null;
  return (
    <ReviewRow
      title={course.title}
      subtitle='Course'
      rating={avg}
      count={reviews.length}
      loading={isLoading}
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
  const summaryQuery = useQuery({
    queryKey: ['class-rating-summary', klass.uuid],
    queryFn: () => getClassRatingSummary({ path: { uuid: klass.uuid } }),
    enabled: active && Boolean(klass.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const reviewsQuery = useQuery({
    queryKey: ['class-reviews', klass.uuid],
    queryFn: () => getClassReviews({ path: { uuid: klass.uuid }, query: { pageable: { page: 0, size: 200 } } }),
    enabled: active && Boolean(klass.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const summary = summaryQuery.data?.data?.data;
  const reviews = ((reviewsQuery.data?.data?.data?.content ?? []) as ClassReview[]) ?? [];
  return (
    <ReviewRow
      title={klass.title}
      subtitle='Class'
      rating={summary?.average_rating ?? null}
      count={summary?.review_count != null ? Number(summary.review_count) : reviews.length}
      loading={reviewsQuery.isLoading}
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
            <div className={cn('flex flex-col items-center justify-center rounded-md border border-border/60 bg-muted/20 px-5 py-3')}>
              <span className='text-2xl font-semibold text-foreground'>
                {instructorDomain.averageRating != null ? Math.round(instructorDomain.averageRating * 10) / 10 : '—'}
              </span>
              <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                <Star className='size-3 fill-warning text-warning' />
                {instructorDomain.reviewCount} review{instructorDomain.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className='min-w-0 flex-1 space-y-2'>
              {instructorDomain.reviews.length ? (
                instructorDomain.reviews.slice(0, 4).map(review => (
                  <div key={review.id} className='rounded-md border border-border/60 bg-muted/20 p-2.5'>
                    <p className='truncate text-sm font-medium text-foreground'>{review.title}</p>
                    {review.subtitle ? (
                      <p className='truncate text-xs text-muted-foreground'>{review.subtitle}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>No instructor reviews yet.</p>
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
