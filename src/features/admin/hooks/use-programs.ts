'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type {
  Certificate,
  ContentModerationHistory,
  Course,
  ProgramRatingSummary,
  ProgramTrainingApplication,
  TrainingProgram,
} from '@/services/client';
import {
  getOptionalCoursesOptions,
  getProgramCertificatesOptions,
  getProgramCompletionRateOptions,
  getProgramCoursesOptions,
  getProgramModerationHistoryOptions,
  getProgramRatingSummaryOptions,
  getRequiredCoursesOptions,
  getTrainingProgramByUuidOptions,
  listPendingProgramsOptions,
  listProgramTrainingApplicationsOptions,
  searchTrainingProgramsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery, queueQuery } from '../lib/admin-queries';

export const PROGRAMS_PAGE_SIZE = 20;

export interface ProgramFilters {
  q?: string;
  /** A ContentStatus value: draft | in_review | published | archived. */
  status?: string;
  /** 'approved' | 'awaiting' — anything else means no filter. */
  approval?: string;
  page?: number;
}

/**
 * Only title, courseCreatorUuid, categoryUuid, isPublished, active, status and
 * adminApproved are filterable. Price and duration filters return 400, so they are
 * never sent.
 */
function buildSearchParams({ q, status, approval }: ProgramFilters) {
  const params: Record<string, unknown> = {};

  const term = q?.trim();
  if (term) params.title_like = term;
  if (status && status !== 'any') params.status = status;
  if (approval === 'approved') params.admin_approved = true;
  if (approval === 'awaiting') params.admin_approved = false;

  return params;
}

/** Server-paged programs for the directory. */
export function usePrograms(filters: ProgramFilters) {
  const page = filters.page ?? 0;

  const query = useQuery({
    ...searchTrainingProgramsOptions({
      query: {
        searchParams: buildSearchParams(filters),
        pageable: { page, size: PROGRAMS_PAGE_SIZE },
      },
    }),
    ...listQuery,
  });

  const { programs, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<TrainingProgram>(query.data);
    return {
      programs: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { programs, totalRows, pageCount, page, query };
}

/** Programs submitted for approval, for the callout above the list. */
export function usePendingPrograms() {
  const query = useQuery({
    ...listPendingProgramsOptions({ query: { pageable: { page: 0, size: PROGRAMS_PAGE_SIZE } } }),
    ...queueQuery,
  });

  const { pending, total } = useMemo(() => {
    const { items, metadata } = extractPage<TrainingProgram>(query.data);
    return { pending: items, total: getTotalFromMetadata(metadata) };
  }, [query.data]);

  return { pending, total, query };
}

/** One program record. */
export function useProgram(uuid: string) {
  const query = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid } }),
    ...listQuery,
    enabled: Boolean(uuid),
  });

  const program = useMemo(() => extractEntity<TrainingProgram>(query.data), [query.data]);

  return { program, query };
}

/** Rating, completion and certificate count for the overview tab. */
export function useProgramInsights(uuid: string, enabled: boolean) {
  const ratingQuery = useQuery({
    ...getProgramRatingSummaryOptions({ path: { programUuid: uuid } }),
    ...listQuery,
    enabled: enabled && Boolean(uuid),
  });

  const completionQuery = useQuery({
    ...getProgramCompletionRateOptions({ path: { programUuid: uuid } }),
    ...listQuery,
    enabled: enabled && Boolean(uuid),
  });

  const certificatesQuery = useQuery({
    ...getProgramCertificatesOptions({
      path: { programUuid: uuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    ...listQuery,
    enabled: enabled && Boolean(uuid),
  });

  const rating = useMemo(
    () => extractEntity<ProgramRatingSummary>(ratingQuery.data),
    [ratingQuery.data]
  );
  const completionRate = useMemo(
    () => extractEntity<number>(completionQuery.data),
    [completionQuery.data]
  );
  const certificateCount = useMemo(
    () => getTotalFromMetadata(extractPage<Certificate>(certificatesQuery.data).metadata),
    [certificatesQuery.data]
  );

  return {
    rating,
    completionRate,
    certificateCount,
    ratingQuery,
    completionQuery,
    certificatesQuery,
  };
}

/** Courses in the program, split into required and optional in the browser. */
export function useProgramCourses(uuid: string, enabled: boolean) {
  const allQuery = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: uuid } }),
    ...listQuery,
    enabled: enabled && Boolean(uuid),
  });

  const requiredQuery = useQuery({
    ...getRequiredCoursesOptions({ path: { programUuid: uuid } }),
    ...listQuery,
    enabled: enabled && Boolean(uuid),
  });

  const optionalQuery = useQuery({
    ...getOptionalCoursesOptions({ path: { programUuid: uuid } }),
    ...listQuery,
    enabled: enabled && Boolean(uuid),
  });

  const courses = useMemo(() => extractList<Course>(allQuery.data), [allQuery.data]);
  const requiredUuids = useMemo(
    () => new Set(extractList<Course>(requiredQuery.data).map(course => course.uuid)),
    [requiredQuery.data]
  );
  const optionalUuids = useMemo(
    () => new Set(extractList<Course>(optionalQuery.data).map(course => course.uuid)),
    [optionalQuery.data]
  );

  return { courses, requiredUuids, optionalUuids, allQuery, requiredQuery, optionalQuery };
}

/** Applications from instructors and organisations to deliver this program. */
export function useProgramApplications(uuid: string, status: string, enabled: boolean) {
  const query = useQuery({
    ...listProgramTrainingApplicationsOptions({
      path: { programUuid: uuid },
      query: {
        status: status && status !== 'any' ? status : undefined,
        pageable: { page: 0, size: 50 },
      },
    }),
    ...queueQuery,
    enabled: enabled && Boolean(uuid),
  });

  const applications = useMemo(
    () => extractPage<ProgramTrainingApplication>(query.data).items,
    [query.data]
  );

  return { applications, query };
}

/** Every decision taken on this program, newest first. */
export function useProgramModerationHistory(uuid: string, enabled: boolean) {
  const query = useQuery({
    ...getProgramModerationHistoryOptions({
      path: { uuid },
      query: { pageable: { page: 0, size: 25 } },
    }),
    ...listQuery,
    enabled: enabled && Boolean(uuid),
  });

  const history = useMemo(
    () => extractPage<ContentModerationHistory>(query.data).items,
    [query.data]
  );

  return { history, query };
}
