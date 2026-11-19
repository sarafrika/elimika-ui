'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import { getLessonsForCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Course, Lesson } from '@/services/client/types.gen';
import { hasApiError, type WorkbookRole } from './workbook-data';

const MAX_LESSON_BATCHES = 5;

export function useProgramWorkbookLessons(courses: Course[], role: WorkbookRole) {
  const batches = useMemo(() => {
    const ids = [...new Set(courses.flatMap(course => (course.uuid ? [course.uuid] : [])))];
    const result: string[][] = [];
    for (let index = 0; index < ids.length; index += 100)
      result.push(ids.slice(index, index + 100));
    return result;
  }, [courses]);
  const queries = useQueries({
    queries: batches.slice(0, MAX_LESSON_BATCHES).map(ids => ({
      ...getLessonsForCoursesOptions({ query: { course_uuids: ids } }),
      enabled: ids.length > 0,
      staleTime: STALE_TIMES.entity,
    })),
  });
  const lessonsByCourse = useMemo(() => {
    const result = new Map<string, Lesson[]>();
    for (const query of queries) {
      if (hasApiError(query.data)) continue;
      for (const lesson of query.data?.data ?? []) {
        if (
          !lesson.uuid ||
          (role === 'student' &&
            (lesson.active === false || lesson.status?.toUpperCase() !== 'PUBLISHED'))
        )
          continue;
        const lessons = result.get(lesson.course_uuid) ?? [];
        lessons.push(lesson);
        result.set(lesson.course_uuid, lessons);
      }
    }
    for (const lessons of result.values())
      lessons.sort((a, b) => a.lesson_number - b.lesson_number);
    return result;
  }, [queries, role]);
  return {
    lessonsByCourse,
    isLoading: queries.some(query => query.isLoading),
    // Never show a partial curriculum as if it were the entire programme.
    isError:
      batches.length > MAX_LESSON_BATCHES ||
      queries.some(query => query.isError || hasApiError(query.data)),
    retry: () => {
      for (const query of queries) void query.refetch();
    },
  };
}
