'use client';

import { STALE_TIMES } from '@/lib/query-client';
import {
  CourseAssessment,
  CourseTrainingApplication,
  ProgramTrainingApplication,
  type Assignment,
  type Course,
  type Instructor,
  type Quiz,
  type SearchResponse,
  type Student,
  type TrainingProgram,
  type User
} from '@/services/client';
import {
  getCourseAssessmentsOptions,
  searchAssignmentsOptions,
  searchCoursesOptions,
  searchInstructorsOptions,
  searchOptions,
  searchProgramTrainingApplicationsOptions,
  searchQuizzesOptions,
  searchStudentsOptions,
  searchTrainingApplicationsOptions,
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

function useSearchByField<T>(
  values: string[],
  buildSearchParams: (chunk: string[]) => Record<string, string>,
  optionsFactory: SearchOptionsFactory,
  staleTime = STALE_TIMES.entity,
  pageSize = CHUNK_SIZE
) {
  const uniqueValues = useMemo(
    () => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [values]
  );

  const valueChunks = useMemo(
    () => (uniqueValues.length ? chunk(uniqueValues, CHUNK_SIZE) : [[]]),
    [uniqueValues]
  );

  return useQueries({
    queries: valueChunks.map(valueChunk => ({
      ...optionsFactory({
        query: {
          searchParams: buildSearchParams(valueChunk),
          pageable: {
            page: 0,
            size: pageSize,
          },
        },
      }),
      staleTime,
    })),
    combine: results => ({
      items: results.flatMap(
        result =>
        (((result.data as SearchResponse | undefined)?.data?.content ??
          []) as T[])
      ),
      isLoading: results.some(result => result.isLoading),
    }),
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

export function useTrainingApplicationsByCourseCreatorIds(courseCreatorIds: string[]) {
  return useSearchByField<CourseTrainingApplication>(
    courseCreatorIds,
    chunk => ({
      course_creator_uuid: chunk[0],
    }),
    searchTrainingApplicationsOptions,
    STALE_TIMES.entity,
    100
  );
}

export function useProgramTrainingApplicationsByCourseCreatorIds() {
  return useSearchByField<ProgramTrainingApplication>(
    [],
    () => ({}),
    searchProgramTrainingApplicationsOptions,
    STALE_TIMES.entity,
    100
  );
}

export function useQuizzesByLessonIds(lessonUuids: string[]) {
  const uniqueLessonUuids = [...new Set(lessonUuids)];

  return useQueries({
    queries: uniqueLessonUuids.map(uuid => ({
      ...searchQuizzesOptions({
        query: {
          searchParams: {
            lessonUuid: uuid,
          },
          pageable: {
            page: 0,
            size: 100,
          },
        },
      }),
    })),
    combine: results => ({
      items: results.flatMap(
        result =>
          ((result.data as SearchResponse | undefined)?.data?.content ?? []) as Quiz[]
      ),
      isLoading: results.some(r => r.isLoading),
    }),
  });
}

export function useAssignmentsByLessonIds(lessonUuids: string[]) {
  const uniqueLessonUuids = [...new Set(lessonUuids)];

  return useQueries({
    queries: uniqueLessonUuids.map(uuid => ({
      ...searchAssignmentsOptions({
        query: {
          searchParams: {
            lessonUuid: uuid,
          },
          pageable: {
            page: 0,
            size: 100,
          },
        },
      }),
    })),
    combine: results => ({
      items: results.flatMap(
        result =>
          ((result.data as SearchResponse | undefined)?.data?.content ?? []) as Quiz[]
      ),
      isLoading: results.some(r => r.isLoading),
    }),
  });
}


export function useCourseAssessmentsByCourseUuids(courseUuids: string[]) {
  const uniqueCourseUuids = useMemo(
    () => [...new Set(courseUuids.filter(Boolean))].sort(),
    [courseUuids]
  );

  return useQueries({
    queries: uniqueCourseUuids.map(courseUuid => ({
      ...getCourseAssessmentsOptions({
        path: { courseUuid },
        query: { pageable: {} },
      }),
      enabled: !!courseUuid,
      staleTime: STALE_TIMES.entity,
    })),

    combine: results => {
      const assessmentMap: Record<string, CourseAssessment[]> = {};

      results.forEach((result, index) => {
        const courseUuid = uniqueCourseUuids[index];

        assessmentMap[courseUuid] =
          result.data?.data?.content ?? [];
      });

      return {
        assessmentMap,
        items: Object.values(assessmentMap).flat(),
        isLoading: results.some(r => r.isLoading),
      };
    },
  });
}

