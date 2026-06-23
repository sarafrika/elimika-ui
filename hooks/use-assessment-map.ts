'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAllAssignmentsOptions, getAllQuizzesOptions } from '../services/client/@tanstack/react-query.gen';

export function useAssignmentsMap() {
    const assignmentsQuery = useQuery({
        ...getAllAssignmentsOptions({
            query: { pageable: {} },
        }),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    const assignmentMap = useMemo(() => {
        const assignments = assignmentsQuery.data?.data?.content ?? [];

        return new Map(
            assignments.map(assignment => [assignment.uuid, assignment]),
        );
    }, [assignmentsQuery.data]);

    return {
        assignmentMap,
        isLoading: assignmentsQuery.isPending,
    };
}


export function useQuizMap() {
    const quizQuery = useQuery({
        ...getAllQuizzesOptions({
            query: { pageable: { size: 1000 } },
        }),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    const quizMap = useMemo(() => {
        const quizzes = quizQuery.data?.data?.content ?? [];

        return new Map(
            quizzes.map(quiz => [quiz.uuid, quiz]),
        );
    }, [quizQuery.data]);

    return {
        quizMap,
        isLoading: quizQuery.isPending,
    };
}