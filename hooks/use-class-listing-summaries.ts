import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassesBatchOptions,
  getStudentCourseOverviewOptions,
  resolveByCourseOrClassOptions,
} from '../services/client/@tanstack/react-query.gen';
import type { CardInstructor } from '../src/features/dashboard/courses/types';
import type {
  ClassBatchSummary,
  CommerceCatalogueItem,
  ResolveByCourseOrClassData,
} from '../services/client/types.gen';

// Matches ClassBatchLookupService.MAX_BATCH_SIZE on the backend.
const CLASS_BATCH_SIZE = 100;
const MAX_CLASS_BATCHES = 5;
const STUDENT_OVERVIEW_PAGE_SIZE = 100;

// Seat counts (batch class endpoint), the viewer's own enrolments and the catalogue rows for one
// course or program, in a fixed number of requests however many classes are listed.
export function useClassListingSummaries(
  classUuids: string[],
  catalogueScope: ResolveByCourseOrClassData['query'] | undefined,
  studentUuid?: string
) {
  const chunks = useMemo(() => {
    const unique = [...new Set(classUuids.filter(Boolean))].sort();
    const out: string[][] = [];
    for (let i = 0; i < unique.length; i += CLASS_BATCH_SIZE) {
      out.push(unique.slice(i, i + CLASS_BATCH_SIZE));
    }
    return out;
  }, [classUuids]);

  useEffect(() => {
    if (chunks.length > MAX_CLASS_BATCHES) {
      logger.warn('Class summaries capped at the batch ceiling', {
        classCount: classUuids.length,
        loaded: MAX_CLASS_BATCHES * CLASS_BATCH_SIZE,
      });
    }
  }, [chunks.length, classUuids.length]);

  const batch = useQueries({
    queries: chunks.slice(0, MAX_CLASS_BATCHES).map(uuids => ({
      ...getClassesBatchOptions({ query: { uuids } }),
      staleTime: STALE_TIMES.live,
    })),
    combine: results => {
      const summaryMap: Record<string, ClassBatchSummary> = {};
      for (const result of results) {
        for (const summary of result.data?.data ?? []) {
          if (summary.uuid) summaryMap[summary.uuid] = summary;
        }
      }
      return { summaryMap, isLoading: results.some(r => r.isLoading) };
    },
  });

  const overviewQuery = useQuery({
    ...getStudentCourseOverviewOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: { pageable: { page: 0, size: STUDENT_OVERVIEW_PAGE_SIZE } },
    }),
    enabled: !!studentUuid,
    staleTime: STALE_TIMES.live,
  });
  const overviewTotal = overviewQuery.data?.data?.enrollments?.metadata?.totalElements;
  useEffect(() => {
    if (overviewTotal !== undefined && Number(overviewTotal) > STUDENT_OVERVIEW_PAGE_SIZE) {
      logger.warn('Enrolled-class check covers only the first page of enrolments', {
        total: Number(overviewTotal),
        pageSize: STUDENT_OVERVIEW_PAGE_SIZE,
      });
    }
  }, [overviewTotal]);

  const enrolledClassUuids = useMemo(
    () =>
      new Set(
        (overviewQuery.data?.data?.enrollments?.content ?? []).map(
          item => item.class_definition_uuid
        )
      ),
    [overviewQuery.data]
  );

  // The resolve endpoint answers 404 when nothing is mapped, which simply means no catalogue rows.
  const catalogueQuery = useQuery({
    ...resolveByCourseOrClassOptions({ query: catalogueScope }),
    enabled: !!(catalogueScope?.course_uuid || catalogueScope?.program_uuid),
    staleTime: STALE_TIMES.entity,
  });
  const catalogueMap = useMemo(() => {
    const map: Record<string, CommerceCatalogueItem> = {};
    for (const item of catalogueQuery.data?.data ?? []) {
      if (item.class_definition_uuid) map[item.class_definition_uuid] = item;
    }
    return map;
  }, [catalogueQuery.data]);

  return {
    summaryMap: batch.summaryMap,
    enrolledClassUuids,
    catalogueMap,
    isLoading: batch.isLoading || overviewQuery.isLoading || catalogueQuery.isLoading,
  };
}

export function toCount(value: bigint | number | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

// Card-ready instructor from the batch summary, so listings need no separate instructor lookup.
export function toCardInstructor(
  summary: ClassBatchSummary | undefined,
  fallbackUuid?: string | null
): CardInstructor | null {
  const uuid = summary?.instructor?.uuid ?? fallbackUuid ?? undefined;
  if (!uuid) return null;
  const fullName = summary?.instructor?.display_name ?? null;
  return { uuid, full_name: fullName, name: fullName, data: { full_name: fullName } };
}
