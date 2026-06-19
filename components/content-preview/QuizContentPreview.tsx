'use client';

import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock3,
    FileQuestion,
    HelpCircle,
    Target,
    Trophy,
    XCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
    getQuestionOptionsOptions,
    searchQuestionsOptions,
    searchQuizzesOptions,
} from '../../services/client/@tanstack/react-query.gen';

import type {
    QuestionTypeEnum,
    QuizQuestion,
    QuizQuestionOption,
} from '../../services/client/types.gen';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import Spinner from '../ui/spinner';
import { Textarea } from '../ui/textarea';

type QuizContentPreviewProps = {
    quizUuid: string;
    role?: 'instructor' | 'user' | 'preview';
    questionsOpen?: boolean;

};

type QuizAnswerValue = string | Record<string, string>;
type QuizQuestionOptionPreview = QuizQuestionOption & {
    left_text?: string;
    right_text?: string;
};

const QUESTION_TYPE_LABELS: Partial<Record<QuestionTypeEnum, string>> = {
    MULTIPLE_CHOICE: 'multiple_choice',
    TRUE_FALSE: 'true_false',
    ESSAY: 'essay',
    SHORT_ANSWER: 'short_answer',
    MATCHING: 'matching',
};

type QuestionOptionsPreviewProps = {
    quizUuid: string;
    questionUuid: string;
    questionType: string;

    role?: 'instructor' | 'user';

    answer?: QuizAnswerValue;

    onChange?: (value: QuizAnswerValue) => void;

    submitted?: boolean;
};

function QuestionOptionsPreview({
    quizUuid,
    questionUuid,
    questionType,
    role = 'user',
    answer,
    onChange,
    submitted = false,
}: QuestionOptionsPreviewProps) {
    const isInstructor = role === 'instructor';

    const { data, isLoading } = useQuery({
        ...getQuestionOptionsOptions({
            path: {
                quizUuid,
                questionUuid,
            },
            query: {
                pageable: {},
            },
        }),
        enabled: !!quizUuid && !!questionUuid,
    });

    const options: QuizQuestionOptionPreview[] = data?.data?.content ?? [];

    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-6'>
                <Spinner className='h-4 w-4' />
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // MULTIPLE CHOICE / TRUE FALSE
    // ─────────────────────────────────────────────────────────────

    if (
        (questionType === 'multiple_choice' ||
            questionType === 'true_false') &&
        options.length > 0
    ) {
        return (
            <div className='space-y-2'>
                {options.map((option, index: number) => {
                    const isCorrect = option.is_correct;
                    const optionUuid = option.uuid ?? option.option_text;
                    const selected =
                        typeof answer === 'string' && answer === optionUuid;

                    return (
                        <button
                            type='button'
                            key={optionUuid ?? index}
                            disabled={submitted}
                            // onClick={() => {
                            //     if (!isInstructor) {
                            //         onChange?.(optionUuid);
                            //     }
                            // }}
                            className={cn(
                                'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                                selected &&
                                'border-primary bg-primary/5',
                                isInstructor && isCorrect
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                    : 'border-border bg-background',
                                submitted &&
                                'cursor-not-allowed opacity-80'
                            )}
                        >
                            <div className='mt-0.5'>
                                {isInstructor ? (
                                    isCorrect ? (
                                        <CheckCircle2 className='h-4 w-4 text-green-600' />
                                    ) : (
                                        <XCircle className='text-muted-foreground h-4 w-4' />
                                    )
                                ) : selected ? (
                                    <CheckCircle2 className='text-primary h-4 w-4' />
                                ) : (
                                    <HelpCircle className='text-muted-foreground h-4 w-4' />
                                )}
                            </div>

                            <div className='flex-1'>
                                <p className='text-sm leading-relaxed'>
                                    {option.option_text}
                                </p>

                                {isInstructor && isCorrect && (
                                    <p className='mt-1 text-xs font-medium text-green-700 dark:text-green-400'>
                                        Correct Answer
                                    </p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // ESSAY
    // ─────────────────────────────────────────────────────────────

    if (questionType === 'essay') {
        return (
            <div className='rounded-xl border p-4'>
                {isInstructor ? (
                    <div className='space-y-3'>
                        <p className='text-sm font-semibold'>
                            Model Answer
                        </p>

                        <div className='bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap'>
                            {options?.[0]?.option_text || 'No answer provided'}
                        </div>
                    </div>
                ) : (
                    <Textarea
                        disabled={submitted}
                        value={typeof answer === 'string' ? answer : ''}
                        // onChange={(e) =>
                        //     onChange?.(e.target.value)
                        // }
                        // placeholder='Write your response here...'
                        className='min-h-[140px]'
                    />
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // SHORT ANSWER
    // ─────────────────────────────────────────────────────────────

    if (questionType === 'short_answer') {
        return (
            <div className='rounded-xl border p-4'>
                {isInstructor ? (
                    <div className='space-y-3'>
                        <p className='text-sm font-semibold'>
                            Correct Answer
                        </p>

                        <div className='bg-muted rounded-lg p-4 text-sm'>
                            {options?.[0]?.option_text || 'No answer provided'}
                        </div>
                    </div>
                ) : (
                    <Input
                        disabled={submitted}
                        value={typeof answer === 'string' ? answer : ''}
                    // onChange={(e) =>
                    //     onChange?.(e.target.value)
                    // }
                    // placeholder='Enter your answer'
                    />
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // MATCHING
    // ─────────────────────────────────────────────────────────────

    if (questionType === 'matching') {
        const matchingAnswer: Record<string, string> =
            typeof answer === 'object' && answer !== null && !Array.isArray(answer)
                ? answer
                : {};

        return (
            <div className='space-y-2'>
                {options.map((option, index: number) => (
                    <div
                        key={option.uuid ?? index}
                        className='bg-muted/40 flex items-center justify-between gap-4 rounded-lg border p-3'
                    >
                        <div className='flex-1'>
                            <p className='text-sm font-medium'>
                                {option.left_text}
                            </p>
                        </div>

                        <div className='text-sm'>
                            ↔
                        </div>

                        <div className='flex-1'>
                            {isInstructor ? (
                                <div className='text-right text-sm'>
                                    {option.right_text}
                                </div>
                            ) : (
                                <select
                                    disabled={submitted}
                                    value={matchingAnswer[option.uuid ?? option.option_text] || ''}
                                    // onChange={(e) =>
                                    //     onChange?.({
                                    //         ...matchingAnswer,
                                    //         [option.uuid ?? option.option_text]:
                                    //             e.target
                                    //                 .value,
                                    //     })
                                    // }
                                    className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    <option value=''>
                                        Select match
                                    </option>

                                    {options.map((rightOption: QuizQuestionOptionPreview) => {
                                        const rightOptionUuid =
                                            rightOption.uuid ?? rightOption.option_text;

                                        return (
                                            <option
                                                key={
                                                    rightOptionUuid
                                                }
                                                value={
                                                    rightOptionUuid
                                                }
                                            >
                                                {
                                                    rightOption.right_text
                                                }
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className='text-muted-foreground text-sm'>
            No options available.
        </div>
    );
}

export function QuizContentPreview({
    quizUuid,
    role = 'user',
    questionsOpen = true
}: QuizContentPreviewProps) {
    const isInstructor = role === 'instructor';

    const [isQuestionsOpen, setIsQuestionsOpen] =
        useState(questionsOpen);

    useEffect(() => {
        setIsQuestionsOpen(questionsOpen);
    }, [questionsOpen]);

    const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});

    const [submitted, setSubmitted] =
        useState(false);

    const updateAnswer = (questionUuid: string, value: QuizAnswerValue) => {
        setAnswers((prev) => ({
            ...prev,
            [questionUuid]: value,
        }));
    };

    const handleSubmitQuiz = async () => {
        try {
            const formattedAnswers = Object.entries(
                answers
            ).map(([questionUuid, value]) => ({
                question_uuid: questionUuid,

                selected_option_uuid:
                    typeof value === 'string' &&
                        value.length < 100
                        ? value
                        : undefined,

                text_answer:
                    typeof value === 'string'
                        ? value
                        : undefined,

                matching_pairs:
                    typeof value === 'object'
                        ? value
                        : undefined,
            }));

            const payload = {
                quiz_uuid: quizUuid,
                answers: formattedAnswers,
            };

            // console.log(payload);

            /**
             * TODO:
             * submit mutation here
             */

            setSubmitted(true);
        } catch (error) {
            // console.error(error);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // QUIZ
    // ─────────────────────────────────────────────────────────────

    const { data: quizData, isLoading: isQuizLoading } =
        useQuery({
            ...searchQuizzesOptions({
                query: {
                    pageable: {},
                    searchParams: {
                        uuid_eq: quizUuid,
                    },
                },
            }),
            enabled: !!quizUuid,
        });

    const quiz = quizData?.data?.content?.[0];

    // ─────────────────────────────────────────────────────────────
    // QUESTIONS
    // ─────────────────────────────────────────────────────────────

    const {
        data: questionsData,
        isLoading: isQuestionsLoading,
    } = useQuery({
        ...searchQuestionsOptions({
            query: {
                pageable: {},
                searchParams: {
                    quiz_uuid_eq: quizUuid,
                },
            },
        }),
        enabled: !!quizUuid,
    });

    const questions: QuizQuestion[] = questionsData?.data?.content ?? [];

    const isLoading =
        isQuizLoading || isQuestionsLoading;

    if (isLoading) {
        return (
            <div className='flex min-h-[300px] items-center justify-center'>
                <Spinner className='h-6 w-6' />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className='text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm'>
                Quiz not found.
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <Card className='shadow-none'>
                <CardHeader className='space-y-5'>
                    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                        <div className='space-y-3'>
                            <CardTitle className='text-2xl font-bold tracking-tight'>
                                {quiz.title}
                            </CardTitle>

                            {quiz.instructions && (
                                <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed whitespace-pre-wrap'>
                                    {
                                        quiz.instructions
                                    }
                                </p>
                            )}
                        </div>

                        <Badge
                            variant={
                                quiz.active
                                    ? 'default'
                                    : 'secondary'
                            }
                            className={cn(
                                'w-fit',
                                quiz.active &&
                                'bg-green-600 hover:bg-green-700'
                            )}
                        >
                            {quiz.active
                                ? 'Active'
                                : 'Inactive'}
                        </Badge>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant='secondary'>
                            <Clock3 className='mr-1 h-3.5 w-3.5' />
                            {quiz.time_limit_minutes ||
                                0}{' '}
                            mins
                        </Badge>

                        <Badge variant='outline'>
                            <Target className='mr-1 h-3.5 w-3.5' />
                            Pass Score:{' '}
                            {quiz.passing_score ||
                                0}
                            %
                        </Badge>

                        <Badge variant='outline'>
                            <Trophy className='mr-1 h-3.5 w-3.5' />
                            Attempts:{' '}
                            {quiz.attempts_allowed ||
                                1}
                        </Badge>

                        <Badge variant='outline'>
                            {questions.length}{' '}
                            Questions
                        </Badge>

                        {isInstructor && (
                            <Badge className='border-primary/20 text-primary bg-primary/10 border'>
                                Instructor Preview
                            </Badge>
                        )}

                        {!isInstructor &&
                            submitted && (
                                <Badge className='bg-green-600 hover:bg-green-700'>
                                    Submitted
                                </Badge>
                            )}
                    </div>
                </CardHeader>
            </Card>

            <div className='space-y-4'>
                <Button
                    variant="ghost"
                    className="hover:bg-muted/40 hover:text-foreground w-full justify-between rounded-sm"
                    onClick={() => setIsQuestionsOpen((prev) => !prev)}
                >
                    <div className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Quiz Questions</h2>
                        <Badge variant="outline">{questions.length}</Badge>
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                            {isQuestionsOpen ? 'Collapse' : 'Expand'}
                        </span>

                        {isQuestionsOpen ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </div>
                </Button>

                {isQuestionsOpen && (<>
                    {questions.length === 0 ? (
                        <div className='text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm'>
                            No questions available
                            for this quiz.
                        </div>
                    ) : (
                        <>
                            {questions.map(
                                (question, index: number) => {
                                    const questionUuid = question.uuid ?? `question-${index}`;

                                    return (
                                        <Card
                                            key={
                                                questionUuid
                                            }
                                            className='overflow-hidden shadow-none'
                                        >
                                            <CardContent className='space-y-5 pt-6'>
                                                <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                                                    <div className='space-y-3'>
                                                        <div className='flex flex-wrap items-center gap-2'>
                                                            <Badge variant='secondary'>
                                                                {QUESTION_TYPE_LABELS[
                                                                    question.question_type
                                                                ] ||
                                                                    question.question_type}
                                                            </Badge>

                                                            <Badge variant='outline'>
                                                                {question.points ??
                                                                    1}{' '}
                                                                pts
                                                            </Badge>
                                                        </div>

                                                        <h3 className='text-base leading-relaxed font-medium'>
                                                            {index +
                                                                1}
                                                            .{' '}
                                                            {
                                                                question.question_text
                                                            }
                                                        </h3>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <QuestionOptionsPreview
                                                    quizUuid={
                                                        quizUuid
                                                    }
                                                    questionUuid={
                                                        questionUuid
                                                    }
                                                    questionType={
                                                        question.question_type
                                                    }
                                                    role={role}
                                                    answer={
                                                        answers[
                                                        questionUuid
                                                        ]
                                                    }
                                                    submitted={
                                                        submitted
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        updateAnswer(
                                                            questionUuid,
                                                            value
                                                        )
                                                    }
                                                />
                                            </CardContent>
                                        </Card>
                                    );
                                }
                            )}

                            {role === 'preview' && (
                                <div className='flex justify-end pt-4'>
                                    <Button
                                        disabled={
                                            submitted
                                        }
                                        onClick={
                                            handleSubmitQuiz
                                        }
                                    >
                                        {submitted
                                            ? 'Quiz Submitted'
                                            : 'Submit Quiz'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                </>)}
            </div>
        </div>
    );
}
