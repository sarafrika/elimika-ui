import { getRubricCriteria, getRubricScoring } from '@/services/client';
import { searchAssessmentRubricsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';


// const { data: allRubrics } = useQuery(searchAssessmentRubricsOptions({ query: { pageable: {}, searchParams: { instructor_uuid_eq: instructor?.uuid as string, } } }))

// const rubricUuids = allRubrics?.data?.content?.map((rubric: any) => rubric.uuid) ?? [];

// const combinedCriteriaQueries = useQueries({
//     queries: rubricUuids.map((rubricUuid) => ({
//         queryKey: ['criteria', rubricUuid],
//         queryFn: () =>
//             getRubricCriteria({
//                 path: { rubricUuid: rubricUuid },
//                 query: { pageable: {} },
//             }),
//         enabled: !!rubricUuid,
//     })),
// });

// const criteriaDataArray = combinedCriteriaQueries.map((criteriaQuery) => criteriaQuery.data);
// console.log('criteriaDataArray', criteriaDataArray);

// // rubricUuids corresponds to the criteriaDataArray by index
// const criteriaPairs = criteriaDataArray.flatMap((criteriaData, index) => {
//     const rubricUuid = rubricUuids[index];
//     const criteriaList = criteriaData?.data?.data?.content ?? [];

//     return criteriaList.map((criteria: any) => ({
//         rubricUuid,
//         criteriaUuid: criteria.uuid,
//     }));
// });
// console.log('criteriaPairs', criteriaPairs);


// const scoringQueries = useQueries({
//     queries: criteriaPairs.map(({ rubricUuid, criteriaUuid }) => ({
//         queryKey: ['scoring', rubricUuid, criteriaUuid],
//         queryFn: () =>
//             getRubricScoring({
//                 path: { rubricUuid, criteriaUuid },
//                 query: { pageable: {} },
//             }),
//         enabled: !!rubricUuid && !!criteriaUuid, // enable per query, not globally
//     })),
// });
// const scoringDataArray = scoringQueries.map(q => q.data);
// console.log('scoringDataArray', scoringDataArray);

export const useRubricsWithCriteriaAndScoring = (instructorUuid?: string) => {
    const { data: allRubrics, isLoading: isRubricsLoading, isError: isRubricsError } = useQuery(
        searchAssessmentRubricsOptions({
            query: {
                pageable: {},
                searchParams: { instructor_uuid_eq: instructorUuid as string },
            },
        })
    );

    const rubricList = allRubrics?.data?.content ?? [];
    const rubricUuids = rubricList.map((rubric: any) => rubric.uuid);

    const criteriaQueries = useQueries({
        queries: rubricUuids.map((rubricUuid) => ({
            queryKey: ['criteria', rubricUuid],
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
            queryKey: ['scoring', rubricUuid, criteriaUuid],
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

    const isLoading = isRubricsLoading || criteriaQueries.some(q => q.isLoading) || scoringQueries.some(q => q.isLoading);
    const isError = isRubricsError || criteriaQueries.some(q => q.isError) || scoringQueries.some(q => q.isError);

    return {
        rubricsWithDetails,
        isLoading,
        isError,
    };
};
