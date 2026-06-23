'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useStudent } from '@/context/student-context';
import { useQuizDetails } from '@/hooks/use-quiz-details';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { cx, getEmptyStateClasses } from '@/lib/design-system';
import { Student } from '@/services/api/schema';
import {
    getEnrollmentsForClassOptions,
    getQuizAttemptsOptions,
    getQuizByUuidOptions,
    getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
    ClassQuizSchedule,
    Enrollment,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    QuizQuestionOption,
} from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    FileQuestion,
    RotateCcw,
    Send,
    Sparkles,
    XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// ── Re-used types (same as workspace) ────────────────────────────────────────

type ClassMeta = {
    classUuid: string;
    classTitle: string;
    courseTitle: string;
    enrollmentUuid?: string;
};

type QuizMode = 'attempt' | 'review';

type QuizRow = {
    classMeta: ClassMeta;
    attempts: QuizAttempt[];
    quiz: Quiz;
    schedule: ClassQuizSchedule;
};

type AnswerMap = Record<string, string | string[]>;
type StudentClassDefinitionRow = ReturnType<
    typeof useStudentClassDefinitions
>['classDefinitions'][number];
type QuizQuestionWithOptions = QuizQuestion & { options: QuizQuestionOption[] };
type ResolvedClassDetails = {
    class_definition?: { title?: string; uuid?: string };
    course_name?: string;
    name?: string;
    title?: string;
    uuid?: string;
};

// ── Helpers (same as workspace) ───────────────────────────────────────────────

function getClassTitle(classDetails?: ResolvedClassDetails) {
    return (
        classDetails?.class_definition?.title ||
        classDetails?.title ||
        classDetails?.name ||
        'Untitled class'
    );
}

function formatDate(value?: string | Date | null) {
    if (!value) return 'No deadline';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No deadline';
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function formatEnum(value?: string | null) {
    if (!value) return 'Not set';
    return value
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getScoreTier(percentage: number): 'pass' | 'borderline' | 'fail' {
    if (percentage >= 70) return 'pass';
    if (percentage >= 50) return 'borderline';
    return 'fail';
}

const normalizeAnswer = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

// ── Score calculation (same as workspace) ────────────────────────────────────

type QuizResult = {
    earnedPoints: number;
    totalPoints: number;
    percentage: number;
    correctCount: number;
    incorrectCount: number;
};

function calculateQuizResult(
    questions: QuizQuestionWithOptions[],
    answers: AnswerMap
): QuizResult {
    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach(question => {
        const points = Number(question.points ?? 0);
        totalPoints += points;

        const answer = answers[question.uuid!];
        const type = String(question.question_type).toLowerCase();

        if (type === 'multiple_choice') {
            const correctOptions = question.options.filter(o => o.is_correct).map(o => o.uuid);
            const selectedOptions = Array.isArray(answer) ? answer : answer ? [answer] : [];
            const isCorrect =
                selectedOptions.length === correctOptions.length &&
                selectedOptions.every(id => correctOptions.includes(id));
            if (isCorrect) { earnedPoints += points; correctCount++; }
            else incorrectCount++;
        }

        if (type === 'short_answer' || type === 'short_text') {
            const expected = question.options?.find(o => o.is_correct)?.option_text?.trim().toLowerCase() ?? '';
            const isCorrect = normalizeAnswer(String(answer || '')) === normalizeAnswer(expected);
            if (isCorrect) { earnedPoints += points; correctCount++; }
            else incorrectCount++;
        }
    });

    return {
        earnedPoints,
        totalPoints,
        percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
        correctCount,
        incorrectCount,
    };
}

// ── Score Summary Card (same as workspace) ───────────────────────────────────

function ScoreSummaryCard({ result }: { result: QuizResult }) {
    const tier = getScoreTier(result.percentage);
    const tierStyles = {
        pass: {
            card: 'border-success/30 bg-success/5',
            badge: 'bg-success/15 text-success border-success/30',
            label: 'Passed',
        },
        borderline: {
            card: 'border-warning/30 bg-warning/5',
            badge: 'bg-warning/15 text-warning border-warning/30',
            label: 'Almost there',
        },
        fail: {
            card: 'border-destructive/30 bg-destructive/5',
            badge: 'bg-destructive/10 text-destructive border-destructive/30',
            label: 'Needs improvement',
        },
    }[tier];

    return (
        <Card className={cx('border', tierStyles.card)}>
            <CardContent className='p-5'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center gap-4'>
                        <div className='bg-background/80 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border'>
                            <CheckCircle2 className='text-primary h-6 w-6' />
                        </div>
                        <div>
                            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                                Your score
                            </p>
                            <p className='text-foreground text-3xl font-bold leading-none'>
                                {result.earnedPoints}
                                <span className='text-muted-foreground text-lg font-medium'>
                                    /{result.totalPoints}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className='flex flex-col items-start gap-2 sm:items-end'>
                        <span
                            className={cx(
                                'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
                                tierStyles.badge
                            )}
                        >
                            {result.percentage}% · {tierStyles.label}
                        </span>
                        <div className='text-muted-foreground flex gap-4 text-xs'>
                            <span className='text-success flex items-center gap-1 font-medium'>
                                <CheckCircle2 className='h-3.5 w-3.5' />
                                {result.correctCount} correct
                            </span>
                            <span className='text-destructive flex items-center gap-1 font-medium'>
                                <XCircle className='h-3.5 w-3.5' />
                                {result.incorrectCount} incorrect
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentQuizSubmissionPage() {
    const params = useParams();
    const quizId = params?.id as string;
    const router = useRouter();
    const student = useStudent();

    // ── Local state (mirrors workspace Sheet state) ──────────────────────────
    const [answerDrafts, setAnswerDrafts] = useState<AnswerMap>({});
    const [mode, setMode] = useState<QuizMode>('attempt');
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

    // ── Data fetching (same pipeline as workspace, scoped to this quiz) ──────
    const { classDefinitions, loading: classDefinitionsLoading } =
        useStudentClassDefinitions(student as Student);

    const classItems = useMemo(
        () =>
            (classDefinitions ?? [])
                .map((classDefinition: StudentClassDefinitionRow) => {
                    const classDetails = classDefinition.classDetails as ResolvedClassDetails | undefined;
                    return {
                        classTitle: getClassTitle(classDetails),
                        classUuid:
                            classDefinition.uuid || classDetails?.uuid || classDetails?.class_definition?.uuid,
                        courseTitle:
                            classDefinition.course?.name || classDetails?.course_name || 'Untitled course',
                    };
                })
                .filter(
                    (item): item is { classTitle: string; classUuid: string; courseTitle: string } =>
                        Boolean(item.classUuid)
                ),
        [classDefinitions]
    );

    const classEnrollmentQueries = useQueries({
        queries: classItems.map(classItem => ({
            ...getEnrollmentsForClassOptions({ path: { uuid: classItem.classUuid } }),
            enabled: !!classItem.classUuid,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        })),
    });

    const classMetaList = useMemo<ClassMeta[]>(
        () =>
            classItems.map((classItem, index) => {
                const enrollments = classEnrollmentQueries[index]?.data?.data ?? [];
                const matchingEnrollment =
                    enrollments.find((e: Enrollment) => e.student_uuid === student?.uuid) ?? null;
                return { ...classItem, enrollmentUuid: matchingEnrollment?.uuid };
            }),
        [classEnrollmentQueries, classItems, student?.uuid]
    );

    const quizScheduleQueries = useQueries({
        queries: classMetaList.map(classMeta => ({
            ...getQuizSchedulesOptions({ path: { classUuid: classMeta.classUuid } }),
            enabled: !!classMeta.classUuid,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        })),
    });

    const scheduleRows = useMemo(
        () =>
            classMetaList.flatMap((classMeta, index) => {
                const schedules = quizScheduleQueries[index]?.data?.data ?? [];
                return schedules.map((schedule: ClassQuizSchedule) => ({ classMeta, schedule }));
            }),
        [classMetaList, quizScheduleQueries]
    );

    // Only fetch the specific quiz by UUID from params
    const quizDetailQuery = useQueries({
        queries: [
            {
                ...getQuizByUuidOptions({ path: { uuid: quizId } }),
                enabled: !!quizId,
                staleTime: 5 * 60 * 1000,
                refetchOnWindowFocus: false,
            },
        ],
    })[0];

    const quizAttemptsQuery = useQueries({
        queries: [
            {
                ...getQuizAttemptsOptions({ path: { quizUuid: quizId }, query: { pageable: {} } }),
                enabled: !!quizId,
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        ],
    })[0];

    // Find the schedule row that matches this quiz UUID
    const matchingScheduleRow = useMemo(
        () => scheduleRows.find(row => row.schedule.quiz_uuid === quizId) ?? null,
        [scheduleRows, quizId]
    );

    // Build the QuizRow (same shape as in workspace quizRows)
    const selectedQuiz = useMemo<QuizRow | null>(() => {
        const quiz = quizDetailQuery?.data?.data;
        if (!quiz || !matchingScheduleRow) return null;

        const allAttempts: QuizAttempt[] =
            quizAttemptsQuery?.data?.data?.content ?? [];

        const attempts = allAttempts.filter(
            (attempt: QuizAttempt) =>
                !matchingScheduleRow.classMeta.enrollmentUuid ||
                attempt.enrollment_uuid === matchingScheduleRow.classMeta.enrollmentUuid
        );

        return {
            classMeta: matchingScheduleRow.classMeta,
            quiz,
            schedule: matchingScheduleRow.schedule,
            attempts,
        };
    }, [quizDetailQuery, quizAttemptsQuery, matchingScheduleRow]);

    // Questions (same hook as workspace)
    const { questions, isLoading: questionsLoading } = useQuizDetails(
        quizId,
        !!quizId
    );
    const quizQuestions = questions as QuizQuestionWithOptions[];

    // ── Derived answer state ─────────────────────────────────────────────────
    const selectedAnswers = answerDrafts;

    const isPageLoading =
        classDefinitionsLoading ||
        classEnrollmentQueries.some(q => q.isLoading) ||
        quizScheduleQueries.some(q => q.isLoading) ||
        quizDetailQuery?.isLoading ||
        quizAttemptsQuery?.isLoading;

    // ── Answer helpers (same as workspace) ──────────────────────────────────
    const setAnswerValue = (questionUuid: string, value: string | string[]) => {
        setAnswerDrafts(prev => ({ ...prev, [questionUuid]: value }));
    };

    const toggleOption = (questionUuid: string, optionUuid: string, multiple: boolean) => {
        const currentValue = selectedAnswers[questionUuid];
        if (!multiple) { setAnswerValue(questionUuid, optionUuid); return; }
        const current = Array.isArray(currentValue) ? currentValue : [];
        const next = current.includes(optionUuid)
            ? current.filter(v => v !== optionUuid)
            : [...current, optionUuid];
        setAnswerValue(questionUuid, next);
    };

    const handleFinishAttempt = () => {
        if (!quizQuestions?.length) return;
        setQuizResult(calculateQuizResult(quizQuestions, selectedAnswers));
        setMode('review');
    };

    const handleRetake = () => {
        setAnswerDrafts({});
        setQuizResult(null);
        setMode('attempt');
    };

    // ── Loading / not-found ──────────────────────────────────────────────────
    if (isPageLoading) {
        return (
            <div className='w-full mx-auto max-w-7xl space-y-6 p-5 sm:p-6'>
                <Skeleton className='h-10 w-40 rounded-full' />
                <Skeleton className='h-32 rounded-2xl' />
                <div className='grid gap-3 md:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className='h-20 rounded-2xl' />
                    ))}
                </div>
                <Skeleton className='h-40 rounded-2xl' />
                <Skeleton className='h-40 rounded-2xl' />
                <Skeleton className='h-40 rounded-2xl' />
            </div>
        );
    }

    if (!selectedQuiz) {
        return (
            <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center'>
                <FileQuestion className='text-primary/70 h-10 w-10' />
                <div className='space-y-1'>
                    <h3 className='text-lg font-semibold'>Quiz not found</h3>
                    <p className='text-muted-foreground max-w-lg text-sm'>
                        This quiz may not be scheduled for your current classes.
                    </p>
                </div>
                <Button variant='outline' onClick={() => router.push('/dashboard/assignment')}>
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Back to assignments
                </Button>
            </div>
        );
    }

    // ── Render (mirrors the Sheet body from StudentQuizWorkspace) ────────────
    return (
        <div className='mx-auto w-full max-7-4xl space-y-6 p-5 sm:p-6'>

            {/* ── Page header (replaces SheetHeader) ───────────────────────────── */}
            <div className='border-border/60 space-y-3 border-b pb-5'>
                <Button
                    variant='ghost'
                    size='sm'
                    className='-ml-2 mb-2 rounded-full'
                    onClick={() => router.push('/dashboard/assignment')}
                >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    All quizzes
                </Button>

                <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary'>{selectedQuiz.classMeta.courseTitle}</Badge>
                    <Badge variant='outline'>{selectedQuiz.classMeta.classTitle}</Badge>
                </div>

                <h1 className='text-foreground text-2xl font-semibold'>
                    {selectedQuiz.quiz.title || 'Quiz attempt'}
                </h1>

                <p className='text-muted-foreground text-sm'>
                    {selectedQuiz.classMeta.courseTitle} · {selectedQuiz.classMeta.classTitle}
                </p>
            </div>

            {/* ── Meta grid (same 4-cell layout as Sheet) ──────────────────────── */}
            <div className='grid gap-3 md:grid-cols-4'>
                {[
                    { label: 'Due date', value: formatDate(selectedQuiz.schedule?.due_at) },
                    {
                        label: 'Time limit',
                        value:
                            selectedQuiz.schedule?.time_limit_override ??
                            selectedQuiz.quiz?.time_limit_display ??
                            selectedQuiz.quiz?.time_limit_minutes ??
                            'Not timed',
                    },
                    { label: 'Attempts used', value: selectedQuiz.attempts.length },
                    {
                        label: 'Passing score',
                        value:
                            selectedQuiz.schedule?.passing_score_override ??
                            selectedQuiz.quiz?.passing_score ??
                            'Not set',
                    },
                ].map(cell => (
                    <div
                        key={cell.label}
                        className='border-border/60 bg-background/70 rounded-2xl border p-3'
                    >
                        <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                            {cell.label}
                        </p>
                        <p className='text-foreground mt-1 text-sm font-medium'>{cell.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Score summary (shown after finishing) or student-view notice ──── */}
            {mode === 'review' && quizResult ? (
                <ScoreSummaryCard result={quizResult} />
            ) : (
                <div className='border-border/60 bg-card/80 flex items-start gap-3 rounded-2xl border p-4'>
                    <Sparkles className='text-primary mt-0.5 h-5 w-5 shrink-0' />
                    <div className='space-y-1'>
                        <p className='text-foreground text-sm font-medium'>Student view</p>
                        <p className='text-muted-foreground text-sm'>
                            Correct options remain hidden here. Your selections stay in this workspace while you
                            review the quiz.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Questions list ────────────────────────────────────────────────── */}
            {questionsLoading ? (
                <div className='space-y-4'>
                    <Skeleton className='h-40 rounded-2xl' />
                    <Skeleton className='h-40 rounded-2xl' />
                    <Skeleton className='h-40 rounded-2xl' />
                </div>
            ) : quizQuestions.length === 0 ? (
                <div className={cx(getEmptyStateClasses(), 'min-h-[240px]')}>
                    <FileQuestion className='text-primary/70 h-10 w-10' />
                    <div className='space-y-1 text-center'>
                        <h3 className='text-lg font-semibold'>No questions available</h3>
                        <p className='text-muted-foreground max-w-lg text-sm'>
                            This quiz does not have any questions configured yet.
                        </p>
                    </div>
                </div>
            ) : (
                <div className='space-y-4'>
                    {quizQuestions
                        .slice()
                        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                        .map((question, index) => {
                            const questionUuid = question.uuid ?? `question-${index}`;
                            const multipleAnswersAllowed =
                                String(question.question_type || '').toUpperCase() === 'MULTIPLE_CHOICE' &&
                                (question.options ?? []).filter(o => o.is_correct).length > 1;

                            const currentValue = selectedAnswers[questionUuid];
                            const selectedOptionValues = Array.isArray(currentValue)
                                ? currentValue
                                : currentValue
                                    ? [currentValue]
                                    : [];

                            const questionType = String(question.question_type || '').toUpperCase();
                            const isTextQuestion =
                                questionType === 'SHORT_TEXT' ||
                                questionType === 'SHORT_ANSWER' ||
                                questionType === 'ESSAY';

                            // Per-question correctness for review indicator
                            const isQuestionCorrect =
                                mode === 'review'
                                    ? (() => {
                                        const type = String(question.question_type || '').toLowerCase();
                                        if (type === 'multiple_choice') {
                                            const correctIds = (question.options ?? [])
                                                .filter(o => o.is_correct)
                                                .map(o => o.uuid);
                                            return (
                                                selectedOptionValues.length === correctIds.length &&
                                                selectedOptionValues.every(id => correctIds.includes(id))
                                            );
                                        }
                                        if (
                                            type === 'short_answer' ||
                                            type === 'short_text' ||
                                            type === 'essay'
                                        ) {
                                            const expected =
                                                question.options?.find(o => o.is_correct)?.option_text?.trim().toLowerCase() ?? '';
                                            return normalizeAnswer(String(currentValue || '')) === normalizeAnswer(expected);
                                        }
                                        return false;
                                    })()
                                    : null;

                            return (
                                <Card
                                    key={questionUuid}
                                    className={cx(
                                        'border-border/60 transition-colors',
                                        mode === 'review' && isQuestionCorrect === true && 'border-success/30',
                                        mode === 'review' && isQuestionCorrect === false && 'border-destructive/30'
                                    )}
                                >
                                    <CardContent className='space-y-4 p-5'>
                                        {/* Question header */}
                                        <div className='space-y-2'>
                                            <div className='flex flex-wrap items-center gap-2'>
                                                <Badge variant='outline'>Question {index + 1}</Badge>
                                                <Badge variant='secondary'>{formatEnum(question.question_type)}</Badge>
                                                <Badge variant='secondary'>
                                                    {question.points_display || `${question.points ?? 0} pts`}
                                                </Badge>
                                                {mode === 'review' && (
                                                    <Badge
                                                        variant={isQuestionCorrect ? 'default' : 'destructive'}
                                                        className={cx(
                                                            'ml-auto',
                                                            isQuestionCorrect &&
                                                            'bg-success/15 text-success border-success/30 border'
                                                        )}
                                                    >
                                                        {isQuestionCorrect ? (
                                                            <span className='flex items-center gap-1'>
                                                                <CheckCircle2 className='h-3 w-3' /> Correct
                                                            </span>
                                                        ) : (
                                                            <span className='flex items-center gap-1'>
                                                                <XCircle className='h-3 w-3' /> Incorrect
                                                            </span>
                                                        )}
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className='text-foreground font-medium'>{question.question_text}</p>

                                            {(question.options?.length ?? 0) > 0 && (
                                                <p className='text-muted-foreground text-xs'>
                                                    {multipleAnswersAllowed
                                                        ? 'Select all options that apply.'
                                                        : 'Select one answer.'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Answer area */}
                                        {isTextQuestion ? (
                                            <div className='space-y-3'>
                                                {mode === 'attempt' && (
                                                    <Textarea
                                                        rows={questionType === 'ESSAY' ? 6 : 3}
                                                        value={typeof currentValue === 'string' ? currentValue : ''}
                                                        onChange={e => setAnswerValue(questionUuid, e.target.value)}
                                                        placeholder={
                                                            questionType === 'ESSAY'
                                                                ? 'Write your essay here...'
                                                                : 'Type your answer here...'
                                                        }
                                                    />
                                                )}

                                                {mode === 'review' && (() => {
                                                    const submittedAnswer = String(currentValue || '');
                                                    const correctAnswer =
                                                        question.options?.find(o => o.is_correct)?.option_text || '';
                                                    const isCorrect =
                                                        normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer);

                                                    return (
                                                        <div className='space-y-2'>
                                                            <div
                                                                className={cx(
                                                                    'rounded-xl border p-4',
                                                                    isCorrect
                                                                        ? 'border-success/40 bg-success/5'
                                                                        : 'border-destructive/40 bg-destructive/5'
                                                                )}
                                                            >
                                                                <p className='text-muted-foreground text-xs'>Your answer</p>
                                                                <p className='mt-1 text-sm'>
                                                                    {submittedAnswer || 'No answer provided'}
                                                                </p>
                                                            </div>
                                                            {!isCorrect && correctAnswer && (
                                                                <div className='rounded-xl border border-success/40 bg-success/5 p-4'>
                                                                    <p className='text-muted-foreground text-xs'>Correct answer</p>
                                                                    <p className='mt-1 text-sm'>{correctAnswer}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            /* MCQ options */
                                            <div className='space-y-2'>
                                                {(question.options ?? [])
                                                    .slice()
                                                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                                                    .map(option => {
                                                        const optionUuid = option.uuid!;
                                                        const isSelected = selectedOptionValues.includes(optionUuid);
                                                        const isCorrect = option.is_correct;

                                                        return (
                                                            <button
                                                                key={optionUuid}
                                                                type='button'
                                                                disabled={mode === 'review'}
                                                                onClick={() => {
                                                                    if (mode === 'review') return;
                                                                    toggleOption(questionUuid, optionUuid, multipleAnswersAllowed);
                                                                }}
                                                                className={cx(
                                                                    'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition',
                                                                    mode === 'attempt' && isSelected && 'border-primary/40 bg-primary/5',
                                                                    mode === 'review' && isCorrect && 'border-success/40 bg-success/5',
                                                                    mode === 'review' && isSelected && !isCorrect &&
                                                                    'border-destructive/40 bg-destructive/5'
                                                                )}
                                                            >
                                                                {mode === 'review' ? (
                                                                    isCorrect ? (
                                                                        <CheckCircle2 className='text-success mt-0.5 h-4 w-4 shrink-0' />
                                                                    ) : isSelected ? (
                                                                        <XCircle className='text-destructive mt-0.5 h-4 w-4 shrink-0' />
                                                                    ) : (
                                                                        <Circle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                                                                    )
                                                                ) : (
                                                                    <Circle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                                                                )}

                                                                <span className='text-sm'>{option.option_text}</span>

                                                                {mode === 'review' && isCorrect && (
                                                                    <Badge className='ml-auto shrink-0 border border-success/30 bg-success/15 text-success'>
                                                                        Correct
                                                                    </Badge>
                                                                )}
                                                                {mode === 'review' && isSelected && !isCorrect && (
                                                                    <Badge variant='destructive' className='ml-auto shrink-0'>
                                                                        Your answer
                                                                    </Badge>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                </div>
            )}

            {/* ── Footer actions (same as Sheet footer) ────────────────────────── */}
            {quizQuestions.length > 0 && (
                <div className='border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
                    {mode === 'attempt' ? (
                        <>
                            <Button
                                type='button'
                                variant='outline'
                                className='gap-2'
                                onClick={() => setAnswerDrafts({})}
                            >
                                <RotateCcw className='h-4 w-4' />
                                Clear answers
                            </Button>
                            <Button type='button' className='gap-2' onClick={handleFinishAttempt}>
                                <Send className='h-4 w-4' />
                                Finish attempt
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type='button' variant='outline' className='gap-2' onClick={handleRetake}>
                                <RotateCcw className='h-4 w-4' />
                                Retake quiz
                            </Button>
                            <Button
                                type='button'
                                className='gap-2'
                                onClick={() => router.push('/dashboard/assignment')}
                            >
                                Done
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}