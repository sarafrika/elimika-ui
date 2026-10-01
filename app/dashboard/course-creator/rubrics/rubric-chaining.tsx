import { getRubricCriteria, getRubricScoring, getScoringLevelsByRubric } from '@/services/client';
import { searchAssessmentRubricsOptions } from '@/services/client/@tanstack/react-query.gen';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { withQ } from '@/lib/search/params';

export type RubricScoringLevel = {
  level_order: number;
  uuid: string;
  rubric_uuid: string;
  description: string;
  name: string;
  score_range: string;
  points: string;
  is_passing_level: boolean;
  is_passing?: boolean;
  performance_expectation?: string;
  feedback_category?: string;
  created_by: string;
  created_date: string | Date;
  updated_by: string | null;
  updated_date: string | Date | null;
};

export type ScoringLevel = {
  rubric_scoring_level_uuid: string;
  criteria_uuid: string;
  description: string;
  performance_expectation: string;
  feedback_category: string;
  score_range: string;
  points: string;
  is_passing_level: boolean;
  created_by: string;
  created_date: string | Date;
  updated_by: string | null;
  updated_date: string | Date | null;
  uuid: string;
};

export type CriteriaScoring = {
  uuid: string;
  criteria_uuid: string;
  rubric_scoring_level_uuid: string;

  description: string;
  feedback_category: string;
  performance_expectation: string;
  score_range: string;

  is_passing_level: boolean;

  created_by: string;
  created_date: string; // ISO 8601 date-time

  updated_by: string | null;
  updated_date: string; // ISO 8601 date-time
};

export type Criterion = {
  component_name: string;
  created_by: string;
  created_date: string | Date;
  criteria_category: string;
  criteria_number: string;
  description: string;
  display_order: number;
  is_primary_criteria: boolean;
  rubric_uuid: string;
  uuid: string;
  weight_suggestion?: string;
  scoring: CriteriaScoring[];
};

export type Rubric = {
  uuid: string;
  title: string;
  description: string;
  rubric_type: string;
  rubric_category: string;
  assessment_scope: string;
  course_creator_uuid: string;
  is_public: boolean;
  is_published: boolean;
  active: boolean;
  status: 'draft' | 'published' | 'archived';
  usage_status: string;
  total_weight: number;
  weight_unit: 'percentage' | 'points';
  uses_custom_levels: boolean;
  max_score: number;
  min_passing_score: number;
  criteria: Criterion[];
  scoringLevels: RubricScoringLevel[];
};

type RubricListItem = Omit<Rubric, 'criteria' | 'scoringLevels'>;
type CriterionListItem = Omit<Criterion, 'scoring'>;

/**
 * The creator's rubrics with their criteria and scoring. `q` (debounced, 2+ characters) is
 * matched by the search index; a 400 or 503 is reported through `rubricsError`, not retried.
 */
export const useRubricsData = (courseCreatorUuid?: string, refetchTrigger = 0, q?: string) => {
  const {
    data: allRubrics,
    isLoading: isRubricsLoading,
    isFetching,
    isError: isRubricsError,
    isFetched: isRubricsFetched,
    error: rubricsError,
    refetch: refetchRubrics,
  } = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        pageable: {},
        searchParams: withQ(
          {
            course_creator_uuid_eq: courseCreatorUuid as string,
          },
          q
        ),
      },
    }),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientOrSearchError,
  });

  const rubricList = (allRubrics?.data?.content ?? []) as unknown as RubricListItem[];
  const rubricUuids = rubricList.map(rubric => rubric.uuid);

  // Fetch scoring levels for each rubric
  const scoringLevelsQueries = useQueries({
    queries: rubricUuids.map(rubricUuid => ({
      queryKey: ['rubric-scoring-levels', rubricUuid, refetchTrigger],
      queryFn: () =>
        getScoringLevelsByRubric({
          path: { rubricUuid },
          query: { pageable: {} },
        }),
      enabled: !!rubricUuid,
    })),
  });

  // Fetch criteria for each rubric
  const criteriaQueries = useQueries({
    queries: rubricUuids.map(rubricUuid => ({
      queryKey: ['rubric-criteria', rubricUuid, refetchTrigger],
      queryFn: () =>
        getRubricCriteria({
          path: { rubricUuid },
          query: { pageable: {} },
        }),
      enabled: !!rubricUuid,
    })),
  });

  // Create pairs of rubric + criteria for scoring queries
  const criteriaPairs = criteriaQueries.flatMap((criteriaQuery, rubricIndex) => {
    const rubricUuid = rubricUuids[rubricIndex];
    const criteriaList = (criteriaQuery.data?.data?.data?.content ??
      []) as unknown as CriterionListItem[];
    return criteriaList.map(criteria => ({
      rubricUuid,
      criteriaUuid: criteria.uuid,
    }));
  });

  // Fetch scoring (links between criteria and scoring levels)
  const scoringQueries = useQueries({
    queries: criteriaPairs.map(({ rubricUuid, criteriaUuid }) => ({
      queryKey: ['rubric-scoring', rubricUuid ?? '', criteriaUuid ?? '', refetchTrigger],
      queryFn: () =>
        getRubricScoring({
          path: { rubricUuid: rubricUuid ?? '', criteriaUuid: criteriaUuid ?? '' },
          query: { pageable: {} },
        }),
      enabled: !!rubricUuid && !!criteriaUuid,
    })),
  });

  // ── refetchAll

  const refetchAll = async () => {
    await refetchRubrics();
    await Promise.all([
      ...scoringLevelsQueries.map(q => q.refetch()),
      ...criteriaQueries.map(q => q.refetch()),
    ]);
    await Promise.all(scoringQueries.map(q => q.refetch()));
  };

  const rubrics: Rubric[] = rubricList.map((rubric, rubricIndex: number) => {
    const scoringLevelsData = (scoringLevelsQueries[rubricIndex]?.data?.data?.data?.content ??
      []) as unknown as RubricScoringLevel[];

    const criteriaList = (criteriaQueries[rubricIndex]?.data?.data?.data?.content ??
      []) as unknown as CriterionListItem[];

    const criteria: Criterion[] = criteriaList.map(c => {
      const scoringQueryIndex = criteriaPairs.findIndex(
        p => p.rubricUuid === rubric.uuid && p.criteriaUuid === c.uuid
      );
      const criteriaScoringLevels = (scoringQueries[scoringQueryIndex]?.data?.data?.data?.content ??
        []) as unknown as CriteriaScoring[];

      return {
        component_name: c.component_name,
        created_by: c.created_by,
        created_date: c.created_date,
        criteria_category: c.criteria_category,
        criteria_number: c.criteria_number,
        description: c.description,
        display_order: c.display_order,
        is_primary_criteria: c.is_primary_criteria,
        rubric_uuid: c.rubric_uuid,
        uuid: c.uuid,
        weight_suggestion: c.weight_suggestion,
        scoring: criteriaScoringLevels,
      };
    });

    return {
      uuid: rubric.uuid,
      title: rubric.title,
      description: rubric.description,
      rubric_type: rubric.rubric_type,
      rubric_category: rubric.rubric_category,
      assessment_scope: rubric.assessment_scope,
      course_creator_uuid: rubric.course_creator_uuid,
      is_public: rubric.is_public,
      is_published: rubric.is_published,
      active: rubric.active,
      status: rubric.status,
      usage_status: rubric.usage_status,
      total_weight: rubric.total_weight,
      weight_unit: rubric.weight_unit,
      uses_custom_levels: rubric.uses_custom_levels,
      max_score: rubric.max_score,
      min_passing_score: rubric.min_passing_score,
      criteria,
      scoringLevels: scoringLevelsData,
    };
  });

  const isLoading =
    isFetching ||
    isRubricsLoading ||
    scoringLevelsQueries.some(q => q.isLoading) ||
    criteriaQueries.some(q => q.isLoading) ||
    scoringQueries.some(q => q.isLoading);

  const isFetched =
    isRubricsFetched &&
    scoringLevelsQueries.every(q => q.isFetched) &&
    criteriaQueries.every(q => q.isFetched) &&
    scoringQueries.every(q => q.isFetched);

  const isError =
    isRubricsError ||
    scoringLevelsQueries.some(q => q.isError) ||
    criteriaQueries.some(q => q.isError) ||
    scoringQueries.some(q => q.isError);

  return {
    rubrics,
    isLoading,
    isError,
    isFetched,
    rubricsError,
    refetchAll,
  };
};

// Keep the original hook for backward compatibility
