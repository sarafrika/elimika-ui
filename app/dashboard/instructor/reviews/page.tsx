'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { getInstructorReviewsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ReviewCard, ReviewCardSkeleton } from './review-card';

/** Reviews fill the width in ~420px columns instead of one long stack. */
const REVIEW_GRID = 'grid grid-cols-1 gap-4 lg:grid-cols-[repeat(auto-fill,minmax(420px,1fr))]';

export default function ReviewsPage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const { data, isLoading } = useQuery({
    ...getInstructorReviewsOptions({
      path: { instructorUuid: instructor?.uuid as string },
    }),
    enabled: !!instructor?.uuid,
  });

  const reviews = data?.data ?? [];

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/instructor/profile' },
      {
        id: 'reviews',
        title: 'Reviews',
        url: '/dashboard/instructor/reviews',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  return (
    <div className='space-y-6'>
      {isLoading ? (
        <div className={REVIEW_GRID}>
          {Array.from({ length: 3 }).map((_, i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className='text-muted-foreground mt-10 text-center'>
          <p className='text-lg'>No reviews yet</p>
          <p className='text-sm'>Once students start leaving feedback, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div className={REVIEW_GRID}>
          {reviews.map(review => (
            <ReviewCard key={review.uuid} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
