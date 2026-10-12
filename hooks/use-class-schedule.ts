import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { STALE_TIMES } from '@/lib/query-client';
import { getClassScheduleOptions } from '../services/client/@tanstack/react-query.gen';
import type { ScheduledInstance } from '../services/client/types.gen';

const SCHEDULE_PAGE_SIZE = 200;
// 2,000 sessions: far beyond any real class, but still a hard ceiling on requests.
const MAX_SCHEDULE_PAGES = 10;

function scheduleOptions(classUuid: string, page: number) {
  return getClassScheduleOptions({
    path: { uuid: classUuid },
    query: { pageable: { page, size: SCHEDULE_PAGE_SIZE } },
  });
}

type PageResult = {
  data?: { data?: { content?: ScheduledInstance[] } };
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

// Module-level so useQueries can memoise the combined result between renders.
function combinePages(results: PageResult[]) {
  return {
    pages: results.map(result => result.data?.data?.content ?? []),
    isLoading: results.some(result => result.isLoading),
    isSuccess: results.every(result => result.isSuccess),
    isError: results.some(result => result.isError),
  };
}

// Every session of one class, paged in full so end dates and counts are exact. Only call it for a
// class the viewer is looking at (enrolment page, an opened card), never once per listed class.
export function useClassSchedule(classUuid: string | undefined, enabled = true) {
  const active = enabled && !!classUuid;

  const firstPage = useQuery({
    ...scheduleOptions(classUuid ?? '', 0),
    enabled: active,
    staleTime: STALE_TIMES.live,
  });

  const metadata = firstPage.data?.data?.metadata;
  const totalPages = metadata?.totalPages ?? 1;
  const pageCount = Math.min(totalPages, MAX_SCHEDULE_PAGES);

  useEffect(() => {
    if (active && totalPages > MAX_SCHEDULE_PAGES) {
      logger.warn('Class schedule truncated at the page ceiling', { classUuid, totalPages });
    }
  }, [active, classUuid, totalPages]);

  const extraPages = useMemo(
    () =>
      active && firstPage.isSuccess
        ? Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) => index + 1)
        : [],
    [active, firstPage.isSuccess, pageCount]
  );

  const rest = useQueries({
    queries: extraPages.slice(0, MAX_SCHEDULE_PAGES - 1).map(page => ({
      ...scheduleOptions(classUuid ?? '', page),
      staleTime: STALE_TIMES.live,
    })),
    combine: combinePages,
  });

  const firstContent = firstPage.data?.data?.content;
  const schedule: ScheduledInstance[] = useMemo(
    () => [...(firstContent ?? []), ...rest.pages.flat()],
    [firstContent, rest.pages]
  );

  const total = metadata?.totalElements;
  return {
    schedule,
    sessionCount: total === undefined ? schedule.length : Number(total),
    isLoaded: active && firstPage.isSuccess && rest.isSuccess,
    isLoading: active && (firstPage.isLoading || rest.isLoading),
    isError: firstPage.isError || rest.isError,
  };
}
