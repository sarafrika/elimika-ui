'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { toNumber } from '@/lib/metrics';
import type {
  ContentModerationHistory,
  Course,
  CourseAssessment,
  CourseEditDiff,
  CourseRequirement,
  CourseStats,
  CourseCreator,
  Lesson,
} from '@/services/client';
import {
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getCourseEditDiffOptions,
  getCourseLessonsOptions,
  getCourseModerationHistoryOptions,
  getCourseRequirementsOptions,
  getCourseStatsOptions,
  listPendingCourseEditsOptions,
  listPendingCoursesOptions,
  searchCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery, queueQuery } from '../lib/admin-queries';

export const COURSE_PAGE_SIZE = 20;

export type CourseStatusFilter = 'all' | 'in_review' | 'published' | 'draft' | 'archived';
export type CourseApprovalFilter = 'any' | 'approved' | 'awaiting';

export interface CourseFilters {
  status: CourseStatusFilter;
  approval: CourseApprovalFilter;
  q: string;
  page: number;
}

/**
 * The courses search only accepts the keys it marks filterable. Price and category
 * uuids are not among them and answer 400, so the filters stay on what works:
 * lifecycle stage, approval, active and a name match.
 */
function buildSearchParams({ status, approval, q }: CourseFilters) {
  const params: Record<string, unknown> = {};
  const term = q.trim();

  if (term) params.name_like = term;
  if (status !== 'all') params.lifecycle_stage = status;
  if (approval !== 'any') params.admin_approved = approval === 'approved';

  return params;
}

export interface CoursesResult {
  courses: Course[];
  total: number;
  pageCount: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  isFiltered: boolean;
}

/** One page of courses, filtered and paged on the server. */
export function useCourses(filters: CourseFilters): CoursesResult {
  const searchParams = useMemo(() => buildSearchParams(filters), [filters]);

  const query = useQuery({
    ...searchCoursesOptions({
      query: {
        searchParams,
        pageable: { page: filters.page, size: COURSE_PAGE_SIZE, sort: ['lastModifiedDate,desc'] },
      },
    }),
    ...listQuery,
  });

  const page = useMemo(() => extractPage<Course>(query.data), [query.data]);

  return {
    courses: page.items,
    total: getTotalFromMetadata(page.metadata),
    pageCount: toNumber(page.metadata.totalPages ?? 0),
    isLoading: query.isLoading && !query.data,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    isFiltered: Object.keys(searchParams).length > 0,
  };
}

/**
 * How much is waiting, for the two callouts that link into the inbox. Both are read as
 * queues because an admin watches them empty out.
 */
export function useCourseQueueCounts() {
  const pending = useQuery({
    ...listPendingCoursesOptions({ query: { pageable: { page: 0, size: 1 } } }),
    ...queueQuery,
  });

  const edits = useQuery({
    ...listPendingCourseEditsOptions({ query: { pageable: { page: 0, size: 1 } } }),
    ...queueQuery,
  });

  return useMemo(
    () => ({
      pendingCourses: getTotalFromMetadata(extractPage(pending.data).metadata),
      pendingEdits: getTotalFromMetadata(extractPage(edits.data).metadata),
      isLoading: pending.isLoading || edits.isLoading,
    }),
    [pending.data, pending.isLoading, edits.data, edits.isLoading]
  );
}

/** The course record itself. */
export function useCourse(uuid: string) {
  const query = useQuery({
    ...getCourseByUuidOptions({ path: { uuid } }),
    ...listQuery,
    enabled: Boolean(uuid),
  });

  const course = useMemo(() => extractEntity<Course>(query.data), [query.data]);
  return { course, query };
}

/** The creator behind the course, for the header line. */
export function useCourseCreator(uuid?: string) {
  const query = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: uuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(uuid),
  });

  const creator = useMemo(() => extractEntity<CourseCreator>(query.data), [query.data]);
  return { creator, query };
}

/**
 * What a pending edit would change. A 404 here is the normal "nothing waiting" answer,
 * so it is reported as empty rather than as a failure.
 */
export function useCourseEditDiff(uuid: string, enabled = true) {
  const query = useQuery({
    ...getCourseEditDiffOptions({ path: { uuid } }),
    ...queueQuery,
    enabled: Boolean(uuid) && enabled,
    retry: false,
  });

  const diff = useMemo(() => extractEntity<CourseEditDiff>(query.data), [query.data]);
  const isMissing = isNotFound(query.error) || (!query.isLoading && !diff);

  return {
    diff,
    /** True when no edit is waiting — an empty state, not an error. */
    isMissing,
    query,
    error: isMissing ? null : query.error,
  };
}

/** Lessons on the live course. */
export function useCourseLessons(uuid: string, enabled = true) {
  const query = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: uuid },
      query: { pageable: { page: 0, size: 100, sort: ['lessonNumber,asc'] } },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const lessons = useMemo(() => extractPage<Lesson>(query.data).items, [query.data]);
  return { lessons, query };
}

/** Assessments attached to the course. */
export function useCourseAssessments(uuid: string, enabled = true) {
  const query = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: uuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const assessments = useMemo(() => extractPage<CourseAssessment>(query.data).items, [query.data]);
  return { assessments, query };
}

/** What a learner must meet before enrolling. */
export function useCourseRequirements(uuid: string, enabled = true) {
  const query = useQuery({
    ...getCourseRequirementsOptions({
      path: { courseUuid: uuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const requirements = useMemo(() => extractPage<CourseRequirement>(query.data).items, [query.data]);
  return { requirements, query };
}

/** Past decisions on this course, newest first. */
export function useCourseModerationHistory(uuid: string, enabled = true) {
  const query = useQuery({
    ...getCourseModerationHistoryOptions({
      path: { uuid },
      query: { pageable: { page: 0, size: 50 } },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const history = useMemo(
    () => extractPage<ContentModerationHistory>(query.data).items,
    [query.data]
  );
  return { history, query };
}

/**
 * Enrolment and sales figures. One call per course and only when asked for, because
 * the list payload carries none of this and nothing should fetch it per row.
 */
export function useCourseStats(uuid: string, enabled = false) {
  const query = useQuery({
    ...getCourseStatsOptions({ path: { courseUuid: uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const stats = useMemo(() => extractEntity<CourseStats>(query.data), [query.data]);
  return { stats, query };
}

/** A 404 from the diff endpoint means no edit is waiting. */
function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { status?: unknown; response?: { status?: unknown } };
  const status = record.status ?? record.response?.status;
  return status === 404;
}
