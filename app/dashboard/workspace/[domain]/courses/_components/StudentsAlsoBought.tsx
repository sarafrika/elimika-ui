"use client";

import type { Course, CourseReview } from '@/services/client';
import { getCourseReviewsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import StarRating from './StarRating';

type Props = {
  courses: Course[];
  creatorName: string;
  activeDomain: string;
};

export default function StudentsAlsoBought({
  courses,
  creatorName,
  activeDomain
}: Props) {
  const reviewQueries = useQueries({
    queries: courses.map(course =>
      course.uuid
        ? {
          ...getCourseReviewsOptions({
            path: { courseUuid: course.uuid },
          }),
          enabled: !!course.uuid,
          staleTime: 5 * 60 * 1000,
          refetchOnWindowFocus: false,
        }
        : {
          queryKey: ['course-reviews-missing', course.name],
          queryFn: async () => ({ data: [] as CourseReview[] }),
          enabled: false,
        }
    ),
  });

  const cardAccent = ['bg-muted', 'bg-accent', 'bg-primary/10'];

  return (
    <section className="space-y-4">

      <h2 className="text-base font-bold text-foreground sm:text-lg">
        Students also bought
      </h2>

      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 sm:gap-4">
        {courses.map((course, i) => {
          const reviews = (reviewQueries[i]?.data?.data ?? []) as CourseReview[];
          const reviewCount = reviews.length;

          const averageRating =
            reviewCount > 0
              ? (
                reviews.reduce(
                  (sum, review) => sum + (review.rating || 0),
                  0
                ) / reviewCount
              ).toFixed(1)
              : '0';

          return (
            <div
              key={course.uuid ?? course.name}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md"
            >
              {/* TOP AREA */}
              <div
                className={`relative aspect-video overflow-hidden ${cardAccent[i % cardAccent.length]}`}
              >
                {course?.thumbnail_url ? (
                  <>
                    <img
                      src={course.thumbnail_url}
                      alt={course.name || "Course thumbnail"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/10" />
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-center">
                    <BookOpen className="h-8 w-8 sm:h-8 sm:w-8" />
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="p-3 sm:p-4">

                <h3 className="mb-1.5 text-xs font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-sm">
                  {course.name}
                </h3>

                <StarRating
                  rating={averageRating ? Number(averageRating) : 0}
                  reviewCount={reviewCount}
                  size="sm"
                />

                <p className="mt-2 text-xs font-bold text-foreground sm:text-sm">
                  From{' '}
                  {typeof course.minimum_training_fee === 'number'
                    ? `Ksh ${course.minimum_training_fee.toLocaleString()}`
                    : 'Ksh --'}
                </p>

                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                  {creatorName}
                </p>

              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
}