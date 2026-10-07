'use client';

import { STALE_TIMES } from '@/lib/query-client';
import { getEnrollmentsForClassOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQueryClient } from '@tanstack/react-query';

export function useClassEditEligibility(classUuid?: string | null) {
  const queryClient = useQueryClient();
  const [query] = useQueries({
    queries: [classUuid]
      .filter((uuid): uuid is string => Boolean(uuid))
      .map(uuid => ({
          ...getEnrollmentsForClassOptions({ path: { uuid } }),
          enabled: Boolean(uuid),
          staleTime: STALE_TIMES.live,
        })),
  });
  const response = query?.data;
  const responseFailed = Boolean(response && (
    response.error || response.success === false || !Array.isArray(response.data)
  ));
  const canEdit = Boolean(
    query?.isSuccess && !responseFailed && response?.data?.length === 0
  );

  const assertCanEdit = async () => {
    if (!classUuid) throw new Error('Choose a class to edit.');
    // Recheck at the point of saving: learners may have enrolled while the form was open.
    const latest = await queryClient.fetchQuery({
      ...getEnrollmentsForClassOptions({ path: { uuid: classUuid } }),
      staleTime: 0,
    });
    if (latest.error || latest.success === false || !Array.isArray(latest.data)) {
      throw new Error('Unable to check class enrollments. Please try again.');
    }
    if (latest.data.length > 0) {
      throw new Error('This class cannot be edited because learners have already enrolled.');
    }
  };

  return {
    canEdit,
    hasEnrollments: !responseFailed && Boolean(response?.data?.length),
    isLoading: Boolean(classUuid && (!query || query.isPending)),
    error: query?.error || (responseFailed ? new Error('Unable to check class enrollments.') : null),
    refetch: () => query?.refetch(),
    assertCanEdit,
  };
}
