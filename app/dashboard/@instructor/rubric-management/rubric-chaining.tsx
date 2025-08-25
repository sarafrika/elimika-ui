import { getRubricCriteria, getRubricScoring } from '@/services/client';
import {
  getRubricCriteriaQueryKey,
  getRubricScoringQueryKey,
  searchAssessmentRubricsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';

export const useRubricsWithCriteriaAndScoring = (instructorUuid?: string) => {
  const {
    data: allRubrics,
    isLoading: isRubricsLoading,
    isFetching,
    isError: isRubricsError,
    isFetched: isRubricsFetched,
  } = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        pageable: {},
        searchParams: {
          instructor_uuid_eq: instructorUuid as string,
        },
      },
    }),
  });

  const rubricList = allRubrics?.data?.content ?? [];
  const rubricUuids = rubricList.map((rubric: any) => rubric.uuid);

  const criteriaQueries = useQueries({
    queries: rubricUuids.map(rubricUuid => ({
      queryKey: getRubricCriteriaQueryKey({ path: { rubricUuid }, query: { pageable: {} } }),
      queryFn: () =>
        getRubricCriteria({
          path: { rubricUuid },
          query: { pageable: {} },
        }),
      enabled: !!rubricUuid,
    })),
  });

  const criteriaPairs = criteriaQueries.flatMap((criteriaQuery, i) => {
    const rubricUuid = rubricUuids[i];
    const criteriaList = criteriaQuery.data?.data?.data?.content ?? [];

    return criteriaList.map((criteria: any) => ({
      rubricUuid,
      criteriaUuid: criteria.uuid,
      criteriaData: criteria,
    }));
  });

  const scoringQueries = useQueries({
    queries: criteriaPairs.map(({ rubricUuid, criteriaUuid }) => ({
      queryKey: getRubricScoringQueryKey({
        path: { rubricUuid, criteriaUuid },
        query: { pageable: {} },
      }),
      queryFn: () =>
        getRubricScoring({
          path: { rubricUuid, criteriaUuid },
          query: { pageable: {} },
        }),
      enabled: !!rubricUuid && !!criteriaUuid,
    })),
  });

  const rubricsWithDetails = rubricList.map((rubric: any, index: number) => {
    const rubricUuid = rubric.uuid;

    const criteriaQuery = criteriaQueries[index];
    const criteriaList = criteriaQuery?.data?.data?.data?.content ?? [];

    const enrichedCriteria = criteriaList.map((criteria: any) => {
      const scoringQuery = scoringQueries.find(
        (q, idx) =>
          criteriaPairs[idx]?.criteriaUuid === criteria.uuid &&
          criteriaPairs[idx]?.rubricUuid === rubricUuid
      );
      const scoringList = scoringQuery?.data?.data?.data?.content ?? [];
      return {
        ...criteria,
        scoring: scoringList,
      };
    });

    return {
      rubric,
      criteria: enrichedCriteria,
    };
  });

  const isLoading =
    isFetching ||
    isRubricsLoading ||
    criteriaQueries.some(q => q.isLoading) ||
    scoringQueries.some(q => q.isLoading);

  const isFetched =
    isRubricsFetched ||
    criteriaQueries.some(q => q.isFetched) ||
    scoringQueries.some(q => q.isFetched);

  const isError =
    isRubricsError || criteriaQueries.some(q => q.isError) || scoringQueries.some(q => q.isError);

  return {
    rubricsWithDetails,
    isLoading,
    isError,
    isFetched,
  };
};
