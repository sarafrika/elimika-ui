'use client';

import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { useSearchErrors } from '@/hooks/use-search-query';
import { isSearchUnavailable, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { STALE_TIMES } from '@/lib/query-client';
import { toSearchTerm } from '@/lib/search/query';
import { client } from '@/services/client/client.gen';
import type { PageMetadata } from '@/services/client';

/**
 * `GET /api/v1/courses/{courseUuid}/content/search` (operation `searchCourseContent`):
 * typo-tolerant search over one course's lessons, content items, quizzes and assignments.
 *
 * The endpoint is newer than the generated client, so it is called through the generated
 * client instance (same auth, interceptors and base URL) with its own query key until the
 * next `pnpm openapi-ts` adds `searchCourseContentOptions`.
 */
export const COURSE_CONTENT_TYPES = ['lesson', 'content', 'quiz', 'assignment'] as const;
export type CourseContentType = (typeof COURSE_CONTENT_TYPES)[number];

export type CourseContentHit = {
  type?: string;
  uuid?: string;
  lesson_uuid?: string;
  lesson_number?: number;
  lesson_title?: string;
  title?: string;
  /** Excerpt with `<em>` markers; render through `Highlight`, never as HTML. */
  highlight?: string;
};

type CourseContentSearchResponse = {
  data?: { content?: CourseContentHit[]; metadata?: PageMetadata };
  message?: string;
  success?: boolean;
};

export function courseContentSearchOptions({
  courseUuid,
  q,
  types,
  page = 0,
  size = 20,
}: {
  courseUuid: string;
  q: string;
  types?: readonly CourseContentType[];
  page?: number;
  size?: number;
}) {
  const query = {
    q,
    page,
    size,
    ...(types?.length ? { types: types.join(',') } : {}),
  };
  return queryOptions({
    queryKey: [{ _id: 'searchCourseContent', path: { courseUuid }, query }] as const,
    queryFn: async ({ signal }) => {
      const { data } = await client.get<{ 200: CourseContentSearchResponse }, unknown, true>({
        security: [{ scheme: 'bearer', type: 'http' }],
        url: '/api/v1/courses/{courseUuid}/content/search',
        path: { courseUuid },
        query,
        signal,
        throwOnError: true,
      });
      return data;
    },
  });
}

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
    ...courseContentSearchOptions({ courseUuid: courseUuid ?? '', q: term ?? '', types }),
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
