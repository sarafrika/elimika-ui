'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import { getSimilarCoursesQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { getSimilarCourses } from '@/services/client/sdk.gen';
import type { GetSimilarCoursesResponse } from '@/services/client/types.gen';

/** The API 404s a course that is not public; that reads as "nothing similar", cached as such. */
export function useSimilarCourses(courseUuid: string | null | undefined, limit: number) {
  const options = { path: { uuid: courseUuid ?? '' }, query: { limit } };
  return useQuery({
    queryKey: getSimilarCoursesQueryKey(options),
    queryFn: async ({ signal }): Promise<GetSimilarCoursesResponse> => {
      const { data, error, response } = await getSimilarCourses({ ...options, signal });
      if (response?.status === 404) return { data: [] };
      if (error) throw error;
      return data ?? { data: [] };
    },
    enabled: Boolean(courseUuid),
    retry: false,
    staleTime: STALE_TIMES.entity,
  });
}
