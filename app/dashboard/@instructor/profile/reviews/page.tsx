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
      const mockReviews: Review[] = [

      ];

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
        <p className="text-muted-foreground text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="text-center text-muted-foreground mt-10">
          <p className="text-lg">No reviews yet</p>
          <p className="text-sm">Once students start leaving feedback, you'll see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border rounded-md p-4 shadow-sm bg-white dark:bg-gray-900"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">{review.reviewer}</p>
                <p className="text-sm text-gray-500">{review.date}</p>
              </div>
              <div className="flex items-center mb-1">
                <p className="text-yellow-500 text-sm">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
