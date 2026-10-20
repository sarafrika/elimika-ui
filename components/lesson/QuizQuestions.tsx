'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  searchQuestionsInfiniteOptions,
  getQuestionOptionsInfiniteOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { STALE_TIMES } from '@/lib/query-client';
import type { QuizQuestion } from '@/services/client/types.gen';
import { WorkbookLoading } from './WorkbookLoading';
import { WorkbookError } from './WorkbookError';
import { hasApiError, nextWorkbookPage, WORKBOOK_PAGE_SIZE } from './workbook-data';

export function QuizQuestions({ quizId }: { quizId: string }) {
  const query = useInfiniteQuery({
    ...searchQuestionsInfiniteOptions({
      query: { searchParams: { quiz_uuid_eq: quizId }, pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(quizId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || query.data?.pages.some(hasApiError))
    return <WorkbookError title='Unable to load questions' retry={() => void query.refetch()} />;
  const questions = query.data?.pages.flatMap(page => page.data?.content ?? []) ?? [];
  return (
    <div className='space-y-4'>
      <QuizQuestionList key={quizId} quizId={quizId} questions={questions} />
      {query.hasNextPage && (
        <Button
          variant='outline'
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Load more questions
        </Button>
      )}
    </div>
  );
}

// Shared by the instructor training preview and course/program assessment sheets.
// Keep one answer panel open so displaying a quiz never starts a query per question.
export function QuizQuestionList({
  quizId,
  questions,
}: {
  quizId: string;
  questions: QuizQuestion[];
}) {
  const [selected, setSelected] = useState('');
  return (
    <div className='space-y-4'>
      {!questions.length && <EmptyState title='No quiz questions' />}
      {questions.map((question, index) => {
        const questionId = question.uuid;
        const expanded = selected === questionId;
        return (
          <div key={questionId ?? index} className='border-border space-y-3 rounded-lg border p-4'>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline'>{question.question_type.replaceAll('_', ' ')}</Badge>
              <Badge variant='secondary'>{question.points} points</Badge>
            </div>
            <p className='break-words whitespace-pre-wrap'>
              {index + 1}. {question.question_text}
            </p>
            {questionId && (
              <Button
                type='button'
                variant='ghost'
                aria-expanded={expanded}
                onClick={() => setSelected(current => (current === questionId ? '' : questionId))}
              >
                {expanded ? 'Hide answer options' : 'Show answer options'}
              </Button>
            )}
            {questionId && expanded && <QuestionOptions quizId={quizId} questionId={questionId} />}
          </div>
        );
      })}
    </div>
  );
}

function QuestionOptions({ quizId, questionId }: { quizId: string; questionId: string }) {
  const query = useInfiniteQuery({
    ...getQuestionOptionsInfiniteOptions({
      path: { quizUuid: quizId, questionUuid: questionId },
      query: { pageable: { size: WORKBOOK_PAGE_SIZE } },
    }),
    initialPageParam: 0,
    getNextPageParam: nextWorkbookPage,
    enabled: Boolean(quizId && questionId),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || query.data?.pages.some(hasApiError))
    return (
      <WorkbookError title='Unable to load answer options' retry={() => void query.refetch()} />
    );
  const options = query.data?.pages.flatMap(page => page.data?.content ?? []) ?? [];
  return (
    <div className='space-y-2'>
      {!options.length && (
        <p className='text-muted-foreground text-sm'>No answer options provided.</p>
      )}
      {options.map((option, index) => (
        <div key={option.uuid ?? index} className='bg-muted/40 rounded-lg p-3 text-sm'>
          <p>{option.option_text}</p>
          {option.is_correct && <Badge variant='secondary'>Correct answer</Badge>}
        </div>
      ))}
      {query.hasNextPage && (
        <Button
          variant='outline'
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Load more options
        </Button>
      )}
    </div>
  );
}
