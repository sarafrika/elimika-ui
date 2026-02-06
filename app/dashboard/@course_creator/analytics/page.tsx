'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCourseCreator } from '@/context/course-creator-context';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState } from 'react';
import { getCourseEnrollmentsOptions, getCourseReviewsOptions } from '../../../../services/client/@tanstack/react-query.gen';

export default function CourseCreatorAnalyticsPage() {
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);

  const { data, courses } = useCourseCreator();
  const { analytics, monetization, trainingRequirements, verification } = data;

  const totalCourses = analytics.totalCourses || 1;
  const statusBreakdown = [
    { label: 'Published', count: analytics.publishedCourses },
    { label: 'In review', count: analytics.inReviewCourses },
    { label: 'Draft', count: analytics.draftCourses },
    { label: 'Archived', count: analytics.archivedCourses },
  ];

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 px-4 py-10'>
      <header>
        <h1 className='text-3xl font-semibold tracking-tight'>Analytics</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          High-level indicators that highlight catalogue health, monetization readiness, and
          operational compliance.
        </p>
      </header>

      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Course ratings & feedback</CardTitle>
          <CardDescription>
            Learner-submitted ratings and qualitative feedback per course.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          {courses.map(course => (
            <CourseReviewSummary
              key={course.uuid}
              course={course}
              isOpen={openCourseId === course.uuid}
              onToggle={() =>
                setOpenCourseId((prev: any) =>
                  prev === course?.uuid ? null : (course?.uuid as string)
                )
              }
            />
          ))}
        </CardContent>
      </Card>

      <section className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Courses by status</CardTitle>
            <CardDescription>
              {analytics.totalCourses} course{analytics.totalCourses === 1 ? '' : 's'} managed by
              this profile.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {statusBreakdown.map(status => {
              const percent = Math.round((status.count / totalCourses) * 100);
              return (
                <div key={status.label} className='space-y-2'>
                  <div className='flex items-center justify-between text-sm font-medium'>
                    <span>{status.label}</span>
                    <span className='text-muted-foreground'>{status.count}</span>
                  </div>
                  <Progress value={percent} className='h-2' />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Minimum training fee summary</CardTitle>
            <CardDescription>
              Controls how instructor-led classes price your courses in the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid grid-cols-3 gap-3 text-center text-sm'>
            <FeeStat heading='Courses with fee floor' value={monetization.coursesWithMinimumFee} />
            <FeeStat heading='Average fee' value={monetization.minimumFeeAverage} isCurrency />
            <FeeStat
              heading='Fee range'
              value={
                monetization.minimumFeeFloor !== null || monetization.minimumFeeCeiling !== null
                  ? `${formatCurrency(monetization.minimumFeeFloor)} – ${formatCurrency(monetization.minimumFeeCeiling)}`
                  : 'Not set'
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Training requirements</CardTitle>
            <CardDescription>
              Make sure delivery partners acknowledge mandatory items before scheduling classes.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='border-border/60 bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3'>
              <span>Total configured items</span>
              <span className='font-semibold'>{trainingRequirements.totalRequirements}</span>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='border-border/60 bg-muted/40 rounded-lg border p-3 text-center'>
                <p className='text-muted-foreground text-xs tracking-wide uppercase'>Mandatory</p>
                <p className='text-lg font-semibold'>
                  {trainingRequirements.mandatoryRequirements}
                </p>
              </div>
              <div className='border-border/60 bg-muted/40 rounded-lg border p-3 text-center'>
                <p className='text-muted-foreground text-xs tracking-wide uppercase'>Optional</p>
                <p className='text-lg font-semibold'>{trainingRequirements.optionalRequirements}</p>
              </div>
            </div>
            <p className='text-muted-foreground text-xs'>
              Mandatory items act as blockers during scheduling workflows. Optional resources are
              surfaced in onboarding tooltips.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Verification timeline</CardTitle>
            <CardDescription>
              Track when credentials were last reviewed and whether marketplace rights are active.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='border-border/60 bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3'>
              <span>Status</span>
              <span className='font-semibold'>
                {verification.adminVerified ? 'Verified' : 'Pending review'}
              </span>
            </div>
            <div className='border-border/60 bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3'>
              <span>Last updated</span>
              <span className='font-semibold'>
                {verification.lastUpdated
                  ? format(verification.lastUpdated, 'dd MMM yyyy')
                  : 'Not recorded'}
              </span>
            </div>
            <div className='border-border/60 bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3'>
              <span>Profile completeness</span>
              <span className='font-semibold'>
                {verification.profileComplete ? 'Complete' : 'Needs attention'}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FeeStat({
  heading,
  value,
  isCurrency = false,
}: {
  heading: string;
  value: number | string | null;
  isCurrency?: boolean;
}) {
  const displayValue =
    typeof value === 'number' && isCurrency ? formatCurrency(value) : (value ?? 'Not set');
  return (
    <div className='border-border/60 bg-muted/40 rounded-lg border p-3'>
      <p className='text-muted-foreground text-xs tracking-wide uppercase'>{heading}</p>
      <p className='text-lg font-semibold'>{displayValue}</p>
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'Not set';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className='flex items-center gap-1'>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < value ? 'text-yellow-500' : 'text-muted-foreground'}>
          ★
        </span>
      ))}
    </div>
  );
}

function CourseReviewSummary({
  course,
  isOpen,
  onToggle,
}: {
  course: any;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { data: enrollmentData } = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: course?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!course?.uuid,
  });
  const enrollments = enrollmentData?.data?.content || [];

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: course?.uuid as string } }),
    enabled: !!course?.uuid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const reviews = reviewsData?.data || [];

  const reviewCount = reviews.length;

  const averageRating =
    reviewCount > 0
      ? Math.round(
        (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount) * 10
      ) / 10
      : null;

  return (
    <div className='border-border/60 rounded-lg border'>
      {/* Header */}
      <button
        onClick={onToggle}
        className='flex w-full items-center justify-between p-4 text-left'
        aria-expanded={isOpen}
      >
        <div className='flex flex-col gap-2'>
          <div className='flex flex-row items-center gap-2' >
            <p className='font-medium'>{course.name}</p>
            <p className='text-muted-foreground text-xs'>{enrollments?.length} enrollment(s)</p>

          </div>
          <div className='flex flex-col items-start gap-2'>
            <p className='text-muted-foreground text-xs'>
              {reviewsLoading
                ? 'Loading reviews...'
                : reviewCount
                  ? `${reviewCount} review${reviewCount > 1 ? 's' : ''}`
                  : 'No reviews yet'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {averageRating !== null ? (
            <>
              <RatingStars value={Math.round(averageRating)} />
              <span className='text-sm font-medium'>{averageRating}</span>
            </>
          ) : (
            <>
              <RatingStars value={0} />
              <span className='text-sm font-medium'>{averageRating}</span>
            </>)}
        </div>
      </button>

      {/* Body */}
      {isOpen && (
        <div className='border-border/60 space-y-3 border-t p-4'>
          {reviewsLoading ? (
            <p className='text-muted-foreground text-center text-sm'>Loading reviews...</p>
          ) : reviewCount > 0 ? (
            reviews.slice(0, 5).map((review: any) => (
              <div
                key={review.uuid}
                className='border-border/60 bg-muted/40 rounded-lg border p-3 text-sm'
              >
                <div className='flex items-center justify-between'>
                  <RatingStars value={review.rating || 0} />
                  <span className='text-muted-foreground text-xs'>
                    {format(new Date(review.created_date), 'dd MMM yyyy')}
                  </span>
                </div>

                <p className='mt-2'>{review.headline}</p>
                <p className='text-muted-foreground mt-1 text-xs'>{review.comments}</p>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground text-center text-sm'>
              No reviews yet for this course.
            </p>
          )}
        </div>
      )}
    </div>
  );
}