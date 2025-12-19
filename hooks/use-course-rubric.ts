import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getAssessmentRubricByUuidOptions,
  getCourseRubricsOptions,
} from '../services/client/@tanstack/react-query.gen';

export function useCourseRubrics(courseId?: string) {
  const {
    data: rubricAssociationResponse,
    isLoading: isRubricAssociationLoading,
    error: rubricAssociationError,
  } = useQuery({
    ...getCourseRubricsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {} },
    }),
    enabled: !!courseId,
  });

  const associations = rubricAssociationResponse?.data?.content ?? [];

  const rubricQueries = useQueries({
    queries: associations.map((association: { rubric_uuid: string }) => ({
      ...getAssessmentRubricByUuidOptions({
        path: { uuid: association.rubric_uuid },
      }),
      enabled: !!association.rubric_uuid,
    })),
  });

  const enrichedAssociations = associations.map(
    (association: { rubric_uuid: string }, index: number) => ({
      ...association,
      rubric: rubricQueries[index]?.data?.data ?? null,
    })
  );

  return {
    data: enrichedAssociations,
    isLoading: isRubricAssociationLoading || rubricQueries.some(q => q.isLoading),
    errors: [rubricAssociationError, ...rubricQueries.map(q => q.error)].filter(Boolean),
  };
}
