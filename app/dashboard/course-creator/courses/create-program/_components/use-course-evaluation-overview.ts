'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseLessonsInfiniteOptions,
  searchAssignmentsInfiniteOptions,
  searchQuestionsInfiniteOptions,
  searchQuizzesInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  buildCourseEvaluationLessons,
  evaluationPageFailed,
  type EvaluationPage,
  nextCourseEvaluationPage,
} from '../program-course-evaluations';

type PagedRead<T> = {
  data?: { pages: EvaluationPage<T>[] };
  isError: boolean;
  isPending: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
};

// Finish each scoped search before starting its dependent batch. No per-lesson or per-quiz reads.
function useCompleteEvaluationPages<T>(query: PagedRead<T>, enabled: boolean) {
  const { data, isError, isPending, isFetching, hasNextPage, fetchNextPage } = query;
  const failed = isError || Boolean(data?.pages.some(evaluationPageFailed));
  useEffect(() => {
    if (enabled && hasNextPage && !isFetching && !failed) void fetchNextPage();
  }, [enabled, hasNextPage, isFetching, failed, fetchNextPage]);
  const ready = enabled && !failed && !isPending && !hasNextPage;
  const rows = useMemo(
    () => (ready ? (data?.pages.flatMap(page => page.data?.content ?? []) ?? []) : []),
    [data, ready]
  );
  return { failed: enabled && failed, ready, rows };
}

export function useCourseEvaluationOverview(courseUuid: string) {
  const enabled = Boolean(courseUuid);
  const lessonsQuery = useInfiniteQuery({
    ...getCourseLessonsInfiniteOptions({
      path: { courseUuid },
      query: { pageable: { page: 0, size: 50 } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextCourseEvaluationPage,
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const lessons = useCompleteEvaluationPages(lessonsQuery, enabled);
  const lessonIds = useMemo(
    () =>
      [
        ...new Set(
          lessons.rows
            .filter(row => row.course_uuid === courseUuid)
            .flatMap(row => (row.uuid ? [row.uuid] : []))
        ),
      ].sort(),
    [lessons.rows, courseUuid]
  );
  const assessmentsEnabled = lessons.ready && lessonIds.length > 0;
  const searchParams = { lesson_uuid_in: lessonIds.join(',') };
  const assignmentsQuery = useInfiniteQuery({
    ...searchAssignmentsInfiniteOptions({
      query: { searchParams, pageable: { page: 0, size: 100 } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextCourseEvaluationPage,
    enabled: assessmentsEnabled,
    staleTime: STALE_TIMES.entity,
  });
  const quizzesQuery = useInfiniteQuery({
    ...searchQuizzesInfiniteOptions({
      query: { searchParams, pageable: { page: 0, size: 100 } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextCourseEvaluationPage,
    enabled: assessmentsEnabled,
    staleTime: STALE_TIMES.entity,
  });
  const assignments = useCompleteEvaluationPages(assignmentsQuery, assessmentsEnabled);
  const quizzes = useCompleteEvaluationPages(quizzesQuery, assessmentsEnabled);
  const quizIds = useMemo(
    () =>
      [
        ...new Set(
          quizzes.rows
            .filter(
              row =>
                lessonIds.includes(row.lesson_uuid) &&
                row.scope !== 'CLASS_CLONE' &&
                !row.class_definition_uuid
            )
            .flatMap(row => (row.uuid ? [row.uuid] : []))
        ),
      ].sort(),
    [quizzes.rows, lessonIds]
  );
  const questionsEnabled = quizzes.ready && quizIds.length > 0;
  const questionsQuery = useInfiniteQuery({
    ...searchQuestionsInfiniteOptions({
      query: {
        searchParams: { quiz_uuid_in: quizIds.join(',') },
        pageable: { page: 0, size: 100 },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextCourseEvaluationPage,
    enabled: questionsEnabled,
    staleTime: STALE_TIMES.entity,
  });
  const questions = useCompleteEvaluationPages(questionsQuery, questionsEnabled);
  const overview = useMemo(
    () =>
      buildCourseEvaluationLessons(
        courseUuid,
        lessons.rows,
        assignments.rows,
        quizzes.rows,
        questions.rows
      ),
    [courseUuid, lessons.rows, assignments.rows, quizzes.rows, questions.rows]
  );
  const failed = lessons.failed || assignments.failed || quizzes.failed || questions.failed;
  const loading =
    !failed &&
    (!lessons.ready ||
      (assessmentsEnabled && (!assignments.ready || !quizzes.ready)) ||
      (questionsEnabled && !questions.ready));
  const retry = () => {
    if (lessons.failed) void lessonsQuery.refetch();
    if (assignments.failed) void assignmentsQuery.refetch();
    if (quizzes.failed) void quizzesQuery.refetch();
    if (questions.failed) void questionsQuery.refetch();
  };
  return { lessons: overview, loading, failed, retry };
}
