'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
    getEnrollmentsForClassOptions,
    getQuizAttemptsOptions,
    getQuizByUuidOptions,
    getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassQuizSchedule, Enrollment, Quiz, QuizAttempt } from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import {
    ArrowRight,
    CalendarDays,
    ClipboardList,
    FileQuestion,
    SearchX,
    Target,
    Trophy
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Student } from '../../../../services/api/schema';

type ClassMeta = {
    classUuid: string;
    classTitle: string;
    courseTitle: string;
    courseUuid: string;
    enrollmentUuid?: string;
};

type StudentClassDefinitionRow = ReturnType<
    typeof useStudentClassDefinitions
>['classDefinitions'][number];

type ResolvedClassDetails = {
    class_definition?: { title?: string; uuid?: string };
    course_name?: string;
    name?: string;
    title?: string;
    uuid?: string;
};

type SortKey = 'due' | 'course' | 'title';

type QuizViewRow = {
    classMeta: ClassMeta;
    quiz?: Quiz;
    schedule: ClassQuizSchedule;
    attempts: QuizAttempt[];
};

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
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatEnum(value?: string | null) {
    if (!value) return 'Not set';
    return value
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatTimeLimit(schedule: ClassQuizSchedule, quiz?: Quiz) {
    return (
        schedule.time_limit_override ??
        quiz?.time_limit_display ??
        (quiz?.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'Untimed')
    );
}

function getQuizStatus(attempt?: QuizAttempt | null) {
    if (!attempt) {
        return {
            label: 'Not started',
            variant: 'secondary' as const,
            accent: 'bg-primary',
            chip: 'bg-primary/10 text-primary',
            filter: 'not-started' as const,
        };
    }

    const status = String(attempt.status || '').toLowerCase();
    if (attempt.is_completed || status.includes('graded') || status.includes('submitted')) {
        return {
            label: formatEnum(attempt.status) || 'Completed',
            variant: 'success' as const,
            accent: 'bg-success',
            chip: 'bg-success/10 text-success',
            filter: 'completed' as const,
        };
    }
    if (status.includes('progress') || status.includes('started')) {
        return {
            label: 'In progress',
            variant: 'warning' as const,
            accent: 'bg-warning',
            chip: 'bg-warning/10 text-warning',
            filter: 'in-progress' as const,
        };
    }
    return {
        label: formatEnum(attempt.status),
        variant: 'secondary' as const,
        accent: 'bg-primary',
        chip: 'bg-primary/10 text-primary',
        filter: 'not-started' as const,
    };
}

function StatTile({
    icon: Icon,
    label,
    value,
    helper,
    tone = 'primary',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    helper: string;
    tone?: 'primary' | 'success' | 'warning';
}) {
    const chip =
        tone === 'success'
            ? 'bg-success/10 text-success'
            : tone === 'warning'
                ? 'bg-warning/10 text-warning'
                : 'bg-primary/10 text-primary';

    return (
        <div className='border-border/70 bg-card hover:border-primary/30 rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md'>
            <div className='flex items-center gap-4'>
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', chip)}>
                    <Icon className='h-5 w-5' />
                </div>
                <div className='min-w-0'>
                    <p className='text-muted-foreground text-sm'>{label}</p>
                    <p className='text-foreground text-2xl font-bold tracking-tight'>{value}</p>
                    <p className='text-muted-foreground truncate text-xs'>{helper}</p>
                </div>
            </div>
        </div>
    );
}

function QuizDetailSheet({
    payload,
    onClose,
}: {
    payload: QuizViewRow | null;
    onClose: () => void;
}) {
    const quizUuid = payload?.schedule.quiz_uuid as string | undefined;
    const latestAttempt = payload?.attempts[0] ?? null;
    const status = getQuizStatus(latestAttempt);
    const schedule = payload?.schedule;
    const quiz = payload?.quiz;

    return (
        <Sheet open={Boolean(payload)} onOpenChange={open => !open && onClose()}>
            <SheetContent className='overflow-y-auto sm:max-w-xl'>
                <SheetHeader>
                    <SheetTitle>{quiz?.title || 'Untitled quiz'}</SheetTitle>
                    <SheetDescription>
                        {schedule?.due_at ? `Due ${formatDate(schedule.due_at)} · ` : ''}
                        {schedule ? formatTimeLimit(schedule, quiz) : 'Untimed'}
                    </SheetDescription>
                </SheetHeader>

                <div className='space-y-4 px-4 pb-4'>
                    <div className='flex flex-wrap gap-2'>
                        <Badge variant='outline' className='text-[10px]'>
                            {payload?.classMeta.courseTitle}
                        </Badge>
                        {status && <Badge variant={status.variant}>{status.label}</Badge>}
                    </div>

                    {payload?.quiz?.description ? (
                        <div className='rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed'>
                            {payload.quiz.description}
                        </div>
                    ) : (
                        <div className='rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed'>
                            Open this quiz to review the prompt and continue your attempt.
                        </div>
                    )}

                    {latestAttempt ? (
                        <div className='rounded-xl border border-success/20 bg-success/5 p-3'>
                            <p className='text-sm font-medium text-success'>
                                Latest score: {latestAttempt.grade_display || `${latestAttempt.score ?? 0}/${latestAttempt.max_score ?? 0}`}
                            </p>
                            <p className='text-success/80 mt-2 text-xs'>
                                {latestAttempt.is_completed ? 'Completed attempt' : 'Attempt in progress'}
                            </p>
                        </div>
                    ) : (
                        <div className='rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed'>
                            No attempt has been started yet.
                        </div>
                    )}

                    <div className='grid grid-cols-3 gap-2'>
                        <div className='rounded-xl border bg-background/70 p-3'>
                            <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wide'>Due</p>
                            <p className='text-foreground mt-1 text-sm font-semibold'>
                                {formatDate(schedule?.due_at)}
                            </p>
                        </div>
                        <div className='rounded-xl border bg-background/70 p-3'>
                            <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wide'>Time</p>
                            <p className='text-foreground mt-1 text-sm font-semibold'>
                                {schedule ? formatTimeLimit(schedule, quiz) : 'Untimed'}
                            </p>
                        </div>
                        <div className='rounded-xl border bg-background/70 p-3'>
                            <p className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wide'>Attempts</p>
                            <p className='text-foreground mt-1 text-sm font-semibold'>
                                {payload?.attempts.length ?? 0}/{schedule?.attempt_limit_override ?? quiz?.attempts_allowed ?? '∞'}
                            </p>
                        </div>
                    </div>

                    <div className='flex justify-end'>
                        <Button asChild>
                            <Link
                                href={`/dashboard/student/assignment/quiz/${quizUuid}`}
                                className='inline-flex items-center gap-2'
                            >
                                {latestAttempt ? 'Open quiz' : 'Attempt quiz'}
                                <ArrowRight className='h-4 w-4' />
                            </Link>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function QuizCard({
    item,
    onOpen,
}: {
    item: QuizViewRow;
    onOpen: (item: QuizViewRow) => void;
}) {
    const latestAttempt = item.attempts[0] ?? null;
    const status = getQuizStatus(latestAttempt);

    const cell = (
        icon: React.ComponentType<{ className?: string }>,
        label: string,
        value: React.ReactNode
    ) => {
        const Icon = icon;
        return (
            <div className='flex flex-col gap-1 px-3 py-2'>
                <span className='text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase'>
                    <Icon className='h-3 w-3' />
                    {label}
                </span>
                <span className='text-foreground text-sm font-semibold'>{value}</span>
            </div>
        );
    };

    return (
        <Card>
            <CardContent className='flex flex-wrap items-start gap-3 p-4'>
                <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-medium'>{item.quiz?.title || 'Untitled quiz'}</p>
                        <Badge variant='outline' className='text-[10px]'>
                            {item.classMeta.courseTitle}
                        </Badge>
                        <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    <p className='mt-1 text-sm font-bold text-muted-foreground'>{item.classMeta.classTitle}</p>

                    {item.quiz?.description ? (
                        <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>{item.quiz.description}</p>
                    ) : (
                        <p className='mt-1 text-sm text-muted-foreground'>
                            Open this quiz to review the prompt and answer the questions.
                        </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
                        <span>
                            Due on{' '}
                            <span className="font-medium text-foreground">
                                {formatDate(item.schedule?.due_at)}
                            </span>
                        </span>

                        <span>
                            Time allowed:{' '}
                            <span className="font-medium text-foreground">
                                {formatTimeLimit(item.schedule, item.quiz)}
                            </span>
                        </span>

                        <span>
                            Max attempts:{' '}
                            <span className="font-medium text-foreground">
                                {item.schedule?.attempt_limit_override ??
                                    item.quiz?.attempts_allowed ??
                                    '∞'}
                            </span>
                        </span>
                    </div>

                    {latestAttempt ? (
                        <div className='mt-3 flex items-center gap-2 text-sm text-muted-foreground'>
                            <Trophy className='h-4 w-4 text-warning' />
                            <span className='font-medium text-foreground'>
                                {latestAttempt.grade_display || `${latestAttempt.score ?? 0}/${latestAttempt.max_score ?? 0}`}
                            </span>
                            latest score
                        </div>
                    ) : (
                        <p className='mt-3 text-sm text-muted-foreground'>Not attempted yet</p>
                    )}
                </div>

                <Button size='sm' onClick={() => onOpen(item)}>
                    <FileQuestion className='mr-2 h-4 w-4' />
                    {latestAttempt ? 'Review quiz' : 'Attempt quiz'}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function LessonHubQuizzesTab() {
    const student = useStudent();
    const [searchValue, setSearchValue] = useState('');
    const [filter, setFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all');
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortKey>('due');
    const [active, setActive] = useState<QuizViewRow | null>(null);

    const { classDefinitions, loading: classDefinitionsLoading } = useStudentClassDefinitions(
        student as Student
    );

    const classItems = useMemo(
        () =>
            (classDefinitions ?? [])
                .map((classDefinition: StudentClassDefinitionRow) => {
                    const classDetails = classDefinition.classDetails as ResolvedClassDetails | undefined;
                    return {
                        classTitle: getClassTitle(classDetails),
                        classUuid:
                            classDefinition.uuid || classDetails?.uuid || classDetails?.class_definition?.uuid,
                        courseTitle: classDefinition.course?.name || classDetails?.course_name || 'Untitled course',
                        courseUuid: classDefinition.course?.uuid || '',
                    };
                })
                .filter(
                    (
                        classItem
                    ): classItem is {
                        classTitle: string;
                        classUuid: string;
                        courseTitle: string;
                        courseUuid: string;
                    } => Boolean(classItem.classUuid)
                ),
        [classDefinitions]
    );

    const classEnrollmentQueries = useQueries({
        queries: classItems.map(classItem => ({
            ...getEnrollmentsForClassOptions({ path: { uuid: classItem.classUuid } }),
            enabled: !!classItem.classUuid,
            staleTime: STALE_TIMES.reference,
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
            staleTime: STALE_TIMES.reference,
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

    const quizUuids = useMemo(
        () =>
            Array.from(
                new Set(
                    scheduleRows
                        .map(({ schedule }) => schedule.quiz_uuid as string | undefined)
                        .filter((id): id is string => Boolean(id))
                )
            ),
        [scheduleRows]
    );

    const quizDetailQueries = useQueries({
        queries: quizUuids.map(quizUuid => ({
            ...getQuizByUuidOptions({ path: { uuid: quizUuid } }),
            enabled: !!quizUuid,
            staleTime: STALE_TIMES.reference,
            refetchOnWindowFocus: false,
        })),
    });

    const quizAttemptQueries = useQueries({
        queries: quizUuids.map(quizUuid => ({
            ...getQuizAttemptsOptions({ path: { quizUuid }, query: { pageable: {} } }),
            enabled: !!quizUuid,
            staleTime: STALE_TIMES.live,
            refetchOnWindowFocus: false,
        })),
    });

    const quizMap = useMemo(() => {
        const map = new Map<string, Quiz>();
        quizUuids.forEach((quizUuid, index) => {
            const quiz = quizDetailQueries[index]?.data?.data;
            if (quiz) map.set(quizUuid, quiz);
        });
        return map;
    }, [quizDetailQueries, quizUuids]);

    const attemptMap = useMemo(() => {
        const map = new Map<string, QuizAttempt[]>();
        quizUuids.forEach((quizUuid, index) => {
            const attempts = quizAttemptQueries[index]?.data?.data?.content ?? [];
            map.set(quizUuid, attempts);
        });
        return map;
    }, [quizAttemptQueries, quizUuids]);

    const quizRows = useMemo<QuizViewRow[]>(
        () =>
            scheduleRows.map(({ classMeta, schedule }) => {
                const quizUuid = schedule.quiz_uuid as string | undefined;
                const quiz = quizUuid ? quizMap.get(quizUuid) : undefined;
                const attempts =
                    quizUuid && classMeta.enrollmentUuid
                        ? (attemptMap.get(quizUuid) ?? []).filter(
                            attempt => attempt.enrollment_uuid === classMeta.enrollmentUuid
                        )
                        : quizUuid
                            ? (attemptMap.get(quizUuid) ?? [])
                            : [];

                return { classMeta, attempts, quiz, schedule };
            }),
        [attemptMap, quizMap, scheduleRows]
    );

    const isLoading =
        classDefinitionsLoading ||
        classEnrollmentQueries.some(query => query.isLoading) ||
        quizScheduleQueries.some(query => query.isLoading) ||
        quizDetailQueries.some(query => query.isLoading) ||
        quizAttemptQueries.some(query => query.isLoading);

    const filteredRows = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        return quizRows
            .filter(row => {
                const latestAttempt = row.attempts[0] ?? null;
                const status = getQuizStatus(latestAttempt);
                return filter === 'all' || status.filter === filter;
            })
            .filter(row => courseFilter === 'all' || row.classMeta.courseTitle === courseFilter)
            .filter(row => {
                if (!query) return true;
                return [row.quiz?.title, row.quiz?.description, row.classMeta.classTitle, row.classMeta.courseTitle]
                    .filter(Boolean)
                    .some(value => String(value).toLowerCase().includes(query));
            })
            .sort((a, b) => {
                if (sortBy === 'course') {
                    return a.classMeta.courseTitle.localeCompare(b.classMeta.courseTitle);
                }
                if (sortBy === 'title') {
                    return (a.quiz?.title || '').localeCompare(b.quiz?.title || '');
                }
                const at = a.schedule?.due_at;
                const bt = b.schedule?.due_at;
                const aTime = at ? new Date(at).getTime() : Number.POSITIVE_INFINITY;
                const bTime = bt ? new Date(bt).getTime() : Number.POSITIVE_INFINITY;
                return aTime - bTime;
            });
    }, [courseFilter, filter, quizRows, searchValue, sortBy]);

    const stats = useMemo(() => {
        const total = quizRows.length;
        const attempted = quizRows.filter(row => row.attempts.length > 0).length;
        const completed = quizRows.filter(row =>
            row.attempts.some(attempt => Boolean(attempt.is_completed))
        ).length;
        const scheduled = quizRows.filter(row => row.schedule?.visible_at || row.schedule?.due_at).length;
        const percentages = quizRows
            .map(row => row.attempts[0]?.percentage)
            .filter((value): value is number => typeof value === 'number');
        const averageScore = percentages.length
            ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
            : 0;

        return { total, attempted, completed, scheduled, averageScore };
    }, [quizRows]);

    const courseOptions = useMemo(
        () =>
            Array.from(
                new Map(
                    quizRows
                        .filter(row => Boolean(row.classMeta.courseUuid))
                        .map(row => [row.classMeta.courseUuid, row.classMeta.courseTitle])
                ).entries()
            )
                .map(([id, title]) => ({ id, title }))
                .sort((a, b) => a.title.localeCompare(b.title)),
        [quizRows]
    );

    if (isLoading) {
        return (
            <div className='space-y-6'>
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className='h-28 rounded-2xl' />
                    ))}
                </div>
                <Skeleton className='h-28 rounded-2xl' />
                <div className='grid gap-4 xl:grid-cols-2'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className='h-56 rounded-2xl' />
                    ))}
                </div>
            </div>
        );
    }

    const statTiles = [
        { icon: ClipboardList, label: 'Total quizzes', value: stats.total, helper: 'Across your classes', tone: 'primary' as const },
        { icon: Target, label: 'Attempted', value: stats.attempted, helper: 'Started at least once', tone: 'primary' as const },
        { icon: Trophy, label: 'Completed', value: stats.completed, helper: 'Finished attempts', tone: 'success' as const },
        { icon: CalendarDays, label: 'Scheduled', value: stats.scheduled, helper: 'Visible to you', tone: 'warning' as const },
    ];

    const filterTabs: Array<{ value: 'all' | 'not-started' | 'in-progress' | 'completed'; label: string; count: number }> = [
        { value: 'all', label: 'All', count: stats.total },
        { value: 'not-started', label: 'Not started', count: quizRows.filter(row => getQuizStatus(row.attempts[0] ?? null).filter === 'not-started').length },
        { value: 'in-progress', label: 'In progress', count: quizRows.filter(row => getQuizStatus(row.attempts[0] ?? null).filter === 'in-progress').length },
        { value: 'completed', label: 'Completed', count: quizRows.filter(row => getQuizStatus(row.attempts[0] ?? null).filter === 'completed').length },
    ];

    return (
        <div className='space-y-6'>
            <div className='flex flex-wrap gap-2'>
                {filterTabs.map(tab => {
                    const activeTab = filter === tab.value;
                    return (
                        <Button
                            key={tab.value}
                            size='sm'
                            variant={activeTab ? 'default' : 'outline'}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label} <span className='ml-1 opacity-70'>({tab.count})</span>
                        </Button>
                    );
                })}

                <div className='ml-auto flex flex-wrap items-center gap-2'>
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className='h-9 w-[180px] text-xs'>
                            <SelectValue placeholder='Course' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>All courses</SelectItem>
                            {courseOptions.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={value => setSortBy(value as SortKey)}>
                        <SelectTrigger className='h-9 w-[170px] text-xs'>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='due'>Due date</SelectItem>
                            <SelectItem value='course'>Course</SelectItem>
                            <SelectItem value='title'>Title</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredRows.length === 0 ? (
                <EmptyState
                    variant='plain'
                    icon={SearchX}
                    title='No quizzes match this filter'
                    description='Adjust the active tab, course filter, or search term to find the right quiz.'
                />
            ) : (
                <div className='flex flex-col gap-4'>
                    {filteredRows.map(item => (
                        <QuizCard
                            key={item.schedule.uuid}
                            item={item}
                            onOpen={setActive}
                        />
                    ))}
                </div>
            )}

            <QuizDetailSheet payload={active} onClose={() => setActive(null)} />
        </div>
    );
}
