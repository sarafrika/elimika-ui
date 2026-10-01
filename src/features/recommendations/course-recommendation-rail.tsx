'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Lock, SearchX, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  isForbidden,
  isSearchUnavailable,
  retryUnlessClientOrSearchError,
} from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { getCourseRecommendationsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { RecommendedCourse } from '@/services/client/types.gen';
import { useDiscoveryEvents } from '@/src/features/discovery/discovery-events';

type RecommendationSurface = 'for_you' | 'next_steps';

const SURFACE_COPY: Record<RecommendationSurface, { title: string; description: string }> = {
  for_you: { title: 'For you', description: 'Courses picked from your interests and goals' },
  next_steps: { title: 'Next steps', description: 'Where to go after the courses in progress' },
};

function reasonTexts(course: RecommendedCourse): string[] {
  const texts = (course.reasons ?? [])
    .map(reason => reason.text?.trim())
    .filter((text): text is string => Boolean(text));
  if (texts.length > 0) return texts.slice(0, 2);
  return course.reason ? [course.reason] : [];
}

function RecommendationCard({
  course,
  href,
  onOpen,
  onDismiss,
}: {
  course: RecommendedCourse;
  href: string;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const thumbnail = toAuthenticatedMediaUrl(course.thumbnail_url);
  const reasons = reasonTexts(course);
  const name = course.name ?? 'Untitled course';

  return (
    <li className='bg-card hover:border-primary/40 relative flex flex-col overflow-hidden rounded-lg border transition-colors'>
      <Button
        type='button'
        variant='secondary'
        size='icon'
        className='absolute top-2 right-2 z-10 size-7 rounded-full'
        onClick={onDismiss}
        aria-label={`Not interested in ${name}`}
      >
        <X className='size-3.5' />
      </Button>
      <Link href={href} onClick={onOpen} className='flex flex-1 flex-col focus-visible:outline-none'>
        <div className='bg-muted aspect-[16/9] w-full overflow-hidden'>
          {thumbnail ? (
            <img src={thumbnail} alt='' className='size-full object-cover' loading='lazy' />
          ) : (
            <div className='text-muted-foreground grid size-full place-items-center'>
              <BookOpen className='size-6' aria-hidden />
            </div>
          )}
        </div>
        <div className='space-y-1.5 p-3'>
          <p className='line-clamp-2 text-sm font-medium'>{name}</p>
          {reasons.length > 0 ? (
            <ul className='space-y-0.5' aria-label='Why this course'>
              {reasons.map(text => (
                <li key={text} className='text-muted-foreground flex gap-1.5 text-xs'>
                  <Sparkles className='text-primary mt-0.5 size-3 shrink-0' aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

/**
 * One recommendation rail (`GET /api/v1/courses/recommendations?surface=`). Clicks and
 * dismissals are reported to discovery events; a dismissed card is hidden locally.
 * Pass `studentUuid` for a guardian viewing a ward: a 403 means the ward has not shared
 * their academics.
 */
function CourseRecommendationRail({
  surface,
  courseHref,
  studentUuid,
  enabled = true,
  limit = 6,
}: {
  surface: RecommendationSurface;
  courseHref: (courseUuid: string) => string;
  studentUuid?: string | null;
  enabled?: boolean;
  limit?: number;
}) {
  const track = useDiscoveryEvents();
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const query = useQuery({
    ...getCourseRecommendationsOptions({
      query: { surface, limit, ...(studentUuid ? { student_uuid: studentUuid } : {}) },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
    retry: retryUnlessClientOrSearchError,
  });
  const copy = SURFACE_COPY[surface];
  const headingId = `recommendations-${surface}`;
  const courses = (query.data?.data ?? []).filter(
    course => course.course_uuid && !dismissed.has(course.course_uuid)
  );

  let body: ReactNode;
  if (query.isLoading) {
    body = (
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3' aria-busy='true'>
        {[0, 1, 2].map(key => (
          <Skeleton key={key} className='h-44 w-full rounded-lg' />
        ))}
      </div>
    );
  } else if (isForbidden(query.error)) {
    body = (
      <EmptyState
        variant='compact'
        icon={Lock}
        title='Not shared'
        description='This learner has not shared their academic progress with you, so we cannot suggest courses for them.'
      />
    );
  } else if (isSearchUnavailable(query.error)) {
    body = (
      <EmptyState
        variant='compact'
        icon={SearchX}
        title='Recommendations are temporarily unavailable'
        description='Please check back in a moment.'
      />
    );
  } else if (query.isError) {
    body = (
      <EmptyState
        variant='compact'
        title='Could not load recommendations'
        action={
          <Button size='sm' variant='outline' onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  } else if (courses.length === 0) {
    body = (
      <EmptyState
        variant='compact'
        icon={Sparkles}
        title='No suggestions yet'
        description={
          surface === 'next_steps'
            ? 'Make progress on a course and follow-on courses will appear here.'
            : 'Enrol in a course or set skill goals to get suggestions.'
        }
      />
    );
  } else {
    const all = query.data?.data ?? [];
    body = (
      <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {courses.map(course => {
          const uuid = course.course_uuid as string;
          const position = all.indexOf(course);
          const event = {
            recommendationId: course.recommendation_id,
            itemUuid: uuid,
            itemType: 'course' as const,
            position,
          };
          return (
            <RecommendationCard
              key={uuid}
              course={course}
              href={courseHref(uuid)}
              onOpen={() => track({ ...event, eventType: 'CLICK' })}
              onDismiss={() => {
                track({ ...event, eventType: 'DISMISS' });
                setDismissed(prev => new Set(prev).add(uuid));
              }}
            />
          );
        })}
      </ul>
    );
  }

  return (
    <section aria-labelledby={headingId} className='space-y-3'>
      <div>
        <h3 id={headingId} className='text-sm font-semibold'>
          {copy.title}
        </h3>
        <p className='text-muted-foreground text-xs'>{copy.description}</p>
      </div>
      {body}
    </section>
  );
}

/** "For you" and "Next steps" rails in one card. */
export function CourseRecommendationsCard({
  courseHref,
  studentUuid,
  enabled = true,
  title = 'Recommended courses',
  description,
}: {
  courseHref: (courseUuid: string) => string;
  studentUuid?: string | null;
  enabled?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className='space-y-6'>
        <CourseRecommendationRail
          surface='for_you'
          courseHref={courseHref}
          studentUuid={studentUuid}
          enabled={enabled}
        />
        <CourseRecommendationRail
          surface='next_steps'
          courseHref={courseHref}
          studentUuid={studentUuid}
          enabled={enabled}
        />
      </CardContent>
    </Card>
  );
}
