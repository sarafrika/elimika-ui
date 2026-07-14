'use client';

import { STALE_TIMES } from '@/lib/query-client';
import type {
  Assignment,
  Course,
  Instructor,
  Quiz,
  SearchResponse,
  Student,
  TrainingProgram,
  User,
} from '@/services/client';
import {
  searchAssignmentsOptions,
  searchCoursesOptions,
  searchInstructorsOptions,
  searchOptions,
  searchQuizzesOptions,
  searchStudentsOptions,
  searchTrainingProgramsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Batched entity lookups: one search request per ~100 ids (`uuid_in=` filter)
 * instead of one request per entity or an unbounded 1000-row page fetch.
 *
 * Results are keyed by uuid and filtered client-side against the requested id
 * set, so an over-broad server response can never leak unrelated rows.
 */

const CHUNK_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

type SearchOptionsFactory = (params: {
  query: {
    searchParams: Record<string, string>;
    pageable: { page: number; size: number };
  };
  // biome-ignore lint/suspicious/noExplicitAny: generated option factories have distinct option types; we only need the queryKey/queryFn shape
}) => any;

function useSearchByIds<T extends { uuid?: string }>(
  ids: string[],
  optionsFactory: SearchOptionsFactory,
  staleTime: number = STALE_TIMES.entity
) {
  const uniqueIds = useMemo(
    () => Array.from(new Set(ids.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [ids]
  );

  const idChunks = useMemo(() => chunk(uniqueIds, CHUNK_SIZE), [uniqueIds]);

  return useQueries({
    queries: idChunks.map(idChunk => ({
      ...optionsFactory({
        query: {
          searchParams: { uuid_in: idChunk.join(',') },
          pageable: { page: 0, size: idChunk.length },
        },
      }),
      staleTime,
    })),
    combine: results => {
      const map: Record<string, T> = {};
      const wanted = new Set(uniqueIds);
      for (const result of results) {
        const content = (result.data as SearchResponse | undefined)?.data?.content ?? [];
        for (const item of content as unknown as T[]) {
          if (item.uuid && wanted.has(item.uuid)) {
            map[item.uuid] = item;
          }
        }
      }
      return {
        map,
        isLoading: results.some(result => result.isLoading),
      };
    },
  });
}

export function useStudentsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Student>(ids, searchStudentsOptions);
  return { studentMap: map, isLoading };
}

export function useUsersByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<User>(ids, searchOptions);
  return { userMap: map, isLoading };
}

export function useCoursesByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Course>(ids, searchCoursesOptions, STALE_TIMES.reference);
  return { courseMap: map, isLoading };
}

export function useAssignmentsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Assignment>(ids, searchAssignmentsOptions);
  return { assignmentMap: map, isLoading };
}

export function useQuizzesByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Quiz>(ids, searchQuizzesOptions);
  return { quizMap: map, isLoading };
}

export function useProgramsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<TrainingProgram>(
    ids,
    searchTrainingProgramsOptions,
    STALE_TIMES.reference
  );
  return { programMap: map, isLoading };
}

export function useInstructorsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Instructor>(ids, searchInstructorsOptions);
  return { instructorMap: map, isLoading };
}
