'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuizDetails } from '@/hooks/use-quiz-details'; // adjust path as needed
import {
    AlertCircle,
    Award,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Clock,
    Hash,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

const QUESTION_TYPE_STYLES: Record<string, string> = {
    MULTIPLE_CHOICE: "bg-primary/10 text-primary",
    TRUE_FALSE: "bg-secondary/20 text-secondary-foreground",
    SHORT_ANSWER: "bg-accent/20 text-accent-foreground",
    ESSAY: "bg-muted text-muted-foreground",
};

function QuestionCard({ question, index }: { question: any; index: number }) {
    const typeStyle = QUESTION_TYPE_STYLES[question.question_type] ?? 'bg-muted text-muted-foreground';

    return (
        <div className='rounded-lg border border-border/60 bg-background'>
            {/* Question header */}
            <div className='flex items-start gap-3 p-4'>
                {/* Number bubble */}
                <div className='bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                    {index + 1}
                </div>

                <div className='flex-1 min-w-0'>
                    <div className='mb-2 flex flex-wrap items-center gap-2'>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeStyle}`}>
                            {question.question_type?.replace('_', ' ')}
                        </span>
                        <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Award className='h-3 w-3' />
                            {question.points_display ?? `${question.points} pts`}
                        </span>
                    </div>

                    <p className='text-foreground text-sm font-medium leading-relaxed'>
                        {question.question_text}
                    </p>
                </div>
            </div>

            {/* Options (only for questions that have them) */}
            {question.requires_options && question.options.length > 0 && (
                <div className='border-t border-border/40 px-4 pb-4 pt-3'>
                    <p className='text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide'>
                        Answer Options
                    </p>
                    <div className='space-y-2'>
                        {question.options
                            .sort((a: any, b: any) => a.display_order - b.display_order)
                            .map((option: any) => (
                                <div
                                    key={option.uuid}
                                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${option.is_correct
                                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                                        : 'border-border/40 bg-muted/20'
                                        }`}
                                >
                                    {/* Correct / incorrect indicator */}
                                    <div className='mt-0.5 shrink-0'>
                                        {option.is_correct ? (
                                            <CheckCircle className='h-4 w-4 text-green-600' />
                                        ) : (
                                            <XCircle className='h-4 w-4 text-muted-foreground/50' />
                                        )}
                                    </div>

                                    <span className={`flex-1 leading-snug ${option.is_correct ? 'text-green-800 font-medium dark:text-green-300' : 'text-foreground'}`}>
                                        {option.option_text}
                                    </span>

                                    <span className='shrink-0 text-xs text-muted-foreground'>
                                        {option.position_display}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Short answer / essay placeholder */}
            {!question.requires_options && (
                <div className='border-t border-border/40 px-4 pb-4 pt-3'>
                    <p className='text-muted-foreground text-sm italic'>
                        {question.question_type === 'ESSAY'
                            ? 'Students write a long-form essay response.'
                            : 'Students type a short written answer.'}
                    </p>
                </div>
            )}
        </div>
    );
}

export function QuizDetailPanel({
    quizUuid,
    scheduleItem,
}: {
    quizUuid: string;
    scheduleItem: any;
}) {
    const { questions, isLoading, isError } = useQuizDetails(quizUuid, true);

    if (isLoading) {
        return (
            <div className='space-y-3'>
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className='h-28 w-full rounded-lg' />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className='flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
                <AlertCircle className='h-4 w-4 shrink-0' />
                Failed to load quiz questions. Please try again.
            </div>
        );
    }

    const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points ?? 0), 0);
    const questionCount = questions.length;

    return (
        <div className='space-y-5'>
            <div>
                <div className='mb-3 flex items-center justify-between'>
                    <h4 className='text-foreground flex items-center gap-2 text-sm font-semibold'>
                        <Hash className='h-4 w-4' />
                        Questions
                        <Badge variant='secondary' className='text-xs'>
                            {questionCount} question{questionCount !== 1 ? 's' : ''}
                        </Badge>
                    </h4>
                    {totalPoints > 0 && (
                        <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Award className='h-3.5 w-3.5' />
                            {totalPoints} total points
                        </span>
                    )}
                </div>

                {questionCount === 0 ? (
                    <div className='rounded-lg border border-dashed border-border/50 p-8 text-center'>
                        <ClipboardList className='text-muted-foreground mx-auto mb-2 h-8 w-8 opacity-40' />
                        <p className='text-muted-foreground text-sm'>No questions added to this quiz yet.</p>
                    </div>
                ) : (
                    <div className='space-y-3'>
                        {questions
                            .sort((a: any, b: any) => a.display_order - b.display_order)
                            .map((question: any, index: number) => (
                                <QuestionCard key={question.uuid} question={question} index={index} />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}


export function QuizzesSheet({
    open,
    onOpenChange,
    mergedQuizzes,
    deleteQuizScheduleMut,
    onRemoveQuiz,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    mergedQuizzes: any[];
    deleteQuizScheduleMut: any;
    onRemoveQuiz: (scheduleUuid: string) => void;
}) {
    const [expandedQuizUuid, setExpandedQuizUuid] = useState<string | null>(null);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className='w-full p-0 sm:max-w-full lg:max-w-[80vw]'>
                <div className='flex h-full flex-col'>
                    {/* Header */}
                    <div className='border-b px-6 py-5'>
                        <SheetHeader>
                            <SheetTitle className='flex items-center gap-2 text-xl'>
                                <ClipboardList className='text-primary h-5 w-5' />
                                Class Quizzes
                            </SheetTitle>
                            <SheetDescription>
                                All quizzes scheduled for this class — view questions, settings, and remove as needed.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body */}
                    <div className='flex-1 overflow-auto px-6 py-5'>
                        {!mergedQuizzes?.length ? (
                            <div className='flex h-full flex-col items-center justify-center py-20 text-center'>
                                <ClipboardList className='text-muted-foreground mb-3 h-12 w-12 opacity-40' />
                                <h3 className='text-foreground mb-1 text-lg font-semibold'>No quizzes yet</h3>
                                <p className='text-muted-foreground text-sm'>Add quizzes from a session's action menu.</p>
                            </div>
                        ) : (
                            <div className='space-y-4'>
                                {mergedQuizzes.map((item: any) => {
                                    const { quiz, due_at, uuid: scheduleUuid } = item;
                                    const isExpanded = expandedQuizUuid === scheduleUuid;

                                    return (
                                        <Card key={scheduleUuid} className='border-border/50 overflow-hidden'>
                                            <CardContent className='p-5'>
                                                {/* ── Summary row ── */}
                                                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                                                    {/* Left: metadata */}
                                                    <div className='flex-1'>
                                                        <div className='mb-1 flex flex-wrap items-center gap-2'>
                                                            <h3 className='text-foreground text-base font-semibold'>{quiz.title}</h3>
                                                            {quiz.status && (
                                                                <Badge
                                                                    variant={quiz.status === 'published' ? 'default' : 'secondary'}
                                                                    className='text-xs capitalize'
                                                                >
                                                                    {quiz.status}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {quiz.description && (
                                                            <p className='text-muted-foreground mb-3 line-clamp-2 text-sm'>
                                                                {quiz.description}
                                                            </p>
                                                        )}

                                                        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
                                                            {due_at && (
                                                                <div className='flex items-center gap-1.5'>
                                                                    <Calendar className='text-muted-foreground h-4 w-4' />
                                                                    <span className='text-muted-foreground'>
                                                                        Due: {new Date(due_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {(item.time_limit_override ?? quiz.time_limit_minutes) && (
                                                                <div className='flex items-center gap-1.5'>
                                                                    <Clock className='text-muted-foreground h-4 w-4' />
                                                                    <span className='text-muted-foreground'>
                                                                        {item.time_limit_override ?? quiz.time_limit_minutes} min
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {(item.attempt_limit_override ?? quiz.attempts_allowed) && (
                                                                <div className='flex items-center gap-1.5'>
                                                                    <ClipboardList className='text-muted-foreground h-4 w-4' />
                                                                    <span className='text-muted-foreground'>
                                                                        {item.attempt_limit_override ?? quiz.attempts_allowed} attempt
                                                                        {(item.attempt_limit_override ?? quiz.attempts_allowed) !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {(item.passing_score_override ?? quiz.passing_score) && (
                                                                <div className='flex items-center gap-1.5'>
                                                                    <Award className='text-muted-foreground h-4 w-4' />
                                                                    <span className='text-muted-foreground'>
                                                                        Pass: {item.passing_score_override ?? quiz.passing_score}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right: actions */}
                                                    <div className='flex shrink-0 items-center gap-2 sm:ml-4'>
                                                        <Button
                                                            variant='ghost'
                                                            size='sm'
                                                            className='text-muted-foreground gap-1'
                                                            onClick={() =>
                                                                setExpandedQuizUuid(prev =>
                                                                    prev === scheduleUuid ? null : scheduleUuid
                                                                )
                                                            }
                                                        >
                                                            {isExpanded ? (
                                                                <><ChevronUp className='h-4 w-4' />Hide Details</>
                                                            ) : (
                                                                <><ChevronDown className='h-4 w-4' />View Details</>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='sm'
                                                            className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                                                            disabled={deleteQuizScheduleMut.isPending}
                                                            onClick={() => onRemoveQuiz(scheduleUuid)}
                                                        >
                                                            <Trash2 className='h-4 w-4' />
                                                            <span className='ml-1.5 hidden sm:inline'>Remove</span>
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* ── Collapsible detail panel with questions ── */}
                                                {isExpanded && (
                                                    <div className='mt-5 border-t border-border/50 pt-5'>
                                                        <QuizDetailPanel
                                                            quizUuid={quiz.uuid}
                                                            scheduleItem={item}
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className='border-t px-6 py-4'>
                        <div className='flex items-center justify-between'>
                            <span className='text-muted-foreground text-sm'>
                                {mergedQuizzes?.length ?? 0} quiz{mergedQuizzes?.length !== 1 ? 'zes' : ''} scheduled
                            </span>
                            <Button onClick={() => onOpenChange(false)}>Done</Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}