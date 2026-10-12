'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import { client } from '@/services/client/client.gen';
import {
  type CourseOpenClasses,
  courseOpenClassesUrl,
  NO_OPEN_CLASSES,
  toCourseOpenClasses,
} from './open-classes';

const BEARER = [{ scheme: 'bearer', type: 'http' }] as const;

/** `client.get<T>()` unwraps `T[keyof T]`, so the status-keyed shape is what it wants. */
type OpenClassesResponses = { 200: unknown };

/**
 * Swap point: once the client is regenerated this becomes the generated
 * `getCourseOpenClassesQueryKey` / `…Options` pair.
 */
export const courseOpenClassesQueryKey = (courseUuid: string) =>
  ['course-open-classes', courseUuid] as const;

export async function fetchCourseOpenClasses(
  courseUuid: string,
  signal?: AbortSignal
): Promise<CourseOpenClasses> {
  const { data, error, response } = await client.get<OpenClassesResponses>({
    url: courseOpenClassesUrl(courseUuid),
    security: BEARER,
    signal,
  });
  // Until the endpoint is deployed an unknown path answers 401 to a visitor and 404 to a
  // signed-in user: that reads as "no open classes yet", not as a failure.
  if (response?.status === 401 || response?.status === 404) return NO_OPEN_CLASSES;
  if (error) throw error;
  const offer = toCourseOpenClasses(data);
  if (!offer) throw new Error('The open classes answered with an unexpected shape.');
  return offer;
}

/** The classes a learner can still join for one course, and the lowest fee among them. */
export function useCourseOpenClasses(courseUuid: string | undefined) {
  return useQuery({
    queryKey: courseOpenClassesQueryKey(courseUuid ?? ''),
    queryFn: ({ signal }) => fetchCourseOpenClasses(courseUuid ?? '', signal),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.live,
  });
}
