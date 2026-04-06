import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getQuestionOptionsOptions,
  getQuizQuestionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  GetQuestionOptionsResponse,
  GetQuizQuestionsResponse,
} from '@/services/client/types.gen';

type QuizQuestion = NonNullable<GetQuizQuestionsResponse['data']>[number];
type QuizQuestionOption = NonNullable<
  NonNullable<GetQuestionOptionsResponse['data']>['content']
>[number];
type QuizQuestionWithUuid = QuizQuestion & { uuid: string };

export function useQuizDetails(quizUuid: string, enabled = true) {
  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError: questionsError,
  } = useQuery({
    ...getQuizQuestionsOptions({ path: { quizUuid } }),
    enabled: !!quizUuid && enabled,
  });

  const questions = (questionsData?.data ?? []).filter(
    (question): question is QuizQuestionWithUuid => Boolean(question?.uuid)
  );

  const optionQueries = useQueries({
    queries: questions.map(q => ({
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
    return questions.map((question, index: number) => ({
      ...question,
      options: (optionQueries[index]?.data?.data?.content ?? []) as QuizQuestionOption[],
    }));
  }, [questions, optionQueries]);

  return {
    questions: mergedQuestions,
    isLoading: questionsLoading || optionsLoading,
    isError: questionsError || optionsError,
  };
}
