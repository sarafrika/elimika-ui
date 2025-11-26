'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useEffect, useState } from 'react';

type Review = {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
};

export default function ReviewsPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'reviews',
        title: 'Reviews',
        url: '/dashboard/profile/reviews',
        isLast: true,
      },
    ]);

    const fetchReviews = async () => {
      const mockReviews: Review[] = [];

      setTimeout(() => {
        setReviews(mockReviews);
      }, 800);
    };

    fetchReviews();
  }, [replaceBreadcrumbs]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Reviews</h1>
        <p className='text-muted-foreground text-sm'>
          Track and improve your service with reviews.
        </p>
      </div>

      {reviews === null ? (
        <p className='text-muted-foreground text-sm'>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className='text-muted-foreground mt-10 text-center'>
          <p className='text-lg'>No reviews yet</p>
          <p className='text-sm'>Once students start leaving feedback, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {reviews.map(review => (
            <div
              key={review.id}
              className='rounded-md border bg-white p-4 shadow-sm dark:bg-gray-900'
            >
              <div className='mb-2 flex items-center justify-between'>
                <p className='font-medium'>{review.reviewer}</p>
                <p className='text-sm text-muted-foreground'>{review.date}</p>
              </div>
              <div className='mb-1 flex items-center'>
                <p className='text-sm text-yellow-500'>
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </p>
              </div>
              <p className='text-sm text-muted-foreground'>{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
