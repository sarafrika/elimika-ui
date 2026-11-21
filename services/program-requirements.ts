import { queryOptions } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import { getProgramRequirements } from '@/services/client';
import { getProgramRequirementsQueryKey } from '@/services/client/@tanstack/react-query.gen';
import type { ProgramRequirement } from '@/services/client/types.gen';

/** Load every requirement belonging to this program. */
export function allProgramRequirementsOptions(programUuid: string) {
  return queryOptions({
    queryKey: getProgramRequirementsQueryKey({
      path: { programUuid },
      query: { pageable: {} },
    }),
    enabled: Boolean(programUuid),
    staleTime: STALE_TIMES.entity,
    queryFn: async ({ signal }) => {
      if (!programUuid) throw new Error('A program is required to load training requirements.');
      const content: ProgramRequirement[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await getProgramRequirements({
          path: { programUuid },
          query: { pageable: { page, size: 100 } },
          signal,
        });
        if (error) throw error;
        if (!data || data.error || data.success === false) {
          throw new Error(data?.message || 'Failed to load program requirements.');
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
