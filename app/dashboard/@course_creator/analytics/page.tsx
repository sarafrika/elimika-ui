'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCourseCreator } from '@/context/course-creator-context';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MessageSquare, Star, Users } from 'lucide-react';
import { useState } from 'react';
import {
  getCourseEnrollmentsOptions,
  getCourseReviewsOptions,
} from '../../../../services/client/@tanstack/react-query.gen';

export default function CourseCreatorAnalyticsPage() {
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, courses } = useCourseCreator();
  const { analytics, monetization, trainingRequirements, verification } = data;

  const totalCourses = analytics.totalCourses || 1;
  const statusBreakdown = [
    { label: 'Published', count: analytics.publishedCourses },
    { label: 'In review', count: analytics.inReviewCourses },
    { label: 'Draft', count: analytics.draftCourses },
    { label: 'Archived', count: analytics.archivedCourses },
  ];

  const handleViewReviews = (course: any) => {
    setSelectedCourse(course);
    setIsSheetOpen(true);
  };

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

        <CardContent className='space-y-3'>
          {courses.map(course => (
            <CourseReviewCard
              key={course.uuid}
              course={course}
              onViewReviews={() => handleViewReviews(course)}
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

      {/* Reviews Sheet */}
      <ReviewsSheet
        course={selectedCourse}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
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
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < value ? 'fill-yellow-500 text-yellow-500' : 'fill-muted text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}

function CourseReviewCard({ course, onViewReviews }: { course: any; onViewReviews: () => void }) {
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
    <div
      onClick={onViewReviews}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onViewReviews();
        }
      }}
      className='border-border/60 group bg-card hover:bg-muted/50 focus:ring-primary cursor-pointer rounded-lg border transition-colors focus:ring-2 focus:outline-none'
    >
      <div className='flex items-center gap-4 p-4'>
        {/* Course Info */}
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='truncate text-sm font-medium'>{course.name}</h3>
            <Badge variant='secondary' className='text-xs'>
              {enrollments?.length} enrolled
            </Badge>
          </div>
          <div className='text-muted-foreground flex items-center gap-3 text-xs'>
            <div className='flex items-center gap-1'>
              <MessageSquare className='h-3 w-3' />
              <span>
                {reviewsLoading
                  ? 'Loading...'
                  : reviewCount
                    ? `${reviewCount} review${reviewCount > 1 ? 's' : ''}`
                    : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className='flex items-center gap-3'>
          <div className='text-right'>
            {averageRating !== null ? (
              <>
                <div className='mb-0.5 flex items-center gap-1.5'>
                  <RatingStars value={Math.round(averageRating)} />
                </div>
                <p className='text-xs font-medium'>{averageRating} average</p>
              </>
            ) : (
              <>
                <div className='mb-0.5 flex items-center gap-1.5'>
                  <RatingStars value={0} />
                </div>
                <p className='text-muted-foreground text-xs'>No ratings</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSheet({
  course,
  isOpen,
  onClose,
}: {
  course: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: enrollmentData } = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: course?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!course?.uuid && isOpen,
  });
  const enrollments = enrollmentData?.data?.content || [];

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: course?.uuid as string } }),
    enabled: !!course?.uuid && isOpen,
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

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter((r: any) => r.rating === rating).length;
    const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
    return { rating, count, percentage };
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Course Reviews</SheetTitle>
          <SheetDescription className='line-clamp-2'>{course?.name}</SheetDescription>
        </SheetHeader>

        <div className='px-6'>
          {reviewsLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
                <p className='text-muted-foreground text-sm'>Loading reviews...</p>
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Summary Stats */}
              <div className='grid gap-4 sm:grid-cols-2'>
                <Card className='p-0'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 rounded-full p-3'>
                        <Users className='text-primary h-5 w-5' />
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs font-medium'>
                          Total Enrollments
                        </p>
                        <p className='text-xl font-bold'>{enrollments.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className='p-0'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='rounded-full bg-yellow-500/10 p-3'>
                        <Star className='h-5 w-5 text-yellow-600' />
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs font-medium'>Average Rating</p>
                        <p className='text-xl font-bold'>{averageRating || '0.0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rating Distribution */}
              {reviewCount > 0 && (
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm font-semibold'>Rating Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {ratingDistribution.map(({ rating, count, percentage }) => (
                      <div key={rating} className='flex items-center gap-3'>
                        <div className='flex w-12 items-center gap-1'>
                          <span className='text-xs font-medium'>{rating}</span>
                          <Star className='h-3 w-3 fill-yellow-500 text-yellow-500' />
                        </div>
                        <Progress value={percentage} className='h-2 flex-1' />
                        <span className='text-muted-foreground w-8 text-right text-xs'>
                          {count}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              <div>
                <h3 className='mb-3 text-sm font-semibold'>All Reviews ({reviewCount})</h3>

                {reviewCount > 0 ? (
                  <ScrollArea className='space-y-4'>
                    {reviews.map((review: any) => (
                      <Card key={review.uuid} className='mb-3'>
                        <CardContent className='p-4'>
                          <div className='mb-2 flex items-start justify-between'>
                            <RatingStars value={review.rating || 0} />
                            <span className='text-muted-foreground text-xs'>
                              {format(new Date(review.created_date), 'dd MMM yyyy')}
                            </span>
                          </div>

                          {review.headline && (
                            <h4 className='mb-2 text-sm font-semibold'>{review.headline}</h4>
                          )}

                          {review.comments && (
                            <p className='text-muted-foreground text-sm'>{review.comments}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </ScrollArea>
                ) : (
                  <Card>
                    <CardContent className='p-12 text-center'>
                      <MessageSquare className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                      <p className='mb-1 text-sm font-medium'>No reviews yet</p>
                      <p className='text-muted-foreground text-xs'>
                        This course hasn't received any reviews from students yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
