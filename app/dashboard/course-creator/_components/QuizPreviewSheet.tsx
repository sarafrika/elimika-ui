'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getQuizByUuidOptions,
  getQuizQuestionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import {
  assessmentLabel,
  PreviewError,
  PreviewLoading,
  previewResponseFailed,
  PreviewSection,
  PreviewStat,
} from './AssessmentPreviewPrimitives';

const QuizQuestionList = dynamic(
  () => import('@/components/lesson/QuizQuestions').then(module => module.QuizQuestionList),
  { loading: () => <PreviewLoading /> }
);

type QuizPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizUuid: string;
  lessonTitle?: string;
};

export function QuizPreviewSheet({
  open,
  onOpenChange,
  quizUuid,
  lessonTitle,
}: QuizPreviewSheetProps) {
  const quizQuery = useQuery({
    ...getQuizByUuidOptions({ path: { uuid: quizUuid } }),
    enabled: open && Boolean(quizUuid),
    staleTime: STALE_TIMES.entity,
    refetchOnMount: 'always',
  });
  const questionsQuery = useQuery({
    ...getQuizQuestionsOptions({ path: { quizUuid } }),
    enabled: open && Boolean(quizUuid),
    staleTime: STALE_TIMES.entity,
    refetchOnMount: 'always',
  });
  const failed = quizQuery.isError || previewResponseFailed(quizQuery.data);
  const quiz = failed ? undefined : quizQuery.data?.data;
  const questionsFailed = questionsQuery.isError || previewResponseFailed(questionsQuery.data);
  const questions = useMemo(
    () =>
      questionsFailed
        ? []
        : [...(questionsQuery.data?.data ?? [])].sort((a, b) => a.display_order - b.display_order),
    [questionsFailed, questionsQuery.data?.data]
  );
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-4xl'>
        <SheetHeader className='pr-12 break-words'>
          <SheetTitle>{quiz?.title || 'Quiz preview'}</SheetTitle>
          <SheetDescription>{lessonTitle || 'Quiz details'}</SheetDescription>
        </SheetHeader>
        <div className='min-w-0 space-y-6 px-4 pb-6'>
          {quizQuery.isPending ? (
            <PreviewLoading />
          ) : failed || !quiz ? (
            <PreviewError
              title='Unable to load quiz'
              retry={() => {
                void quizQuery.refetch();
              }}
            />
          ) : (
            <>
              <div className='flex flex-wrap gap-2'>
                <Badge variant={quiz.status === 'PUBLISHED' ? 'default' : 'outline'}>
                  {assessmentLabel(quiz.status)}
                </Badge>
                <Badge variant={quiz.active ? 'default' : 'outline'}>
                  {quiz.active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant='secondary' className='gap-1'>
                  <Eye className='h-3 w-3' />
                  View only
                </Badge>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <PreviewStat
                  label='Time limit'
                  value={
                    quiz.time_limit_minutes != null ? `${quiz.time_limit_minutes} min` : 'No limit'
                  }
                />
                <PreviewStat label='Attempts allowed' value={quiz.attempts_allowed} />
                <PreviewStat label='Passing score' value={`${quiz.passing_score}%`} />
                <PreviewStat
                  label='Total points'
                  value={questionsQuery.isPending || questionsFailed ? '—' : totalPoints}
                />
              </div>
              {quiz.description && (
                <PreviewSection title='Description'>
                  <HTMLTextPreview htmlContent={quiz.description} className='text-sm' />
                </PreviewSection>
              )}
              {quiz.instructions && (
                <PreviewSection title='Instructions'>
                  <HTMLTextPreview htmlContent={quiz.instructions} className='text-sm' />
                </PreviewSection>
              )}
              <PreviewSection
                title={
                  questionsQuery.isPending || questionsFailed
                    ? 'Questions'
                    : `Questions (${questions.length})`
                }
              >
                {questionsQuery.isPending ? (
                  <PreviewLoading />
                ) : questionsFailed ? (
                  <PreviewError
                    title='Unable to load questions'
                    retry={() => {
                      void questionsQuery.refetch();
                    }}
                  />
                ) : !questions.length ? (
                  <EmptyState variant='compact' title='No questions added yet' />
                ) : open ? (
                  <QuizQuestionList key={quizUuid} quizId={quizUuid} questions={questions} />
                ) : null}
              </PreviewSection>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
