'use client';

import { STALE_TIMES } from '@/lib/query-client';
import { listSalesInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import type { TrainingWalletRole } from '@/src/features/wallet/training-orders';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const SALES_PAGE_SIZE = 100;

export function useTrainingSales(
  role: TrainingWalletRole,
  enabled: boolean,
  classUuid?: string,
  courseUuid?: string
) {
  const query = useInfiniteQuery({
    ...listSalesInfiniteOptions({
      query: {
        domain: role,
        scope: 'CLASS',
        ...(classUuid ? { class_definition_uuid: classUuid } : {}),
        ...(courseUuid ? { course_uuid: courseUuid } : {}),
        pageable: { page: 0, size: SALES_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      if (last.error || last.success === false) return undefined;
      const metadata = last.data?.metadata;
      const nextPage = pages.length;
      const hasNext =
        metadata?.hasNext ??
        (metadata?.totalPages != null
          ? nextPage < metadata.totalPages
          : (last.data?.content?.length ?? 0) === SALES_PAGE_SIZE);
      return hasNext ? nextPage : undefined;
    },
    enabled,
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const sales = useMemo(
    () =>
      query.data?.pages.flatMap(page =>
        page.error || page.success === false ? [] : (page.data?.content ?? [])
      ) ?? [],
    [query.data]
  );
  const failed =
    query.isError || Boolean(query.data?.pages.some(page => page.error || page.success === false));
  return {
    ...query,
    sales,
    failed,
    complete: Boolean(query.data) && !failed && !query.hasNextPage,
  };
}
