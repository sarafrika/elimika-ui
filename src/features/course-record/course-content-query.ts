import { queryOptions } from '@tanstack/react-query';
import { getCourseContentQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { getCourseContent } from '@/services/client/sdk.gen';

/**
 * Course content where 404 means "no access": resolves to null (outline view)
 * instead of erroring, and never retries, since a 404/403 will not change.
 */
export function courseContentQueryOptions(courseUuid: string) {
  return queryOptions({
    queryKey: getCourseContentQueryKey({ path: { courseUuid } }),
    queryFn: async ({ queryKey, signal }) => {
      const { data, error, response } = await getCourseContent({ ...queryKey[0], signal });
      if (error) {
        if (response?.status === 404) return null;
        throw error;
      }
      return data ?? null;
    },
    retry: false,
  });
}
