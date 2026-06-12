'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CourseReview } from '../services/client';
import { getCourseReviewsOptions } from '../services/client/@tanstack/react-query.gen';

export type ReviewMap = Record<
  string,
  {
    reviews: CourseReview[] | null;
    count: number;
  } | null
>;

export function useCourseReviewsMap(courseUuids: string[]) {
  const reviewQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseReviewsOptions({
        path: { courseUuid: uuid },
      }),
      enabled: !!uuid,
      staleTime: 30 * 60 * 1000, // ratings change rarely
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const reviewMap = useMemo<ReviewMap>(() => {
    const map: ReviewMap = {};

    courseUuids.forEach((uuid, index) => {
      const data = reviewQueries[index]?.data?.data;

      map[uuid] = data
        ? {
          reviews: data,
          count: data.length ?? 0,
        }
        : null;
    });

    return map;
  }, [courseUuids, reviewQueries]);

  const isLoading = reviewQueries.some(q => q.isPending);

  return { reviewMap, isLoading };
}

type Review = {
  rating?: number | null;
};

export function averageRating(reviews: CourseReview[] = []): number | undefined {
  if (!reviews.length) return undefined;

  let sum = 0;
  let count = 0;

  for (const review of reviews) {
    const r = review.rating;

    if (typeof r === 'number' && !isNaN(r)) {
      sum += r;
      count++;
    }
  }

  if (count === 0) return undefined;

  return Number((sum / count).toFixed(2));
}