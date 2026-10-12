import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  GetAssessmentSchedulesResponse,
} from '@/services/client';
import { getAssessmentSchedulesOptions } from '@/services/client/@tanstack/react-query.gen';

const MAX_CLASSES_PER_CALL = 100;

type ScheduleBatchResult = {
  data?: GetAssessmentSchedulesResponse;
  isLoading: boolean;
  error: unknown;
};

function combineAssessmentSchedules(results: ScheduleBatchResult[]) {
  const assignmentSchedules: ClassAssignmentSchedule[] = [];
  const quizSchedules: ClassQuizSchedule[] = [];
  for (const result of results) {
    assignmentSchedules.push(...(result.data?.data?.assignment_schedules ?? []));
    quizSchedules.push(...(result.data?.data?.quiz_schedules ?? []));
  }
  return {
    assignmentSchedules,
    quizSchedules,
    isLoading: results.some(result => result.isLoading),
    error: results.find(result => result.error)?.error ?? null,
  };
}

/** Assignment and quiz schedules for many classes: one call per 100 classes, never one per class. */
export function useClassAssessmentSchedules(classUuids: string[]) {
  const chunks = useMemo(() => {
    const unique = [...new Set(classUuids.filter(Boolean))].sort();
    const out: string[][] = [];
    for (let i = 0; i < unique.length; i += MAX_CLASSES_PER_CALL) {
      out.push(unique.slice(i, i + MAX_CLASSES_PER_CALL));
    }
    return out;
  }, [classUuids]);

  return useQueries({
    queries: chunks.map(chunk => ({
      ...getAssessmentSchedulesOptions({ query: { class_uuids: chunk } }),
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
    combine: combineAssessmentSchedules,
  });
}
