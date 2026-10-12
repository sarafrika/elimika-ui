'use client';

import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { withQ } from '@/lib/search/params';
import {
  getRubricMatrixOptions,
  searchAssessmentRubricsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ApiResponseRubricMatrix,
  AssessmentRubric,
  RubricMatrix,
} from '@/services/client/types.gen';
import type { Rubric } from './rubric-chaining';

function requireData<T>(response: { success?: boolean; error?: unknown; data?: T }) {
  if (response.error || response.success === false)
    throw new Error(getErrorMessage(response, 'Unable to load rubric information.'));
  if (!response.data) throw new Error('No rubric information was returned.');
  return response.data;
}

function rubricSummary(item: AssessmentRubric): Rubric {
  return {
    uuid: item.uuid ?? '',
    title: item.title,
    description: item.description ?? '',
    rubric_type: item.rubric_type,
    rubric_category: item.rubric_category ?? '',
    assessment_scope: item.assessment_scope ?? '',
    course_creator_uuid: item.course_creator_uuid,
    is_public: item.is_public ?? false,
    is_published: item.is_published ?? false,
    active: item.active ?? false,
    status:
      item.status === 'PUBLISHED'
        ? 'published'
        : item.status === 'ARCHIVED'
          ? 'archived'
          : item.status === 'IN_REVIEW'
            ? 'in_review'
            : 'draft',
    usage_status: item.usage_status ?? '',
    total_weight: item.total_weight ?? 0,
    weight_unit: item.weight_unit ?? 'percentage',
    uses_custom_levels: item.uses_custom_levels ?? false,
    max_score: item.max_score ?? 0,
    min_passing_score: item.min_passing_score ?? 0,
    criteria: [],
    scoringLevels: [],
  };
}

function rubricFromMatrix(matrix: RubricMatrix): Rubric {
  if (
    !matrix.rubric.uuid ||
    matrix.criteria.some(item => !item.uuid) ||
    matrix.scoring_levels.some(item => !item.uuid)
  )
    throw new Error('The rubric is missing identifiers. Please reload it.');
  const cells = new Map(
    Object.values(matrix.matrix_cells).map(cell => [
      `${cell.criteria_uuid}_${cell.scoring_level_uuid}`,
      cell,
    ])
  );
  return {
    ...rubricSummary(matrix.rubric),
    scoringLevels: matrix.scoring_levels.map(level => ({
      ...level,
      uuid: level.uuid ?? '',
      description: level.description ?? '',
      points: String(level.points),
      score_range: String(level.points),
      is_passing_level: level.is_passing,
      created_by: level.created_by ?? '',
      created_date: level.created_date ?? '',
      updated_by: level.updated_by ?? null,
      updated_date: level.updated_date ?? null,
    })),
    criteria: matrix.criteria.map(criterion => ({
      ...criterion,
      uuid: criterion.uuid ?? '',
      description: criterion.description ?? '',
      criteria_number: criterion.criteria_number ?? '',
      criteria_category: criterion.criteria_category ?? '',
      is_primary_criteria: criterion.is_primary_criteria ?? false,
      created_by: criterion.created_by ?? '',
      created_date: criterion.created_date ?? '',
      scoring: matrix.scoring_levels.map(level => {
        const cell = cells.get(`${criterion.uuid}_${level.uuid}`);
        return {
          uuid: '',
          criteria_uuid: criterion.uuid ?? '',
          rubric_scoring_level_uuid: level.uuid ?? '',
          description: cell?.description ?? '',
          score_range: String(cell?.points ?? level.points),
          performance_expectation: '',
          feedback_category: '',
          is_passing_level: level.is_passing,
          created_by: '',
          created_date: '',
          updated_by: null,
          updated_date: '',
        };
      }),
    })),
  };
}

export function useRubricSummaries(
  creatorUuid: string | undefined,
  q: string | undefined,
  enabled: boolean,
  page = 0
) {
  const filters: Record<string, string> = {};
  if (creatorUuid) filters.course_creator_uuid_eq = creatorUuid;
  const query = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        searchParams: withQ(filters, q),
        pageable: { page, size: 20 },
      },
    }),
    select: requireData,
    enabled: enabled && Boolean(creatorUuid),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientOrSearchError,
    staleTime: STALE_TIMES.entity,
  });
  const rubrics = useMemo(
    () => (query.data?.content ?? []).filter(item => Boolean(item.uuid)).map(rubricSummary),
    [query.data]
  );
  return { ...query, rubrics, total: query.data?.metadata?.totalElements ?? rubrics.length };
}

export function useRubricRecord(rubricUuid?: string) {
  const options = rubricUuid ? getRubricMatrixOptions({ path: { rubricUuid } }) : null;
  const loadRubric = options?.queryFn;
  const query = useQuery({
    queryKey: options?.queryKey ?? [],
    queryFn:
      options && typeof loadRubric === 'function'
        ? context => loadRubric({ ...context, queryKey: options.queryKey })
        : skipToken,
    select: readRubricRecord,
    enabled: Boolean(rubricUuid),
    retry: retryUnlessClientOrSearchError,
    staleTime: STALE_TIMES.entity,
  });
  const rubrics = useMemo(() => (query.data ? [query.data] : []), [query.data]);
  return { ...query, rubrics };
}

export function readRubricRecord(response: ApiResponseRubricMatrix) {
  return rubricFromMatrix(requireData(response));
}
