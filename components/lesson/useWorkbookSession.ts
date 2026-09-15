'use client';

import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassScheduleInfiniteOptions,
  getScheduledInstanceOptions,
  getScheduledInstanceQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';

export function useWorkbookSession(classId: string, requestedId: string | null, enabled: boolean) {
  const query = useInfiniteQuery({
    ...getClassScheduleInfiniteOptions({
      path: { uuid: classId },
      query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: enabled && Boolean(classId),
    staleTime: STALE_TIMES.live,
  });
  const sessions = useMemo(
    () =>
      (
        query.data?.pages.flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? []))) ??
        []
      )
        .filter(session => session.uuid && session.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [query.data]
  );
  const requested = useQuery({
    ...(requestedId
      ? getScheduledInstanceOptions({ path: { instanceUuid: requestedId } })
      : {
          queryKey: getScheduledInstanceQueryKey({ path: { instanceUuid: '' } }),
          queryFn: skipToken,
        }),
    enabled:
      enabled &&
      Boolean(classId && requestedId) &&
      query.isSuccess &&
      !sessions.some(session => session.uuid === requestedId),
    staleTime: STALE_TIMES.live,
  });
  const requestedSession = hasApiError(requested.data) ? undefined : requested.data?.data;
  const available = useMemo(() => {
    if (
      requestedSession?.uuid &&
      requestedSession.class_definition_uuid === classId &&
      requestedSession.status !== 'CANCELLED' &&
      !sessions.some(item => item.uuid === requestedSession.uuid)
    ) {
      return [requestedSession, ...sessions];
    }
    return sessions;
  }, [sessions, requestedSession, classId]);
  const session = requestedId
    ? available.find(item => item.uuid === requestedId)
    : (available.find(item => new Date(item.end_time).getTime() >= Date.now()) ?? available.at(-1));
  return {
    query,
    sessions: available,
    session,
    isLoading: query.isLoading || requested.isLoading,
    isError:
      query.isError ||
      query.data?.pages.some(hasApiError) ||
      requested.isError ||
      hasApiError(requested.data),
    retry: () => {
      void query.refetch();
      if (requestedId) void requested.refetch();
    },
  };
}
