import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Circle, Clock, FileQuestion } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getQuestionOptions } from '../../../../services/client';
import { getQuizQuestionsOptions } from '../../../../services/client/@tanstack/react-query.gen';
import { Question, QuestionType } from './assessment-creation-form';

interface QuizOption {
    uuid: string;
    option_text: string;
    is_correct: boolean;
    order_index: number;
}

interface QuizQuestion {
    uuid: string;
    question_text: string;
    question_type: string;
    points: number;
    order_index: number;
    options?: QuizOption[];
}

interface Quiz {
    uuid: string;
    title: string;
    instructions: string;
    time_limit_display: string;
    attempts_allowed: number;
}

interface QuizViewerProps {
    quiz: Quiz;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuizViewer({ quiz, open, onOpenChange }: QuizViewerProps) {
    const [questionsData, setQuestionsData] = useState<Question[]>([]);

    // Fetch quiz questions
    const { data: quizquestions, isLoading: isLoadingQuizQuestions } = useQuery({
        ...getQuizQuestionsOptions({ path: { quizUuid: quiz?.uuid as string } }),
        enabled: !!quiz?.uuid && open,
    });

    // Fetch options for each question
    const questionOptionsQueries = useQueries({
        queries:
            quizquestions?.data?.map((q: any) => ({
                queryKey: ['questionOptions', quiz?.uuid, q.uuid],
                queryFn: () =>
                    getQuestionOptions({
                        path: {
                            quizUuid: quiz?.uuid!,
                            questionUuid: q.uuid,
                        },
                        query: { pageable: {} },
                    }),
                enabled: !!quiz?.uuid && !!q.uuid && open,
            })) ?? [],
    });

    const queryStates = useMemo(() => {
        return {
            allLoaded: questionOptionsQueries.every(q => !q.isLoading),
            anyError: questionOptionsQueries.some(q => q.isError),
            isLoading: questionOptionsQueries.some(q => q.isLoading),
            loadedCount: questionOptionsQueries.filter(q => q.isSuccess).length,
            totalCount: questionOptionsQueries.length,
        };
    }, [
        questionOptionsQueries.map(q => q.isLoading).join(','),
        questionOptionsQueries.map(q => q.isError).join(','),
        questionOptionsQueries.map(q => q.isSuccess).join(','),
        questionOptionsQueries.length,
    ]);

    useEffect(() => {
        if (!quiz?.uuid || !quizquestions?.data || quizquestions.data.length === 0) {
            setQuestionsData([]);
            return;
        }

        if (!queryStates.allLoaded || queryStates.anyError) {
            return;
        }

        try {
            const questionsWithOptions: Question[] = quizquestions.data.map((q: any, index: number) => {
                const optionsData = questionOptionsQueries[index]?.data?.data?.data?.content ?? [];

                const options = optionsData.map((opt: any) => ({
                    uuid: opt.uuid,
                    text: opt.option_text,
                    isCorrect: opt.is_correct,
                }));

                return {
                    uuid: q.uuid,
                    text: q.question_text,
                    type: q.question_type.toUpperCase() as QuestionType,
                    points: q.points,
                    options:
                        q.question_type === 'multiple_choice' || q.question_type === 'true_false'
                            ? options
                            : undefined,
                    pairs:
                        q.question_type === 'matching'
                            ? options.map((pair: any) => ({
                                left: pair.left_text,
                                right: pair.right_text,
                            }))
                            : undefined,
                    answer: q.question_type === 'essay' || q.question_type === 'short_answer' ? '' : undefined,
                };
            });

            setQuestionsData(questionsWithOptions);
        } catch (error) {
        }
    }, [
        quiz?.uuid,
        quizquestions?.data?.length,
        queryStates.allLoaded,
        queryStates.anyError,
    ]);


    const isLoading = isLoadingQuizQuestions || queryStates.isLoading;

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{quiz.title}</DialogTitle>
                    <div className="space-y-2">
                        <div className="mt-2 flex flex-wrap gap-3">
                            <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {quiz.time_limit_display}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                                <FileQuestion className="h-3 w-3" />
                                {questionsData.length} Questions
                            </Badge>
                            <Badge variant="secondary">Attempts: {quiz.attempts_allowed}</Badge>

                            {/* Show loading progress */}
                            {isLoading && queryStates.totalCount > 0 && (
                                <Badge variant="outline" className="gap-1">
                                    Loading {queryStates.loadedCount}/{queryStates.totalCount}
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                    <div className="space-y-6">
                        {/* Instructions */}
                        {quiz.instructions && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="mb-1 font-semibold">Instructions:</div>
                                    <div className="text-sm">{quiz.instructions}</div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i}>
                                        <CardHeader>
                                            <Skeleton className="h-6 w-3/4" />
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Error State */}
                        {queryStates.anyError && !isLoading && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Failed to load quiz questions. Please try again.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Empty State */}
                        {!isLoading && !queryStates.anyError && questionsData.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <FileQuestion className="mb-4 h-12 w-12" />
                                <h3 className="text-lg font-semibold">No Questions Found</h3>
                                <p className="mt-1 text-sm">This quiz doesn&apos;t have any questions yet.</p>
                            </div>
                        )}

                        {/* Questions */}
                        {!isLoading &&
                            !queryStates.anyError &&
                            questionsData.map((question: Question, index: number) => (
                                <Card key={question.uuid} className="border-2">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <CardTitle className="flex-1 text-base font-semibold">
                                                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                                                {question.text}
                                            </CardTitle>
                                            <Badge variant="outline" className="shrink-0">
                                                {question.points} {question.points === 1 ? 'point' : 'points'}
                                            </Badge>
                                        </div>
                                        {question.type && (
                                            <Badge variant="secondary" className="mt-2 w-fit text-xs">
                                                {question.type}
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {/* Multiple Choice / True False Options */}
                                        {question.options && question.options.length > 0 ? (
                                            question.options.map((option: any, optIndex: number) => (
                                                <div
                                                    key={option.uuid || optIndex}
                                                    className={`flex items-start gap-3 rounded-lg border-2 p-3 transition-colors ${option.isCorrect
                                                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                                                        : 'border-muted bg-muted/30'
                                                        }`}
                                                >
                                                    {option.isCorrect ? (
                                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                                                    ) : (
                                                        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-sm text-foreground">{option.text}</p>
                                                        {option.isCorrect && (
                                                            <Badge
                                                                variant="outline"
                                                                className="mt-2 bg-green-100 text-xs flex items-end just self-end dark:bg-green-900"
                                                            >
                                                                Correct Answer
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : question.type === 'MATCHING' && question.pairs ? (
                                            /* Matching Pairs */
                                            <div className="space-y-2">
                                                {question.pairs.map((pair: any, pairIndex: number) => (
                                                    <div
                                                        key={pairIndex}
                                                        className="flex items-center gap-4 rounded-lg border-2 border-muted bg-muted/30 p-3"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{pair.left}</p>
                                                        </div>
                                                        <div className="text-muted-foreground">↔</div>
                                                        <div className="flex-1">
                                                            <p className="text-sm">{pair.right}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : question.type === 'ESSAY' || question.type === 'SHORT_ANSWER' ? (
                                            /* Essay / Short Answer */
                                            <div className="rounded-lg border-2 border-muted bg-muted/30 p-3">
                                                <p className="text-sm italic text-muted-foreground">
                                                    {question.type === 'ESSAY' ? 'Essay question - written response required' : 'Short answer required'}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="py-2 text-sm italic text-muted-foreground">
                                                No options available for this question.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}