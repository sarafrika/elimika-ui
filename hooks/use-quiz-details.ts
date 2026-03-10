import {
  getQuestionOptionsOptions,
  getQuizQuestionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useQuizDetails(quizUuid: string, enabled = true) {
  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError: questionsError,
  } = useQuery({
    ...getQuizQuestionsOptions({ path: { quizUuid } }),
    enabled: !!quizUuid && enabled,
  });

  const questions: any[] = questionsData?.data ?? [];

  const optionQueries = useQueries({
    queries: questions.map((q: any) => ({
      ...getQuestionOptionsOptions({
        path: { quizUuid, questionUuid: q.uuid },
        query: { pageable: {} },
      }),
      // Only fire once we actually have the question list
      enabled: !!quizUuid && enabled && questions.length > 0,
    })),
  });

  const optionsLoading = optionQueries.some(q => q.isLoading);
  const optionsError = optionQueries.some(q => q.isError);

  // Merge questions ← options
  const mergedQuestions = useMemo(() => {
    return questions.map((question: any, index: number) => ({
      ...question,
      options: optionQueries[index]?.data?.data?.content ?? [],
    }));
  }, [questions, optionQueries]);

  return {
    questions: mergedQuestions,
    isLoading: questionsLoading || optionsLoading,
    isError: questionsError || optionsError,
  };
}
