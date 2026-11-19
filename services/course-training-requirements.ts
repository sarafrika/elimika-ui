import { queryOptions } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import { getCourseTrainingRequirements } from '@/services/client';
import { getCourseTrainingRequirementsQueryKey } from '@/services/client/@tanstack/react-query.gen';
import type {
  ApiResponsePagedDtoCourseTrainingRequirement,
  ResponseDtoVoid,
  CourseTrainingRequirement,
} from '@/services/client/types.gen';

const PAGE_SIZE = 100;

/** Load the complete course-scoped list, including pages beyond the server's default limit. */
export function allCourseTrainingRequirementsOptions(courseUuid?: string) {
  return queryOptions<ApiResponsePagedDtoCourseTrainingRequirement, ResponseDtoVoid>({
    queryKey: courseUuid
      ? getCourseTrainingRequirementsQueryKey({
          path: { courseUuid },
          query: { pageable: {} },
        })
      : [],
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
    queryFn: async ({ signal }) => {
      if (!courseUuid) throw new Error('A course is required to load training requirements.');
      const content: CourseTrainingRequirement[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await getCourseTrainingRequirements({
          path: { courseUuid },
          query: { pageable: { page, size: PAGE_SIZE } },
          signal,
        });
        if (error) throw error;
        if (!data || data.error || data.success === false) {
          throw new Error(data?.message || 'Failed to load training requirements.');
        }

        const rows = data.data?.content ?? [];
        content.push(...rows);
        const metadata = data.data?.metadata;
        const hasNext =
          metadata?.hasNext ??
          (metadata?.last !== undefined
            ? !metadata.last
            : metadata?.totalPages !== undefined
              ? page + 1 < metadata.totalPages
              : metadata?.totalElements !== undefined
                ? content.length < Number(metadata.totalElements)
                : rows.length > 0);

        if (!hasNext || rows.length === 0) {
          return { ...data, data: { ...data.data, content } };
        }
      }
    },
  });
}
