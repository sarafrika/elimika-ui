'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { getInstructorReviewsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ReviewCard } from './review-card';

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
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'reviews',
        title: 'Reviews',
        url: '/dashboard/reviews',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  return (
    <div className='space-y-6'>
      {isLoading ? (
        <p className='text-muted-foreground text-sm'>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className='text-muted-foreground mt-10 text-center'>
          <p className='text-lg'>No reviews yet</p>
          <p className='text-sm'>Once students start leaving feedback, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {reviews.map(review => (
            <ReviewCard key={review.uuid} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
