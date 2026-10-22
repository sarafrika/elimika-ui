'use client';

import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useQuizzesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getGradeBandsOptions,
  getGradeBandsQueryKey,
  getQuizSchedulesOptions,
  getQuizSchedulesQueryKey,
  searchQuestionsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { SessionReport } from '@/services/client/types.gen';
import { belongsToSession } from './assessment-scheduling';
import type { LessonGradingTask } from './LessonGradingPanel';
import {
  reportAssignmentMarks,
  reportRowKey,
  summarizeReportScores,
  type ReportTaskMark,
} from './session-report-scores';
import { useLessonTaskGrades } from './useLessonTaskGrades';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';

/** School viewers use the report snapshot; only instructors supplement it with live quiz grades. */
export function useSessionReportScores(report: SessionReport, includeLiveQuizzes: boolean) {
  const classId = includeLiveQuizzes ? report.class_definition_uuid : undefined;
  const courseId = report.course_uuid;
  const schedules = useQuery({
    ...(classId
      ? getQuizSchedulesOptions({ path: { classUuid: classId } })
      : { queryKey: getQuizSchedulesQueryKey({ path: { classUuid: '' } }), queryFn: skipToken }),
    enabled: Boolean(classId && report.instance_uuid && report.lesson_uuid),
    staleTime: STALE_TIMES.live,
  });
  const bands = useQuery({
    ...(courseId
      ? getGradeBandsOptions({ path: { courseUuid: courseId } })
      : { queryKey: getGradeBandsQueryKey({ path: { courseUuid: '' } }), queryFn: skipToken }),
    enabled: Boolean(courseId),
    staleTime: STALE_TIMES.reference,
  });
  const quizIds = useMemo(() => {
    if (
      !includeLiveQuizzes ||
      !report.instance_uuid ||
      !report.lesson_uuid ||
      hasApiError(schedules.data)
    )
      return [];
    return [
      ...new Set(
        (schedules.data?.data ?? [])
          .filter(
            schedule =>
              schedule.lesson_uuid === report.lesson_uuid &&
              (!schedule.class_definition_uuid || schedule.class_definition_uuid === classId) &&
              belongsToSession(schedule, report.instance_uuid)
          )
          .flatMap(schedule => (schedule.quiz_uuid ? [schedule.quiz_uuid] : []))
      ),
    ].sort();
  }, [schedules.data, report.lesson_uuid, report.instance_uuid, classId, includeLiveQuizzes]);
  const quizzes = useQuizzesByIds(quizIds);
  const questions = useInfiniteQuery({
    ...searchQuestionsInfiniteOptions({
      query: {
        searchParams: { quiz_uuid_in: quizIds.join(',') },
        pageable: { size: WORKBOOK_PAGE_SIZE },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: quizIds.length > 0,
    staleTime: STALE_TIMES.entity,
  });
  const questionError = questions.isError || Boolean(questions.data?.pages.some(hasApiError));
  const { hasNextPage, isFetching, fetchNextPage } = questions;
  useEffect(() => {
    if (quizIds.length && hasNextPage && !isFetching && !questionError) void fetchNextPage();
  }, [quizIds.length, hasNextPage, isFetching, questionError, fetchNextPage]);
  const tasks = useMemo<LessonGradingTask[]>(() => {
    const maxima = new Map<string, number>();
    for (const page of questions.data?.pages ?? []) {
      if (hasApiError(page)) continue;
      for (const question of page.data?.content ?? []) {
        if (quizIds.includes(question.quiz_uuid) && Number.isFinite(question.points)) {
          maxima.set(question.quiz_uuid, (maxima.get(question.quiz_uuid) ?? 0) + question.points);
        }
      }
    }
    return quizIds.map(uuid => ({
      id: `quiz:${uuid}`,
      kind: 'quiz',
      uuid,
      title: quizzes.quizMap[uuid]?.title ?? 'Quiz',
      maxPoints: maxima.get(uuid),
    }));
  }, [quizIds, quizzes.quizMap, questions.data]);
  const enrollmentIds = useMemo(
    () =>
      (report.rows ?? []).flatMap(row =>
        row.course_enrollment_uuid ? [row.course_enrollment_uuid] : []
      ),
    [report.rows]
  );
  const grades = useLessonTaskGrades(tasks, enrollmentIds);
  const summary = useMemo(() => {
    const assignments = reportAssignmentMarks(report);
    const entries = (report.rows ?? []).map((row, index) => {
      const quizMarks: ReportTaskMark[] = tasks.map(task => {
        const attempt = row.course_enrollment_uuid
          ? grades.attemptMap.get(`${row.course_enrollment_uuid}-${task.uuid}`)
          : undefined;
        return {
          id: task.id,
          title: task.title,
          kind: 'quiz',
          status: attempt?.status,
          score: attempt?.score,
          maxScore: attempt?.max_score ?? task.maxPoints,
        };
      });
      return {
        key: reportRowKey(row, index),
        marks: [...(assignments[index] ?? []), ...quizMarks],
      };
    });
    return summarizeReportScores(entries, hasApiError(bands.data) ? [] : (bands.data?.data ?? []));
  }, [report, tasks, grades.attemptMap, bands.data]);
  return {
    summary,
    isLoading:
      schedules.isLoading ||
      bands.isLoading ||
      quizzes.isLoading ||
      questions.isLoading ||
      Boolean(hasNextPage && !questionError) ||
      grades.quizLoading,
    isError:
      schedules.isError ||
      hasApiError(schedules.data) ||
      bands.isError ||
      hasApiError(bands.data) ||
      quizzes.isError ||
      questionError ||
      grades.quizError,
    refetch: () => {
      if (classId && report.instance_uuid && report.lesson_uuid) void schedules.refetch();
      if (courseId) void bands.refetch();
      void quizzes.refetch();
      if (quizIds.length) void questions.refetch();
      grades.refetch();
    },
  };
}
