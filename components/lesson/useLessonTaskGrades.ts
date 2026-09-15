'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import {
  searchAttemptsInfiniteOptions,
  searchSubmissionsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { newestSubmissionsFirst } from './grading';
import type { LessonGradingTask } from './LessonGradingPanel';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';

export function useLessonTaskGrades(tasks: LessonGradingTask[], enrollmentIds: string[]) {
  const assignmentIds = useMemo(
    () =>
      [...new Set(tasks.filter(task => task.kind === 'assignment').map(task => task.uuid))]
        .filter(Boolean)
        .sort()
        .join(','),
    [tasks]
  );
  const quizIds = useMemo(
    () =>
      [...new Set(tasks.filter(task => task.kind === 'quiz').map(task => task.uuid))]
        .filter(Boolean)
        .sort()
        .join(','),
    [tasks]
  );
  const enrollmentFilter = useMemo(
    () => [...new Set(enrollmentIds)].filter(Boolean).sort().join(','),
    [enrollmentIds]
  );
  // Fetch both task types in batches, scoped to the students and tasks on screen.
  const submissions = useInfiniteQuery({
    ...searchSubmissionsInfiniteOptions({
      query: {
        searchParams: { assignmentUuid_in: assignmentIds, enrollmentUuid_in: enrollmentFilter },
        pageable: { size: WORKBOOK_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(assignmentIds && enrollmentFilter),
    staleTime: STALE_TIMES.live,
  });
  const attempts = useInfiniteQuery({
    ...searchAttemptsInfiniteOptions({
      query: {
        searchParams: { quizUuid_in: quizIds, enrollmentUuid_in: enrollmentFilter },
        pageable: { size: WORKBOOK_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(quizIds && enrollmentFilter),
    staleTime: STALE_TIMES.live,
  });
  const submissionError = submissions.isError || submissions.data?.pages.some(hasApiError);
  const attemptError = attempts.isError || attempts.data?.pages.some(hasApiError);
  const {
    hasNextPage: moreSubmissions,
    isFetching: fetchingSubmissions,
    fetchNextPage: nextSubmissions,
  } = submissions;
  const {
    hasNextPage: moreAttempts,
    isFetching: fetchingAttempts,
    fetchNextPage: nextAttempts,
  } = attempts;

  // Finish the scoped pages before treating a missing record as not submitted.
  useEffect(() => {
    if (
      assignmentIds &&
      enrollmentFilter &&
      moreSubmissions &&
      !fetchingSubmissions &&
      !submissionError
    )
      void nextSubmissions();
  }, [
    assignmentIds,
    enrollmentFilter,
    moreSubmissions,
    fetchingSubmissions,
    submissionError,
    nextSubmissions,
  ]);
  useEffect(() => {
    if (quizIds && enrollmentFilter && moreAttempts && !fetchingAttempts && !attemptError)
      void nextAttempts();
  }, [quizIds, enrollmentFilter, moreAttempts, fetchingAttempts, attemptError, nextAttempts]);

  const submissionMap = useMemo(() => {
    const items = newestSubmissionsFirst(
      submissions.data?.pages.flatMap(page =>
        hasApiError(page) ? [] : (page.data?.content ?? [])
      ) ?? []
    );
    // Reverse insertion preserves the newest submission for each student/task pair.
    return new Map(
      items.reverse().map(item => [`${item.enrollment_uuid}-${item.assignment_uuid}`, item])
    );
  }, [submissions.data]);
  const attemptMap = useMemo(() => {
    const items = newestSubmissionsFirst(
      attempts.data?.pages.flatMap(page => (hasApiError(page) ? [] : (page.data?.content ?? []))) ??
        []
    );
    return new Map(
      items.reverse().map(item => [`${item.enrollment_uuid}-${item.quiz_uuid}`, item])
    );
  }, [attempts.data]);

  return {
    submissionMap,
    attemptMap,
    assignmentLoading: submissions.isLoading || Boolean(moreSubmissions && !submissionError),
    quizLoading: attempts.isLoading || Boolean(moreAttempts && !attemptError),
    assignmentError: Boolean(submissionError),
    quizError: Boolean(attemptError),
    refetch: () => {
      if (assignmentIds && enrollmentFilter) void submissions.refetch();
      if (quizIds && enrollmentFilter) void attempts.refetch();
    },
  };
}
