import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getClassScheduleInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Lesson } from '@/services/client/types.gen';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';

/**
 * The lesson a class session teaches, by the backend's rule: the lesson at the session's position
 * among the class's non-cancelled sessions (submitting a report freezes it). Undefined while loading.
 */
export function useSessionLesson(classId: string, sessionId: string | null, lessons: Lesson[]) {
  const query = useInfiniteQuery({
    ...getClassScheduleInfiniteOptions({
      path: { uuid: classId },
      query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(classId && sessionId),
  });
  return useMemo(() => {
    if (!sessionId || !query.data) return undefined;
    const sessions = query.data.pages
      .flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? [])))
      .filter(session => session.uuid && session.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const session = sessions.find(item => item.uuid === sessionId);
    if (!session) return undefined;
    const active = lessons.filter(lesson => lesson.active !== false).sort((a, b) => a.lesson_number - b.lesson_number);
    return active[sessions.indexOf(session)];
  }, [query.data, sessionId, lessons]);
}
