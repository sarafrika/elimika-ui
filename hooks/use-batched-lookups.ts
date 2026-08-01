// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { STALE_TIMES } from '@/lib/query-client';
import {
  ClassDefinition,
  CourseAssessment,
  CourseTrainingApplication,
  type CourseCreator,
  ProgramTrainingApplication,
  type Assignment,
  type Course,
  type Enrollment,
  type Instructor,
  type Organisation,
  type Quiz,
  type SearchResponse,
  type Student,
  type TrainingProgram,
  type User,
  type UserSummary,
} from '@/services/client';
import {
  getClassDefinitionOptions,
  getCourseAssessmentsOptions,
  getUserByUuidOptions,
  getUserDirectoryOptions,
  searchAssignmentsOptions,
  searchCoursesOptions,
  searchEnrollmentsOptions,
  searchInstructorsOptions,
  search2Options,
  searchProgramTrainingApplicationsOptions,
  searchQuizzesOptions,
  searchStudentsOptions,
  searchCourseCreatorsOptions,
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
        result => ((result.data as SearchResponse | undefined)?.data?.content ?? []) as T[]
      ),
      isLoading: results.some(result => result.isLoading),
    }),
  });
}

export function useStudentsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Student>(ids, searchStudentsOptions);
  return { studentMap: map, isLoading };
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
export function useUsersByIds(ids: string[]) {
  const uniqueIds = useMemo(
    () => Array.from(new Set(ids.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [ids]
  );

  const idChunks = useMemo(() => chunk(uniqueIds, DIRECTORY_CHUNK_SIZE), [uniqueIds]);

  const { map, isLoading } = useQueries({
    queries: idChunks.map(idChunk => ({
      ...getUserDirectoryOptions({ query: { uuid_in: idChunk } }),
      enabled: idChunk.length > 0,
      staleTime: STALE_TIMES.entity,
    })),
    combine: results => {
      const userMap: Record<string, User> = {};
      // Filtered against the requested set so an over-broad response can never
      // introduce rows the caller did not ask for.
      const wanted = new Set(uniqueIds);
      for (const result of results) {
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
      };
    },
  });

  return { userMap: map, isLoading };
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

export function useCoursesByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Course>(
    ids,
    searchCoursesOptions,
    STALE_TIMES.reference
  );
  return { courseMap: map, isLoading };
}

export function useProgramsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<TrainingProgram>(
    ids,
    searchTrainingProgramsOptions,
    STALE_TIMES.reference
  );
  return { programMap: map, isLoading };
}

export function useAssignmentsByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Assignment>(ids, searchAssignmentsOptions);
  return { assignmentMap: map, isLoading };
}

export function useQuizzesByIds(ids: string[]) {
  const { map, isLoading } = useSearchByIds<Quiz>(ids, searchQuizzesOptions);
  return { quizMap: map, isLoading };
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
        result => ((result.data as SearchResponse | undefined)?.data?.content ?? []) as Quiz[]
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
        result => ((result.data as SearchResponse | undefined)?.data?.content ?? []) as Quiz[]
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

export function useClassesByIds(classUuids: string[]) {
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
      };
    },
  });
}
