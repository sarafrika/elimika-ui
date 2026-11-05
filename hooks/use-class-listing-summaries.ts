import { logger } from '@/lib/logger';
import { STALE_TIMES } from '@/lib/query-client';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  getClassesBatchOptions,
  getStudentCourseOverviewOptions,
  searchCatalogueOptions
} from '../services/client/@tanstack/react-query.gen';
import type {
  ClassBatchSummary,
  CommerceCatalogueItem,
} from '../services/client/types.gen';
import type { CardInstructor } from '../src/features/dashboard/courses/types';

// Matches ClassBatchLookupService.MAX_BATCH_SIZE on the backend.
const CLASS_BATCH_SIZE = 100;
const MAX_CLASS_BATCHES = 5;
const STUDENT_OVERVIEW_PAGE_SIZE = 50;
const MAX_STUDENT_OVERVIEW_PAGES = 10;
const MAX_CATALOGUE_PAGES = 5;

type CatalogueScope = {
  class_definition_uuid?: string;
  class_uuid?: string;
  course_uuid?: string;
  program_uuid?: string;
};

// Seat counts (batch class endpoint), the viewer's own enrolments and the catalogue rows for one
// course or program, in a fixed number of requests however many classes are listed.
export function useClassListingSummaries(
  classUuids: string[],
  catalogueScope: CatalogueScope | undefined,
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
        if (result.data?.error || result.data?.success === false) continue;
        for (const summary of result.data?.data ?? []) {
          if (summary.uuid) summaryMap[summary.uuid] = summary;
        }
      }
      return {
        summaryMap,
        isLoading: results.some(r => r.isLoading),
        isError: results.some(r => r.isError || r.data?.error || r.data?.success === false),
      };
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
  const overviewFailed = overviewQuery.data?.error || overviewQuery.data?.success === false;
  const overview = overviewFailed ? undefined : overviewQuery.data?.data?.enrollments;
  const overviewPageCount = overview?.metadata?.totalPages ?? 1;
  const overviewTooLarge = overviewPageCount > MAX_STUDENT_OVERVIEW_PAGES;
  const remainingOverview = useQueries({
    queries: Array.from(
      { length: overviewTooLarge ? 0 : Math.max(0, overviewPageCount - 1) },
      (_, index) => ({
        ...getStudentCourseOverviewOptions({
          path: { studentUuid: studentUuid ?? '' },
          query: { pageable: { page: index + 1, size: STUDENT_OVERVIEW_PAGE_SIZE } },
        }),
        enabled: Boolean(studentUuid) && overviewQuery.isSuccess && !overviewFailed,
        staleTime: STALE_TIMES.live,
      })
    ),
    combine: results => ({
      rows: results.flatMap(result =>
        result.data?.error || result.data?.success === false
          ? []
          : (result.data?.data?.enrollments?.content ?? [])
      ),
      isLoading: results.some(result => result.isPending),
      isError: results.some(
        result => result.isError || result.data?.error || result.data?.success === false
      ),
    }),
  });

  const enrolledClassUuids = useMemo(
    () =>
      new Set(
        [...(overview?.content ?? []), ...remainingOverview.rows].map(
          item => item.class_definition_uuid
        )
      ),
    [overview, remainingOverview.rows]
  );

  // Class mappings take priority: search the listed ids together, never once per class.
  // Only fall back to course/program scope when no class ids are available.
  const catalogueFilters = useMemo((): Record<string, string>[] => {
    const classUuid = catalogueScope?.class_definition_uuid || catalogueScope?.class_uuid;
    if (classUuid) return [{ class_definition_uuid: classUuid }];
    if (chunks.length > 0) {
      return chunks.slice(0, MAX_CLASS_BATCHES).map<Record<string, string>>(ids =>
        ids.length === 1
          ? { class_definition_uuid: ids.join(',') }
          : { class_definition_uuid_in: ids.join(',') }
      );
    }
    if (catalogueScope?.course_uuid) return [{ course_uuid: catalogueScope.course_uuid }];
    if (catalogueScope?.program_uuid) return [{ program_uuid: catalogueScope.program_uuid }];
    return [];
  }, [
    chunks,
    catalogueScope?.class_definition_uuid,
    catalogueScope?.class_uuid,
    catalogueScope?.course_uuid,
    catalogueScope?.program_uuid,
  ]);
  const catalogueQueries = useQueries({
    queries: catalogueFilters.slice(0, MAX_CATALOGUE_PAGES).map(searchParams => ({
      ...searchCatalogueOptions({
        query: { searchParams, pageable: { page: 0, size: CLASS_BATCH_SIZE } },
      }),
      staleTime: STALE_TIMES.reference,
    })),
  });
  const cataloguePageCount = catalogueQueries.reduce(
    (total, result) =>
      total +
      (result.data?.error || result.data?.success === false
        ? 1
        : Math.max(1, result.data?.data?.metadata?.totalPages ?? 1)),
    0
  );
  const catalogueTooLarge = cataloguePageCount > MAX_CATALOGUE_PAGES;
  const remainingCatalogue = useQueries({
    queries: catalogueTooLarge
      ? []
      : catalogueQueries.flatMap((result, index) => {
        if (!result.isSuccess || result.data?.error || result.data?.success === false) return [];
        const searchParams = catalogueFilters[index];
        if (!searchParams) return [];
        return Array.from(
          { length: Math.max(0, (result.data?.data?.metadata?.totalPages ?? 1) - 1) },
          (_, page) => ({
            ...searchCatalogueOptions({
              query: {
                searchParams,
                pageable: { page: page + 1, size: CLASS_BATCH_SIZE },
              },
            }),
            staleTime: STALE_TIMES.reference,
          })
        );
      }),
  });

  const catalogueResponses = [...catalogueQueries, ...remainingCatalogue];
  const catalogueLoading = catalogueResponses.some(result => result.isLoading);
  const catalogueError =
    catalogueTooLarge ||
    catalogueResponses.some(
      result => result.isError || result.data?.error || result.data?.success === false
    );

  const catalogueMap = useMemo(() => {
    const map: Record<string, CommerceCatalogueItem> = {};
    const classUuid = catalogueScope?.class_definition_uuid || catalogueScope?.class_uuid;
    const wanted = new Set(classUuid ? [classUuid] : classUuids);
    for (const result of [...catalogueQueries, ...remainingCatalogue]) {
      if (result.data?.error || result.data?.success === false) continue;
      for (const item of result.data?.data?.content ?? []) {
        if (
          item.class_definition_uuid &&
          (wanted.size === 0 || wanted.has(item.class_definition_uuid))
        ) {
          map[item.class_definition_uuid] = item;
        }
      }
    }
    return map;
  }, [
    catalogueQueries,
    remainingCatalogue,
    classUuids,
    catalogueScope?.class_definition_uuid,
    catalogueScope?.class_uuid,
  ]);

  return {
    summaryMap: batch.summaryMap,
    enrolledClassUuids,
    catalogueMap,
    isLoading:
      batch.isLoading ||
      overviewQuery.isLoading ||
      remainingOverview.isLoading ||
      catalogueLoading,
    isError:
      batch.isError ||
      chunks.length > MAX_CLASS_BATCHES ||
      overviewQuery.isError ||
      Boolean(overviewFailed) ||
      overviewTooLarge ||
      remainingOverview.isError ||
      catalogueError,
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
