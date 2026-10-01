'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import type { MouseEvent } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { getSimilarCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { RecommendedCourse } from '@/services/client/types.gen';
import type { CatalogueItem } from '@/src/features/catalogue/catalogue-search';
import {
  CatalogueItemCard,
  CatalogueItemCardSkeleton,
} from '@/src/features/catalogue/components/CatalogueItemCard';
import { stripRichText } from '@/src/features/catalogue/format';
import { sendDiscoveryEvent } from '@/src/features/discovery/discovery-events';

const SIMILAR_LIMIT = 8;

const toCatalogueItem = (course: RecommendedCourse & { course_uuid: string }): CatalogueItem => ({
  type: 'course',
  uuid: course.course_uuid,
  title: course.name ?? 'Course',
  description: stripRichText(course.description) || null,
  thumbnail_url: course.thumbnail_url ?? null,
});

/**
 * Similar courses (`GET /api/v1/courses/{uuid}/similar`, anonymous-capable) as catalogue
 * cards. Opening one records a CLICK discovery event against the list's recommendation id,
 * as the dashboard rail does.
 */
export function CourseSimilarPanel({
  courseUuid,
  signedIn,
}: {
  courseUuid: string;
  signedIn: boolean;
}) {
  const query = useQuery({
    ...getSimilarCoursesOptions({ path: { uuid: courseUuid }, query: { limit: SIMILAR_LIMIT } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
    retry: retryUnlessClientOrSearchError,
  });

  const courses = (query.data?.data ?? []).filter(
    (course): course is RecommendedCourse & { course_uuid: string } => Boolean(course.course_uuid)
  );

  if (query.isPending) {
    return (
      <div className={surfaceTheme.cardGrid} aria-busy='true'>
        {[0, 1, 2, 3].map(cell => (
          <CatalogueItemCardSkeleton key={cell} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <EmptyState
        variant='card'
        title='Similar courses are unavailable right now'
        description='This does not affect the course itself.'
        action={
          <Button variant='outline' onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        variant='card'
        icon={Sparkles}
        title='No similar courses yet'
        description='Courses like this one appear here as the catalogue grows.'
      />
    );
  }

  const trackOpen =
    (course: RecommendedCourse & { course_uuid: string }, position: number) =>
    (event: MouseEvent<HTMLLIElement>) => {
      if (!(event.target instanceof Element) || !event.target.closest('a')) return;
      sendDiscoveryEvent({
        recommendationId: course.recommendation_id,
        itemUuid: course.course_uuid,
        itemType: 'course',
        eventType: 'CLICK',
        position,
      });
    };

  return (
    <ul className={surfaceTheme.cardGrid}>
      {courses.map((course, position) => (
        // Captures the card's own link clicks (and Enter on a focused link) for discovery.
        <li
          key={course.course_uuid}
          className='min-w-0'
          onClickCapture={trackOpen(course, position)}
        >
          <CatalogueItemCard item={toCatalogueItem(course)} signedIn={signedIn} />
        </li>
      ))}
    </ul>
  );
}
