'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { surfaceTheme } from '@/components/data-display/page-shell';
import type { UserDomain } from '@/lib/types';
import type { CatalogueItem } from '@/services/client';
import { getContentHref } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import StarRating from '@/src/features/dashboard/courses/shared/_components/StarRating';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { toAuthenticatedMediaUrl } from '../../../../../lib/media-url';

/** Catalogue search rows carry rating and review count, so the cards need no extra calls. */
export type AlsoBoughtCourse = Pick<
  CatalogueItem,
  'uuid' | 'title' | 'thumbnail_url' | 'rating_avg' | 'review_count' | 'price_from' | 'price'
>;

type Props = {
  courses: AlsoBoughtCourse[];
  creatorName: string;
  activeDomain: UserDomain | null;
};

export default function StudentsAlsoBought({ courses, creatorName, activeDomain }: Props) {
  const cardAccent = ['bg-muted', 'bg-accent', 'bg-primary/10'];

  return (
    <section className='space-y-4'>
      <h2 className='text-foreground text-base font-bold sm:text-lg'>Students also bought</h2>

      <div className={surfaceTheme.cardGrid}>
        {courses.map((course, i) => {
          const reviewCount = Number(course.review_count ?? 0);
          const averageRating = reviewCount > 0 ? Number(course.rating_avg ?? 0) : 0;
          const fee = course.price_from ?? course.price;

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
                      alt={course.title || 'Course thumbnail'}
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
                  {course.title}
                </h3>

                <StarRating
                  rating={averageRating}
                  reviewCount={reviewCount}
                  size='sm'
                />

                <p className='text-foreground mt-2 text-xs font-bold sm:text-sm'>
                  From{' '}
                  {typeof fee === 'number' ? `Ksh ${fee.toLocaleString()}` : 'Ksh --'}
                </p>

                <p className='text-muted-foreground mt-1 text-[11px] sm:text-xs'>{creatorName}</p>
              </div>
            </>
          );

          return recordHref ? (
            <Link key={course.uuid ?? course.title} href={recordHref} className={shellClassName}>
              {body}
            </Link>
          ) : (
            <div key={course.uuid ?? course.title} className={shellClassName}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
