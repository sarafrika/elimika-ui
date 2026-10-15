// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { STALE_TIMES } from '@/lib/query-client';
import { withOnData } from '@/lib/query-on-data';
import {
  ClassDefinition,
  CourseAssessment,
  getCourseTrainingRequirements,
  getProgramRequirements,
  searchCourses,
  type Assignment,
  type ClassBatchSummary,
  type Course,
  type CourseCreator,
  type CourseTrainingRequirement,
  type Enrollment,
  type Instructor,
  type Organisation,
  type ProgramRequirement,
  type Quiz,
  type SearchResponse,
  type Student,
  type TrainingProgram,
  type User,
  type UserSummary,
} from '@/services/client';
import {
  getClassDefinitionOptions,
  getClassDefinitionsForCourseOptions,
  getClassDefinitionsForInstructorOptions,
  getClassesBatchOptions,
  getCourseAssessmentsOptions,
  getEnrollmentsForClassOptions,
  getInstructorRatingSummaryOptions,
  getUserByUuidOptions,
  getUserDirectoryOptions,
  search2Options,
  searchAssignmentsOptions,
  searchCourseCreatorsOptions,
  searchCoursesQueryKey,
  searchEnrollmentsOptions,
  searchInstructorsOptions,
  searchQuizzesOptions,
  searchStudentsOptions,
  searchTrainingProgramsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, type QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

/**
 * Batched entity lookups: one search request per ~100 ids (`uuid_in=` filter)
 * instead of one request per entity or an unbounded 1000-row page fetch.
 *
 * Results are keyed by uuid and filtered client-side against the requested id
 * set, so an over-broad server response can never leak unrelated rows.
 */

const CHUNK_SIZE = 100;
export const LOOKUP_CHUNK_SIZE = CHUNK_SIZE;

/**
 * Must not exceed the backend's own cap on `GET /api/v1/users/directory`
 * (`UserController.MAX_DIRECTORY_UUIDS`), which rejects an oversized batch
 * outright rather than silently dropping the tail.
 */
const DIRECTORY_CHUNK_SIZE = 100;

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

function uniqueSortedIds(ids: (string | null | undefined)[]): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id)))).sort((a, b) =>
    a.localeCompare(b)
  );
}

/** The `uuid_in` queries for a sorted, de-duplicated id list; shared by hooks and prefetches. */
function searchByIdsQueries(
  uniqueIds: string[],
  optionsFactory: SearchOptionsFactory,
  staleTime: number
) {
  return chunk(uniqueIds, CHUNK_SIZE).map(idChunk => ({
    ...optionsFactory({
      query: {
        searchParams: { uuid_in: idChunk.join(',') },
        pageable: { page: 0, size: idChunk.length },
      },
    }),
    staleTime,
  }));
}

// biome-ignore lint/suspicious/noExplicitAny: the query objects come from distinct generated factories
function prefetchAll(queryClient: QueryClient, queries: any[]) {
  for (const query of queries) void queryClient.prefetchQuery(query);
}

function useSearchByIds<T extends { uuid?: string }>(
  ids: string[],
  optionsFactory: SearchOptionsFactory,
  staleTime: number = STALE_TIMES.entity,
  onData?: (items: T[]) => void
) {
  const uniqueIds = useMemo(() => uniqueSortedIds(ids), [ids]);
  const onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  const queries = useMemo(() => {
    const base = searchByIdsQueries(uniqueIds, optionsFactory, staleTime);
    const wanted = new Set(uniqueIds);
    // Hands each chunk's rows to `onData` on arrival, so callers can chain the next lookup.
    return base.map(query =>
      withOnData(query, data => {
        const content = ((data as SearchResponse | undefined)?.data?.content ?? []) as T[];
        onDataRef.current?.(content.filter(item => item.uuid && wanted.has(item.uuid)));
      })
    );
  }, [uniqueIds, optionsFactory, staleTime]);

  return useQueries({
    queries,
    combine: results => {
      const map: Record<string, T> = {};
      const wanted = new Set(uniqueIds);
      for (const result of results) {
        if (result.data?.error || result.data?.success === false) continue;
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
        isError: results.some(
          result => result.isError || result.data?.error || result.data?.success === false
        ),
        error: results.find(result => result.error)?.error ?? null,
        refetch: () => Promise.all(results.map(result => result.refetch())),
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
        result => ((result.data as SearchResponse | undefined)?.data?.content ?? []) as T[]
      ),
      isLoading: results.some(result => result.isLoading),
    }),
  });
}

/** `onData` receives each chunk of profiles as it lands, before render. */
export function useStudentsByIds(ids: string[], onData?: (students: Student[]) => void) {
  const { map, isLoading, isError, error, refetch } = useSearchByIds<Student>(
    ids,
    searchStudentsOptions,
    STALE_TIMES.entity,
    onData
  );
  return { studentMap: map, isLoading, isError, error, refetch };
}

/**
 * Student profiles by their user uuid (`user_uuid_in`), in chunks of at most 100: the API
 * answers 400 to a longer explicit-ID list. The map is keyed by user uuid.
 */
export function useStudentsByUserIds(userIds: string[]) {
  const uniqueIds = useMemo(
    () => Array.from(new Set(userIds.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [userIds]
  );
  const idChunks = useMemo(() => chunk(uniqueIds, CHUNK_SIZE), [uniqueIds]);

  return useQueries({
    queries: idChunks.map(idChunk => ({
      ...searchStudentsOptions({
        query: {
          searchParams: { user_uuid_in: idChunk.join(',') },
          pageable: { page: 0, size: idChunk.length },
        },
      }),
      staleTime: STALE_TIMES.entity,
    })),
    combine: results => {
      const studentMap: Record<string, Student> = {};
      const wanted = new Set(uniqueIds);
      for (const result of results) {
        if (result.data?.error || result.data?.success === false) continue;
        for (const student of result.data?.data?.content ?? []) {
          if (student.user_uuid && wanted.has(student.user_uuid)) {
            studentMap[student.user_uuid] = student;
          }
        }
      }
      return {
        studentMap,
        isLoading: results.some(result => result.isLoading),
        isError: results.some(
          result => result.isError || result.data?.error || result.data?.success === false
        ),
        error: results.find(result => result.error)?.error ?? null,
        refetch: () => Promise.all(results.map(result => result.refetch())),
      };
    },
  });
}

export function useEnrollmentsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Enrollment>(ids, searchEnrollmentsOptions);
  return { enrollmentMap: map, isLoading };
}

/**
 * Bulk directory lookup: names and avatars for a set of user uuids.
 *
 * Goes through `GET /api/v1/users/directory`, not `/users/search`. Two reasons.
 * The response is a `UserSummary` — display identity only, no email, phone
 * number or date of birth — which is all any caller here renders. And search
 * is now restricted to platform admins, because an open, filterable projection
 * of the whole user table is not something an ordinary learner needs in order
 * to draw a roster row.
 *
 * The contract is unchanged from the search-backed version: pass uuids, get a
 * map keyed by uuid. `UserSummary` is a strict subset of `User`, so the map is
 * still typed as `Record<string, User>` for call sites — fields the summary
 * does not carry simply read as undefined, exactly as they did for a user the
 * lookup could not resolve.
 *
 * The backend caps a request at {@link DIRECTORY_CHUNK_SIZE} uuids and refuses
 * anything longer rather than truncating, so the chunk size here is not a
 * tuning knob: it must stay at or below that cap.
 */
function userDirectoryQueries(uniqueIds: string[]) {
  return chunk(uniqueIds, DIRECTORY_CHUNK_SIZE).map(idChunk => ({
    ...getUserDirectoryOptions({ query: { uuid_in: idChunk } }),
    enabled: idChunk.length > 0,
    staleTime: STALE_TIMES.entity,
  }));
}

export function useUsersByIds(ids: string[]) {
  const uniqueIds = useMemo(() => uniqueSortedIds(ids), [ids]);

  const queries = useMemo(() => userDirectoryQueries(uniqueIds), [uniqueIds]);

  const { map, isLoading, isError, refetch } = useQueries({
    queries,
    combine: results => {
      const userMap: Record<string, User> = {};
      // Filtered against the requested set so an over-broad response can never
      // introduce rows the caller did not ask for.
      const wanted = new Set(uniqueIds);
      for (const result of results) {
        if (result.data?.error || result.data?.success === false) continue;
        const content = (result.data as { data?: UserSummary[] } | undefined)?.data ?? [];
        for (const summary of content) {
          if (summary.uuid && wanted.has(summary.uuid)) {
            userMap[summary.uuid] = summary as User;
          }
        }
      }
      return {
        map: userMap,
        isLoading: results.some(result => result.isLoading),
        isError: results.some(
          result => result.isError || result.data?.error || result.data?.success === false
        ),
        refetch: () => Promise.all(results.map(result => result.refetch())),
      };
    },
  });

  return { userMap: map, isLoading, isError, refetch };
}

/**
 * Users including their contact details, for the few screens that genuinely need them.
 *
 * {@link useUsersByIds} deliberately returns the contact-free directory projection — a lookup that
 * renders a name and an avatar has no business carrying email, phone and date of birth, and that
 * endpoint is open to any authenticated caller. Some screens do legitimately need contact details:
 * an instructor must be able to reach a student waitlisted on their own class.
 *
 * Until there is a relationship-scoped contact endpoint that can express "this instructor may
 * contact this student", those screens read the full record one user at a time. That is a fan-out,
 * so use it only for a bounded set — a waiting list, not a roster — and prefer
 * {@link useUsersByIds} everywhere else.
 */
export function useUsersWithContactByIds(ids: string[]) {
  const uniqueIds = useMemo(
    () => Array.from(new Set(ids.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [ids]
  );

  const { map, isLoading } = useQueries({
    queries: uniqueIds.map(uuid => ({
      ...getUserByUuidOptions({ path: { uuid } }),
      staleTime: STALE_TIMES.entity,
      // A directory miss is a miss; without this a stale uuid costs three retries per user.
      retry: 1,
    })),
    combine: results => {
      const userMap: Record<string, User> = {};
      for (const result of results) {
        const user = result.data?.data;
        if (user?.uuid) {
          userMap[user.uuid] = user as User;
        }
      }
      return {
        map: userMap,
        isLoading: results.some(result => result.isLoading),
      };
    },
  });

  return { userMap: map, isLoading };
}

function courseLookupQueries(uniqueIds: string[]) {
  return chunk(uniqueIds, CHUNK_SIZE).map(idChunk => {
    const query = {
      searchParams: { uuid_in: idChunk.join(',') },
      pageable: { page: 0, size: idChunk.length },
    };

    return {
      queryKey: searchCoursesQueryKey({ query }),
      enabled: typeof window !== 'undefined',
      queryFn: async () => {
        const { data, error, response } = await searchCourses({ query });

        if (error) {
          if (response.status === 400 || response.status === 404) {
            return { data: { content: [] } };
          }

          throw error;
        }

        return data;
      },
      staleTime: STALE_TIMES.reference,
    };
  });
}

export function useCoursesByIds(ids: string[]) {
  const uniqueIds = useMemo(() => uniqueSortedIds(ids), [ids]);

  const queries = useMemo(() => courseLookupQueries(uniqueIds), [uniqueIds]);

  const { map, isLoading, isError, refetch } = useQueries({
    queries,
    combine: results => {
      const map: Record<string, Course> = {};
      const wanted = new Set(uniqueIds);

      for (const result of results) {
        if (result.data?.error || result.data?.success === false) continue;
        const content = result.data?.data?.content ?? [];
        for (const item of content) {
          if (item.uuid && wanted.has(item.uuid)) {
            map[item.uuid] = item;
          }
        }
      }

      return {
        map,
        isLoading: results.some(result => result.isLoading),
        isError: results.some(
          result => result.isError || Boolean(result.data?.error) || result.data?.success === false
        ),
        refetch: () => Promise.all(results.map(result => result.refetch())),
      };
    },
  });

  return { courseMap: map, isLoading, isError, refetch };
}

export function useProgramsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<TrainingProgram>(
    ids,
    searchTrainingProgramsOptions,
    STALE_TIMES.reference
  );
  return { programMap: map, isLoading };
}

export function useTrainingRequirementsByIds(courseIds: string[], programIds: string[]) {
  const courseUniqueIds = useMemo(() => uniqueSortedIds(courseIds), [courseIds]);
  const programUniqueIds = useMemo(() => uniqueSortedIds(programIds), [programIds]);

  const queries = useMemo(
    () => [
      ...courseUniqueIds.map(courseUuid => ({
        queryKey: ['course-training-requirements', courseUuid],
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          const content: CourseTrainingRequirement[] = [];

          for (let page = 0; ; page += 1) {
            const { data, error } = await getCourseTrainingRequirements({
              path: { courseUuid },
              query: { pageable: { page, size: 200 } },
              signal,
            });

            if (error) throw error;

            const rows = data?.data?.content ?? [];
            content.push(...rows);
            const metadata = data?.data?.metadata;
            const hasNext =
              metadata?.hasNext ??
              (metadata?.last !== undefined ? !metadata.last : metadata?.totalPages !== undefined
                ? page + 1 < metadata.totalPages
                : metadata?.totalElements !== undefined
                  ? content.length < Number(metadata.totalElements)
                  : rows.length > 0);

            if (!hasNext || rows.length === 0) {
              return { items: content };
            }
          }
        },
        staleTime: STALE_TIMES.entity,
      })),
      ...programUniqueIds.map(programUuid => ({
        queryKey: ['program-training-requirements', programUuid],
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          const content: ProgramRequirement[] = [];

          for (let page = 0; ; page += 1) {
            const { data, error } = await getProgramRequirements({
              path: { programUuid },
              query: { pageable: { page, size: 200 } },
              signal,
            });

            if (error) throw error;

            const rows = data?.data?.content ?? [];
            content.push(...rows);
            const metadata = data?.data?.metadata;
            const hasNext =
              metadata?.hasNext ??
              (metadata?.last !== undefined ? !metadata.last : metadata?.totalPages !== undefined
                ? page + 1 < metadata.totalPages
                : metadata?.totalElements !== undefined
                  ? content.length < Number(metadata.totalElements)
                  : rows.length > 0);

            if (!hasNext || rows.length === 0) {
              return { items: content };
            }
          }
        },
        staleTime: STALE_TIMES.entity,
      })),
    ],
    [courseUniqueIds, programUniqueIds]
  );

  return useQueries({
    queries,
    combine: results => {
      const courseRequirementMap: Record<string, CourseTrainingRequirement[]> = {};
      const programRequirementMap: Record<string, ProgramRequirement[]> = {};

      for (const [index, result] of results.entries()) {
        const isCourseQuery = index < courseUniqueIds.length;
        const uuid = isCourseQuery ? courseUniqueIds[index] : programUniqueIds[index - courseUniqueIds.length];

        if (!uuid) continue;

        const items = ((result.data as { items?: CourseTrainingRequirement[] | ProgramRequirement[] } | undefined)
          ?.items ?? []) as CourseTrainingRequirement[] | ProgramRequirement[];

        if (isCourseQuery) {
          courseRequirementMap[uuid] = items as CourseTrainingRequirement[];
        } else {
          programRequirementMap[uuid] = items as ProgramRequirement[];
        }
      }

      return {
        courseRequirementMap,
        programRequirementMap,
        isLoading: results.some(result => result.isLoading),
        isError: results.some(
          result => result.isError || result.data?.error || result.data?.success === false
        ),
        error: results.find(result => result.error)?.error ?? null,
        refetch: () => Promise.all(results.map(result => result.refetch())),
      };
    },
  });
}

export function useAssignmentsByIds(ids: string[]) {
  const { map, isLoading, isError, refetch } = useSearchByIds<Assignment>(
    ids,
    searchAssignmentsOptions
  );
  return { assignmentMap: map, isLoading, isError, refetch };
}

export function useQuizzesByIds(ids: string[]) {
  const { map, isLoading, isError, refetch } = useSearchByIds<Quiz>(ids, searchQuizzesOptions);
  return { quizMap: map, isLoading, isError, refetch };
}

export function useInstructorsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Instructor>(ids, searchInstructorsOptions);
  return { instructorMap: map, isLoading };
}

export function useCourseCreatorsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<CourseCreator>(
    ids,
    searchCourseCreatorsOptions,
    STALE_TIMES.reference
  );
  return { courseCreatorMap: map, isLoading };
}

export function useOrganisationsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Organisation>(
    ids,
    search2Options,
    STALE_TIMES.reference
  );
  return { organisationMap: map, isLoading };
}

// Prefetches issue the exact requests the matching hook would, so a parent queryFn can start
// them when its rows land; the hook then joins the in-flight request instead of waiting.
export function prefetchCoursesByIds(queryClient: QueryClient, ids: (string | null | undefined)[]) {
  prefetchAll(queryClient, courseLookupQueries(uniqueSortedIds(ids)));
}

export function prefetchUsersByIds(queryClient: QueryClient, ids: (string | null | undefined)[]) {
  prefetchAll(queryClient, userDirectoryQueries(uniqueSortedIds(ids)));
}

export function prefetchCourseCreatorsByIds(
  queryClient: QueryClient,
  ids: (string | null | undefined)[]
) {
  prefetchAll(
    queryClient,
    searchByIdsQueries(uniqueSortedIds(ids), searchCourseCreatorsOptions, STALE_TIMES.reference)
  );
}

export function prefetchOrganisationsByIds(
  queryClient: QueryClient,
  ids: (string | null | undefined)[]
) {
  prefetchAll(
    queryClient,
    searchByIdsQueries(uniqueSortedIds(ids), search2Options, STALE_TIMES.reference)
  );
}

export function prefetchProgramsByIds(
  queryClient: QueryClient,
  ids: (string | null | undefined)[]
) {
  prefetchAll(
    queryClient,
    searchByIdsQueries(uniqueSortedIds(ids), searchTrainingProgramsOptions, STALE_TIMES.reference)
  );
}

const LESSON_CHUNK_SIZE = 50;
const LESSON_SEARCH_PAGE_SIZE = 200;

/** Merges lookup results from several scoped searches, first occurrence wins. */
export function uniqueByUuid<T extends { uuid?: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) if (item.uuid && !seen.has(item.uuid)) seen.set(item.uuid, item);
  return [...seen.values()];
}

/** One `<field>_in` search per 50 parent ids, instead of one search per parent. */
function useSearchByParentIds<T>(
  field: 'lesson_uuid_in' | 'class_definition_uuid_in',
  parentUuids: string[],
  optionsFactory: SearchOptionsFactory
) {
  const parentChunks = useMemo(() => {
    const unique = Array.from(new Set(parentUuids.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
    return chunk(unique, LESSON_CHUNK_SIZE);
  }, [parentUuids]);

  return useQueries({
    queries: parentChunks.map(parentChunk => ({
      ...optionsFactory({
        query: {
          searchParams: { [field]: parentChunk.join(',') },
          pageable: { page: 0, size: LESSON_SEARCH_PAGE_SIZE },
        },
      }),
      enabled: parentChunk.length > 0,
      staleTime: STALE_TIMES.entity,
    })),
    combine: results => ({
      items: results.flatMap(
        result => ((result.data as SearchResponse | undefined)?.data?.content ?? []) as T[]
      ),
      isLoading: results.some(r => r.isLoading),
      isError: results.some(r => r.isError),
    }),
  });
}

function useSearchByLessonIds<T>(lessonUuids: string[], optionsFactory: SearchOptionsFactory) {
  return useSearchByParentIds<T>('lesson_uuid_in', lessonUuids, optionsFactory);
}

export function useQuizzesByClassIds(classUuids: string[]) {
  return useSearchByParentIds<Quiz>('class_definition_uuid_in', classUuids, searchQuizzesOptions);
}

export function useAssignmentsByClassIds(classUuids: string[]) {
  return useSearchByParentIds<Assignment>(
    'class_definition_uuid_in',
    classUuids,
    searchAssignmentsOptions
  );
}

export function useQuizzesByLessonIds(lessonUuids: string[]) {
  return useSearchByLessonIds<Quiz>(lessonUuids, searchQuizzesOptions);
}

export function useAssignmentsByLessonIds(lessonUuids: string[]) {
  return useSearchByLessonIds<Assignment>(lessonUuids, searchAssignmentsOptions);
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

        assessmentMap[courseUuid] = result.data?.data?.content ?? [];
      });

      return {
        assessmentMap,
        items: Object.values(assessmentMap).flat(),
        isLoading: results.some(r => r.isLoading),
      };
    },
  });
}

/**
 * Class summaries (title, course, organisation, instructor, thumbnail) via
 * `GET /classes/batch`: one request per 100 ids, the backend's cap.
 */
export function useClassesByIds(classUuids: string[]) {
  const uniqueIds = useMemo(
    () => [...new Set(classUuids.filter(Boolean))].sort(),
    [classUuids]
  );
  const idChunks = useMemo(() => chunk(uniqueIds, CHUNK_SIZE), [uniqueIds]);

  return useQueries({
    queries: idChunks.map(idChunk => ({
      ...getClassesBatchOptions({ query: { uuids: idChunk } }),
      enabled: idChunk.length > 0,
      staleTime: STALE_TIMES.entity,
    })),
    combine: results => {
      const classMap: Record<string, ClassBatchSummary> = {};
      const wanted = new Set(uniqueIds);
      for (const result of results) {
        if (result.data?.error || result.data?.success === false) continue;
        for (const summary of result.data?.data ?? []) {
          if (summary.uuid && wanted.has(summary.uuid)) {
            classMap[summary.uuid] = summary;
          }
        }
      }
      return {
        classMap,
        items: Object.values(classMap),
        isLoading: results.some(result => result.isLoading),
        isError: results.some(
          result => result.isError || result.data?.error || result.data?.success === false
        ),
      };
    },
  });
}

/**
 * Full class definitions, one request per id. Only for screens that need fields the
 * batch summary lacks (description, location, progress); prefer {@link useClassesByIds}.
 */
export function useClassDefinitionsByIds(classUuids: string[]) {
  const uniqueClassUuids = useMemo(
    () => [...new Set(classUuids.filter(Boolean))].sort(),
    [classUuids]
  );

  return useQueries({
    queries: uniqueClassUuids.map(uuid => ({
      ...getClassDefinitionOptions({
        path: { uuid },
        query: { pageable: {} },
      }),
      enabled: !!uuid,
      staleTime: STALE_TIMES.entity,
    })),

    combine: results => {
      const classDefinitionMap: Record<string, ClassDefinition> = {};

      results.forEach((result, index) => {
        const classUuid = uniqueClassUuids[index];
        const classDefinition = result.data?.data?.class_definition;

        if (classUuid && classDefinition) {
          classDefinitionMap[classUuid] = classDefinition;
        }
      });

      return {
        classDefinitionMap,
        items: Object.values(classDefinitionMap),
        isLoading: results.some(r => r.isLoading),
        isError: results.some(r => r.isError),
      };
    },
  });
}

export function useCourseClasses(courseUuids: string[]) {
  const uniqueCourseUuids = useMemo(
    () => [...new Set(courseUuids.filter(Boolean))].sort(),
    [courseUuids]
  );

  return useQueries({
    queries: uniqueCourseUuids.map(uuid => ({
      ...getClassDefinitionsForCourseOptions({
        path: { courseUuid: uuid },
        query: { pageable: {} },
      }),
      enabled: Boolean(uuid),
      staleTime: STALE_TIMES.entity,
    })),

    combine: results => {
      const courseClassesMap: Record<string, ClassDefinition[]> = {};

      results.forEach((result, index) => {
        const courseUuid = uniqueCourseUuids[index];

        const classDefinitions =
          result.data?.data
            ?.map(item => item.class_definition)
            .filter(Boolean) ?? [];

        if (courseUuid) {
          courseClassesMap[courseUuid] = classDefinitions;
        }
      });

      return {
        courseClassesMap,
        items: Object.values(courseClassesMap).flat(),
        isLoading: results.some(result => result.isLoading),
      };
    },
  });
}

export function useInstructorRatingSummaries(instructorUuids: string[]) {
  const uniqueInstructorUuids = useMemo(
    () => [...new Set(instructorUuids.filter(Boolean))].sort(),
    [instructorUuids]
  );

  return useQueries({
    queries: uniqueInstructorUuids.map(uuid => ({
      ...getInstructorRatingSummaryOptions({
        path: { instructorUuid: uuid },
        query: { pageable: {} },
      }),
      enabled: Boolean(uuid),
      staleTime: STALE_TIMES.entity,
    })),

    combine: results => {
      const instructorRatingSummariesMap: Record<string, InstructorRatingSummary> = {};

      results.forEach((result, index) => {
        const instructorUuid = uniqueInstructorUuids[index];
        const ratingSummary = result.data?.data;

        if (instructorUuid && ratingSummary) {
          instructorRatingSummariesMap[instructorUuid] = ratingSummary;
        }
      });

      return {
        instructorRatingSummariesMap,
        items: Object.values(instructorRatingSummariesMap),
        isLoading: results.some(r => r.isLoading),
      };
    },
  });
}

export function useInstructorClasses(instructorUuids: string[]) {
  const uniqueInstructorUuids = useMemo(
    () => [...new Set(instructorUuids.filter(Boolean))].sort(),
    [instructorUuids]
  );

  return useQueries({
    queries: uniqueInstructorUuids.map(uuid => ({
      ...getClassDefinitionsForInstructorOptions({
        path: { instructorUuid: uuid },
        query: { pageable: {} },
      }),
      enabled: Boolean(uuid),
      staleTime: STALE_TIMES.entity,
    })),

    combine: results => {
      const instructorClassesMap: Record<string, ClassDefinition[]> = {};

      results.forEach((result, index) => {
        const instructorUuid = uniqueInstructorUuids[index];
        const classDefinitions = result.data?.data;

        if (instructorUuid && classDefinitions) {
          instructorClassesMap[instructorUuid] = classDefinitions;
        }
      });

      return {
        instructorClassesMap,
        items: Object.values(instructorClassesMap).flat(),
        isLoading: results.some(r => r.isLoading),
      };
    },
  });
}

export function useClassesEnrollmentsByIds(classUuids: string[]) {
  const uniqueClassUuids = useMemo(
    () => [...new Set(classUuids.filter(Boolean))].sort(),
    [classUuids]
  );

  const results = useQueries({
    queries: uniqueClassUuids.map((uuid) => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid },
        query: { pageable: {} },
      }),
      enabled: !!uuid,
      staleTime: STALE_TIMES.entity,
    })),
  });

  const classEnrollmentsMap = useMemo(
    () =>
      new Map(
        uniqueClassUuids.map((classUuid, index) => [
          classUuid,
          results[index]?.data?.data ?? [],
        ])
      ),
    [uniqueClassUuids, results]
  );

  return {
    results,
    classEnrollmentsMap,
    isLoading: results.some((result) => result.isLoading),
  };
}

