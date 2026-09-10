'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
    getQuestionOptionsOptions,
    getQuizByUuidOptions,
    getQuizQuestionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { QuizQuestion } from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { Check, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    assessmentLabel,
    PreviewError,
    PreviewLoading,
    previewResponseFailed,
    PreviewRubric,
    PreviewSection,
    PreviewStat,
} from './AssessmentPreviewPrimitives';

export type QuizPreviewSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quizUuid: string;
    lessonTitle?: string;
};

// Only the expanded question mounts this query; quiz size does not multiply requests.
function QuestionAnswers({
    quizUuid,
    questionUuid,
    questionType,
}: {
    quizUuid: string;
    questionUuid: string;
    questionType: QuizQuestion['question_type'];
}) {
    const [page, setPage] = useState(0);
    const query = useQuery({
        ...getQuestionOptionsOptions({
            path: { quizUuid, questionUuid },
            query: { pageable: { page, size: 20 } },
        }),
        enabled: Boolean(quizUuid && questionUuid),
        staleTime: STALE_TIMES.entity,
        refetchOnMount: 'always',
    });
    const failed = query.isError || previewResponseFailed(query.data);
    const result = failed ? undefined : query.data?.data;
    const hasNextPage =
        result?.metadata?.totalPages != null
            ? page + 1 < result.metadata.totalPages
            : (result?.content?.length ?? 0) === 20;
    const options = useMemo(
        () =>
            [...(result?.content ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
        [result?.content]
    );
    if (query.isPending) return <PreviewLoading />;
    if (failed)
        return (
            <PreviewError
                title='Unable to load answers'
                retry={() => {
                    void query.refetch();
                }}
            />
        );
    const freeText = questionType === 'ESSAY' || questionType === 'SHORT_ANSWER';
    return (
        <div className='space-y-3'>
            <p className='text-muted-foreground text-xs font-medium'>
                {questionType === 'ESSAY'
                    ? 'Model answer'
                    : freeText
                        ? 'Expected answer'
                        : 'Answer options'}
            </p>
            {options.length ? (
                <ul className='space-y-2'>
                    {options.map(option => (
                        <li
                            key={option.uuid ?? `${option.display_order}-${option.option_text}`}
                            className={cn(
                                'border-border rounded-md border px-3 py-2 text-sm',
                                option.is_correct && 'border-primary/50 bg-primary/5'
                            )}
                        >
                            <div className='flex items-start gap-2'>
                                <p className='min-w-0 flex-1 break-words whitespace-pre-wrap'>
                                    {option.option_text}
                                </p>
                                {option.is_correct && (
                                    <span className='text-primary flex shrink-0 items-center gap-1 text-xs'>
                                        <Check className='h-3 w-3' />
                                        Correct
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    variant='compact'
                    title={freeText ? 'No model answer provided' : 'No answer options added'}
                />
            )}
            {(page > 0 || hasNextPage) && (
                <div className='flex items-center justify-between gap-2'>
                    <Button
                        size='sm'
                        variant='outline'
                        disabled={page === 0}
                        onClick={() => setPage(value => value - 1)}
                    >
                        Previous
                    </Button>
                    <span className='text-muted-foreground text-xs'>Page {page + 1}</span>
                    <Button
                        size='sm'
                        variant='outline'
                        disabled={!hasNextPage}
                        onClick={() => setPage(value => value + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

export function QuizPreviewSheet({
    open,
    onOpenChange,
    quizUuid,
    lessonTitle,
}: QuizPreviewSheetProps) {

    const [expandedQuestionUuids, setExpandedQuestionUuids] = useState<Set<string>>(
        new Set()
    );

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

    const allQuestionUuids = useMemo(
        () =>
            questions
                .map(question => question.uuid)
                .filter((uuid): uuid is string => Boolean(uuid)),
        [questions]
    );

    const allAnswersExpanded =
        allQuestionUuids.length > 0 &&
        allQuestionUuids.every(uuid => expandedQuestionUuids.has(uuid));

    const toggleAllAnswers = () => {
        setExpandedQuestionUuids(current => {
            if (allAnswersExpanded) {
                return new Set();
            }

            return new Set(allQuestionUuids);
        });
    };

    const toggleQuestionAnswers = (questionUuid: string) => {
        setExpandedQuestionUuids(current => {
            const next = new Set(current);

            if (next.has(questionUuid)) {
                next.delete(questionUuid);
            } else {
                next.add(questionUuid);
            }

            return next;
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-4xl'>
                <SheetHeader className='pr-12 break-words'>
                    <SheetTitle>{quiz?.title || 'Quiz preview'}</SheetTitle>
                    <SheetDescription>{lessonTitle || 'Quiz details'}</SheetDescription>
                </SheetHeader>
                <div className='space-y-6 px-4 pb-6'>
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
                            {quiz.rubric_uuid && <PreviewRubric uuid={quiz.rubric_uuid} />}
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
                                ) : (
                                    <>
                                        <div className='flex justify-end'>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={toggleAllAnswers}
                                                disabled={!allQuestionUuids.length}
                                            >
                                                {allAnswersExpanded ? 'Hide all answers' : 'Show all answers'}
                                            </Button>
                                        </div>

                                        {questions.map((question, index) => {
                                            const isExpanded =
                                                question.uuid != null &&
                                                expandedQuestionUuids.has(question.uuid);

                                            return (
                                                <Card
                                                    key={question.uuid ?? `${question.display_order}-${index}`}
                                                >
                                                    <CardContent className='space-y-3'>
                                                        <div className='flex items-start justify-between gap-3'>
                                                            <p className='min-w-0 text-sm font-medium break-words whitespace-pre-wrap'>
                                                                {index + 1}. {question.question_text}
                                                            </p>

                                                            <Badge variant='outline' className='shrink-0'>
                                                                {question.points}{' '}
                                                                {question.points === 1 ? 'pt' : 'pts'}
                                                            </Badge>
                                                        </div>

                                                        <Badge variant='secondary'>
                                                            {assessmentLabel(question.question_type)}
                                                        </Badge>

                                                        {question.uuid && (
                                                            <div>
                                                                <Button
                                                                    variant='outline'
                                                                    size='sm'
                                                                    aria-expanded={isExpanded}
                                                                    onClick={() =>
                                                                        toggleQuestionAnswers(question.uuid!)
                                                                    }
                                                                >
                                                                    {isExpanded
                                                                        ? 'Hide answers'
                                                                        : 'Show answers'}
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {open && question.uuid && isExpanded && (
                                                            <QuestionAnswers
                                                                key={question.uuid}
                                                                quizUuid={quizUuid}
                                                                questionUuid={question.uuid}
                                                                questionType={question.question_type}
                                                            />
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </>
                                )}
                            </PreviewSection>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
