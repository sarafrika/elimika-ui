'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchErrors } from '@/hooks/use-search-query';
import { isSearchUnavailable, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { toSearchTerm } from '@/lib/search/query';
import { searchCourseContentOptions } from '@/services/client/@tanstack/react-query.gen';
import type { CourseContentSearchHit } from '@/services/client/types.gen';

/**
 * `GET /api/v1/courses/{courseUuid}/content/search` (operation `searchCourseContent`):
 * typo-tolerant search over one course's lessons, content items, quizzes and assignments.
 */
export const COURSE_CONTENT_TYPES = ['lesson', 'content', 'quiz', 'assignment'] as const;
export type CourseContentType = (typeof COURSE_CONTENT_TYPES)[number];

/** Excerpt `highlight` carries `<em>` markers; render through `Highlight`, never as HTML. */
export type CourseContentHit = CourseContentSearchHit;

/**
 * Search inside one course. Nothing is sent below two characters. A 503 (the index or
 * its reads are off, which staging may still be) marks search unavailable and is shown,
 * never retried; a 403 means the caller may not read this course.
 */
export function useCourseContentSearch({
  courseUuid,
  q,
  types,
  enabled = true,
}: {
  courseUuid: string | null | undefined;
  q: string | null | undefined;
  types?: readonly CourseContentType[];
  enabled?: boolean;
}) {
  const term = toSearchTerm(q);
  const query = useQuery({
    ...searchCourseContentOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: {
        q: term ?? '',
        page: 0,
        size: 20,
        ...(types?.length ? { types: types.join(',') } : {}),
      },
    }),
    enabled: enabled && Boolean(courseUuid) && Boolean(term),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.live,
    retry: retryUnlessClientOrSearchError,
  });
  useSearchErrors(term, query.error);

  return {
    ...query,
    term,
    hits: term ? (query.data?.data?.content ?? []) : [],
    total: Number(query.data?.data?.metadata?.totalElements ?? 0),
    searchUnavailable: isSearchUnavailable(query.error),
  };
}
