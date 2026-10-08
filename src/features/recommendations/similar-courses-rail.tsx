'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { surfaceTheme } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getSimilarCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { RecommendedCourse } from '@/services/client/types.gen';
import { sendDiscoveryEvent } from '@/src/features/discovery/discovery-events';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const SIMILAR_LIMIT = 6;

/**
 * "Similar courses" for a course detail page: `GET /api/v1/courses/{uuid}/similar`
 * (anonymous-capable). Each card shows the API's reason; opening one records a CLICK
 * discovery event against the list's `recommendation_id`. The rail hides itself when
 * there is nothing similar, so it never leaves an empty box on the record.
 */
export function SimilarCoursesRail({
  courseUuid,
  hrefFor,
  className,
  title = 'Similar courses',
}: {
  courseUuid: string | null | undefined;
  /** Where a similar course opens for this viewer's dashboard. */
  hrefFor: (courseUuid: string) => string;
  className?: string;
  title?: string;
}) {
  const query = useQuery({
    ...getSimilarCoursesOptions({
      path: { uuid: courseUuid ?? '' },
      query: { limit: SIMILAR_LIMIT },
    }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });

  const courses = (query.data?.data ?? []).filter(
    (course): course is RecommendedCourse & { course_uuid: string } => Boolean(course.course_uuid)
  );

  if (!courseUuid) return null;
  if (query.isSuccess && courses.length === 0) return null;

  return (
    <section aria-labelledby='similar-courses-heading' className={cn('space-y-3', className)}>
      <div className='flex items-center gap-2'>
        <Sparkles className='text-primary size-4' aria-hidden />
        <h2 id='similar-courses-heading' className='text-base font-semibold'>
          {title}
        </h2>
      </div>

      {query.isLoading ? (
        <div className={surfaceTheme.cardGrid} aria-busy='true'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-28 w-full rounded-xl' />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState
          variant='compact'
          title='Similar courses are unavailable right now'
          description='This does not affect the course itself.'
          action={
            <Button variant='outline' size='sm' onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <ul className={surfaceTheme.cardGrid}>
          {courses.map((course, position) => {
            const thumbnail = toAuthenticatedMediaUrl(course.thumbnail_url);
            const reason = course.reasons?.[0]?.text ?? course.reason;
            return (
              <li key={course.course_uuid}>
                <Card className='hover:border-primary/40 h-full gap-0 p-0 transition-colors'>
                  <Link
                    href={hrefFor(course.course_uuid)}
                    className='flex h-full gap-3 p-3'
                    onClick={() =>
                      sendDiscoveryEvent({
                        recommendationId: course.recommendation_id,
                        itemUuid: course.course_uuid,
                        itemType: 'course',
                        eventType: 'CLICK',
                        position,
                      })
                    }
                  >
                    <div className='bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
                      {thumbnail ? (
                        <img src={thumbnail} alt='' className='size-full object-cover' />
                      ) : (
                        <BookOpen className='text-muted-foreground size-6' aria-hidden />
                      )}
                    </div>
                    <div className='min-w-0 space-y-1'>
                      <p className='line-clamp-2 text-sm font-medium'>{course.name ?? 'Course'}</p>
                      {reason ? (
                        <p className='text-muted-foreground line-clamp-2 text-xs'>{reason}</p>
                      ) : null}
                    </div>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
