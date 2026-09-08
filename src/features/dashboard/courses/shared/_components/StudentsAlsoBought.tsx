'use client';

import type { UserDomain } from '@/lib/types';
import type { Course, CourseReview } from '@/services/client';
import { getCourseReviewsOptions } from '@/services/client/@tanstack/react-query.gen';
import { getContentHref } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import StarRating from '@/src/features/dashboard/courses/shared/_components/StarRating';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useQueries } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { toAuthenticatedMediaUrl } from '../../../../../lib/media-url';

type Props = {
  courses: Course[];
  creatorName: string;
  activeDomain: UserDomain | null;
};

export default function StudentsAlsoBought({ courses, creatorName, activeDomain }: Props) {
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
    <section className='space-y-4'>
      <h2 className='text-foreground text-base font-bold sm:text-lg'>Students also bought</h2>

      <div className='xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4'>
        {courses.map((course, i) => {
          const reviews = (reviewQueries[i]?.data?.data ?? []) as CourseReview[];
          const reviewCount = reviews.length;

          const averageRating =
            reviewCount > 0
              ? (
                reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount
              ).toFixed(1)
              : '0';

          // These cards have always carried `cursor-pointer` and gone nowhere.
          // They now open the course record for the dashboard the reader is in
          // — and stay inert, rather than looking clickable, when the related
          // course came back without a uuid.
          const recordHref = course.uuid
            ? roleScopedDashboardPath(
              activeDomain,
              getContentHref(activeDomain ?? 'student', 'course', course.uuid)
            )
            : undefined;

          const shellClassName =
            'group border-border block overflow-hidden rounded-xl border transition-shadow hover:shadow-md';

          const body = (
            <>
              {/* TOP AREA */}
              <div
                className={`relative aspect-video overflow-hidden ${cardAccent[i % cardAccent.length]}`}
              >
                {course?.thumbnail_url ? (
                  <>
                    <img
                      src={toAuthenticatedMediaUrl(course.thumbnail_url)!}
                      alt={course.name || 'Course thumbnail'}
                      className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />

                    <div className='bg-foreground/10 absolute inset-0' />
                  </>
                ) : (
                  <div className='flex h-full w-full flex-col items-center justify-center text-center'>
                    <BookOpen className='h-8 w-8 sm:h-8 sm:w-8' />
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className='p-3 sm:p-4'>
                <h3 className='text-foreground group-hover:text-primary mb-1.5 text-xs leading-tight font-bold transition-colors sm:text-sm'>
                  {course.name}
                </h3>

                <StarRating
                  rating={averageRating ? Number(averageRating) : 0}
                  reviewCount={reviewCount}
                  size='sm'
                />

                <p className='text-foreground mt-2 text-xs font-bold sm:text-sm'>
                  From{' '}
                  {typeof course.minimum_training_fee === 'number'
                    ? `Ksh ${course.minimum_training_fee.toLocaleString()}`
                    : 'Ksh --'}
                </p>

                <p className='text-muted-foreground mt-1 text-[11px] sm:text-xs'>{creatorName}</p>
              </div>
            </>
          );

          return recordHref ? (
            <Link key={course.uuid ?? course.name} href={recordHref} className={shellClassName}>
              {body}
            </Link>
          ) : (
            <div key={course.uuid ?? course.name} className={shellClassName}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
