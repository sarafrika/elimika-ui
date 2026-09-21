'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { toNumber } from '@/lib/metrics';
import { type AssessmentRubric, type RubricMatrix, updateAssessmentRubric } from '@/services/client';
import {
  getRubricMatrixViewOptions,
  getRubricStatisticsOptions,
  searchAssessmentRubricsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { configQuery, invalidateAdminOverview, listQuery } from '../lib/admin-queries';

export const RUBRICS_PAGE_SIZE = 20;

export interface RubricFilters {
  q?: string;
  /** Matches the rubric_type column, e.g. "assignment". */
  type?: string;
  /** 'public' | 'private' — anything else means no filter. */
  visibility?: string;
  /** DRAFT | IN_REVIEW | PUBLISHED | ARCHIVED. */
  status?: string;
  /** 'active' | 'inactive' — anything else means no filter. */
  active?: string;
  creatorUuid?: string;
  page?: number;
}

/**
 * Search filters are ANDed by the backend, so a typed term goes to `title_like` ONLY.
 * Sending `description_like` alongside it would match just the rubrics whose title and
 * description both contain the term, which is never what the admin means.
 */
function buildSearchParams({ q, type, visibility, status, active, creatorUuid }: RubricFilters) {
  const params: Record<string, unknown> = {};

  const term = q?.trim();
  if (term) params.title_like = term;
  if (type) params.rubricType = type;
  if (visibility === 'public') params.isPublic = true;
  if (visibility === 'private') params.isPublic = false;
  if (status) params.status = status;
  if (active === 'active') params.isActive = true;
  if (active === 'inactive') params.isActive = false;
  if (creatorUuid) params.courseCreatorUuid = creatorUuid;

  return params;
}

/** Server-paged rubrics for the directory. */
export function useRubrics(filters: RubricFilters) {
  const page = filters.page ?? 0;
  const searchParams = useMemo(() => buildSearchParams(filters), [filters]);

  const query = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        searchParams: searchParams as Record<string, string>,
        pageable: { page, size: RUBRICS_PAGE_SIZE, sort: ['updatedDate,desc'] },
      },
    }),
    ...listQuery,
  });

  const { rubrics, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<AssessmentRubric>(query.data);
    return {
      rubrics: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: toNumber(metadata.totalPages ?? 1),
    };
  }, [query.data]);

  return {
    rubrics,
    totalRows,
    pageCount,
    page,
    query,
    isFiltered: Object.keys(searchParams).length > 0,
  };
}

/** The only two numbers this endpoint returns: how many rubrics exist, and how many are public. */
export function useRubricStatistics() {
  const query = useQuery({ ...getRubricStatisticsOptions(), ...configQuery });

  const counts = useMemo(() => {
    const data = (query.data as { data?: Record<string, unknown> } | undefined)?.data ?? {};
    return {
      total: toNumber(data.totalRubrics as number | undefined),
      public: toNumber(data.totalPublicRubrics as number | undefined),
    };
  }, [query.data]);

  return { counts, query };
}

/**
 * The matrix view carries the rubric, its criteria and its scoring levels in one answer,
 * so the detail sheet costs a single call rather than three.
 */
export function useRubricMatrix(rubricUuid: string | null) {
  const query = useQuery({
    ...getRubricMatrixViewOptions({ path: { rubricUuid: rubricUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(rubricUuid),
  });

  const matrix = useMemo(() => extractEntity<RubricMatrix>(query.data), [query.data]);
  return { matrix, query };
}

/**
 * Status and visibility are changed through the full-DTO update: the PUT validates
 * title, rubric_type, course_creator_uuid and status, so the whole loaded rubric goes
 * back with just the one field changed.
 */
export function useUpdateRubric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rubric,
      changes,
    }: {
      rubric: AssessmentRubric;
      changes: Partial<Pick<AssessmentRubric, 'status' | 'is_public' | 'active'>>;
    }) => {
      const { data } = await updateAssessmentRubric({
        path: { uuid: rubric.uuid ?? '' },
        body: {
          title: rubric.title,
          description: rubric.description,
          rubric_type: rubric.rubric_type,
          course_creator_uuid: rubric.course_creator_uuid,
          is_public: rubric.is_public,
          status: rubric.status,
          active: rubric.active,
          total_weight: rubric.total_weight,
          weight_unit: rubric.weight_unit,
          uses_custom_levels: rubric.uses_custom_levels,
          max_score: rubric.max_score,
          min_passing_score: rubric.min_passing_score,
          ...changes,
        },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      // Generated keys carry their id inside the first element, so they are matched by
      // id rather than by a plain string prefix.
      await invalidateGeneratedQueryIds(queryClient, [
        'searchAssessmentRubrics',
        'getAllAssessmentRubrics',
        'getAssessmentRubricByUuid',
        'getRubricMatrixView',
        'getRubricStatistics',
      ]);
      await invalidateAdminOverview(queryClient);
      toast.success(`${variables.rubric.title} updated`);
    },
    onError: (error, variables) => {
      toast.error(getErrorMessage(error, `Could not update ${variables.rubric.title}`));
    },
  });
}
