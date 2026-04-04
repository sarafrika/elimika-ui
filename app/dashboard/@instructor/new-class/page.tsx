'use client';

import { BrandPill } from '@/components/ui/brand-pill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import {
    BarChart3,
    BookOpen,
    ChevronDown,
    ChevronUp,
    CircleDot,
    FileText,
    GraduationCap,
    LayoutGrid,
    NotebookPen,
    Play,
    Search,
    Users,
    Video
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import HTMLTextPreview from '../../../../components/editors/html-text-preview';

type ClassTab = 'overview' | 'students' | 'announcements' | 'tasks';

type LessonContentItem = {
    uuid: string;
    title: string;
    type: string;
    content_type_uuid: string;
    duration?: string;
    description?: string;
};

type LessonModule = {
    lesson: {
        uuid?: string;
        title?: string;
        description?: string;
    };
    content?: {
        data?: LessonContentItem[];
    };
};

type InstructorClassCard = {
    uuid: string;
    title: string;
    courseName: string;
    sessionFormat?: string;
    difficulty: string;
    scheduleCount: number;
    remainingSessions: number;
};

const tabs: { value: ClassTab; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'students', label: 'Students' },
    { value: 'announcements', label: 'Announcements' },
    { value: 'tasks', label: 'Tasks' },
];

const CLASSES_PER_PAGE = 10;

const formatLabel = (value?: string | null) => {
    if (!value) return 'Not available';
    return value
        .toLowerCase()
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const clampPercentage = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 0;
    return Math.min(100, Math.max(0, Number(value)));
};

const getContentTypeLabel = (contentTypeMap: Record<string, string>, uuid?: string) => {
    const typeName = uuid ? contentTypeMap[uuid] : '';
    return typeName ? formatLabel(typeName) : 'Content';
};

const getContentTypeIcon = (contentTypeMap: Record<string, string>, uuid?: string) => {
    const typeName = uuid ? contentTypeMap[uuid] : '';

    switch (typeName) {
        case 'video':
            return <Video className='text-primary h-4 w-4' />;
        case 'pdf':
        case 'text':
            return <BookOpen className='text-primary h-4 w-4' />;
        case 'quiz':
        case 'assignment':
            return <FileText className='text-primary h-4 w-4' />;
        default:
            return <BookOpen className='text-primary h-4 w-4' />;
    }
};

function PlaceholderTab({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <Card className='border-border/70 bg-card shadow-sm'>
            <CardContent className='flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center'>
                <div className='bg-primary/10 text-primary rounded-full p-4'>
                    <LayoutGrid className='h-6 w-6' />
                </div>
                <div className='space-y-2'>
                    <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
                    <p className='text-muted-foreground max-w-xl text-sm'>{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function MetricTile({
    icon,
    label,
    value,
    hint,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <div className='rounded-[24px] border border-border/70 bg-background/80 p-4'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em]'>
                {icon}
                <span>{label}</span>
            </div>
            <p className='text-foreground mt-3 text-lg font-semibold leading-tight'>{value}</p>
            <p className='text-muted-foreground mt-1 text-sm'>{hint}</p>
        </div>
    );
}

function ClassRoster({
    isLoading,
    classes,
    searchTerm,
    draftSearchTerm,
    currentPage,
    totalPages,
    selectedClassUuid,
    onDraftSearchChange,
    onSearch,
    onPageChange,
    onSelectClass,
}: {
    isLoading: boolean;
    classes: InstructorClassCard[];
    searchTerm: string;
    draftSearchTerm: string;
    currentPage: number;
    totalPages: number;
    selectedClassUuid: string | null;
    onDraftSearchChange: (value: string) => void;
    onSearch: (value?: string) => void;
    onPageChange: (page: number) => void;
    onSelectClass: (uuid: string) => void;
}) {
    const hasSearchTerm = searchTerm.trim().length > 0;

    return (
        <Card className='border-border/70 bg-card shadow-sm'>
            <CardHeader className='space-y-4 pb-4'>
                <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-2'>
                        <BrandPill
                            icon={<NotebookPen className='h-3.5 w-3.5' />}
                            className='px-3 py-1 text-[10px]'
                        >
                            Classes
                        </BrandPill>
                        <div>
                            <CardTitle className='text-lg'>Instructor classes</CardTitle>
                            <p className='text-muted-foreground mt-1 text-sm'>
                                Select a class to load its overview and teaching content.
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    className='flex flex-col gap-2 sm:flex-row'
                    onSubmit={event => {
                        event.preventDefault();
                        onSearch();
                    }}
                >
                    <div className='relative flex-1'>
                        <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                        <Input
                            value={draftSearchTerm}
                            onChange={event => {
                                const nextValue = event.target.value;
                                onDraftSearchChange(nextValue);
                                onSearch(nextValue);
                            }}
                            placeholder='Search by class, course, format, or difficulty'
                            className='bg-background h-10 rounded-full border-border/70 pr-4 pl-9 text-sm'
                            aria-label='Search instructor classes'
                        />
                    </div>
                    <Button type='submit' className='rounded-full px-5'>
                        Search
                    </Button>
                </form>
            </CardHeader>
            <CardContent className='space-y-2.5'>
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className='h-[72px] rounded-[20px]' />
                    ))
                ) : classes.length === 0 ? (
                    <div className='border-border/70 rounded-[24px] border border-dashed p-6 text-center'>
                        <p className='text-foreground font-medium'>
                            {hasSearchTerm ? 'No classes match this search' : 'No active classes yet'}
                        </p>
                        <p className='text-muted-foreground mt-1 text-sm'>
                            {hasSearchTerm
                                ? 'Try a different keyword to find a class in your current teaching list.'
                                : 'Your instructor classes will appear here once they are scheduled.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {classes.map(classItem => {
                            const isActive = classItem.uuid === selectedClassUuid;

                            return (
                                <button
                                    key={classItem.uuid}
                                    type='button'
                                    onClick={() => onSelectClass(classItem.uuid)}
                                    className={`w-full rounded-[20px] border px-3 py-3 text-left transition-colors ${isActive
                                        ? 'border-primary bg-primary/10 shadow-sm'
                                        : 'border-border/70 bg-background/80 hover:bg-primary/10'
                                        }`}
                                >
                                    <div className='flex items-start justify-between gap-3'>
                                        <div className='min-w-0 space-y-1.5'>
                                            <p className='text-foreground truncate text-sm font-semibold'>
                                                {classItem.title}
                                            </p>
                                            <p className='text-muted-foreground truncate text-[11px]'>
                                                {classItem.courseName}
                                            </p>
                                            <div className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]'>
                                                <span>{classItem.sessionFormat || 'Lecture'}</span>
                                                <span aria-hidden='true'>•</span>
                                                <span>{classItem.difficulty}</span>
                                            </div>
                                        </div>
                                        <BrandPill className='shrink-0 px-2.5 py-1 text-[10px] normal-case tracking-normal'>
                                            {classItem.scheduleCount} sessions
                                        </BrandPill>
                                    </div>

                                    <div className='text-muted-foreground mt-2 flex items-center justify-between gap-3 text-[11px]'>
                                        <span>
                                            Scheduled <span className='text-foreground font-medium'>{classItem.scheduleCount}</span>
                                        </span>
                                        <span>
                                            Remaining <span className='text-foreground font-medium'>{classItem.remainingSessions}</span>
                                        </span>
                                    </div>
                                </button>
                            );
                        })}

                        {totalPages > 1 ? (
                            <Pagination className='justify-between pt-2'>
                                <PaginationContent className='w-full justify-between'>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href='#'
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                            onClick={event => {
                                                event.preventDefault();
                                                if (currentPage > 1) {
                                                    onPageChange(currentPage - 1);
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink
                                            href='#'
                                            isActive
                                            onClick={event => event.preventDefault()}
                                            className='min-w-[96px]'
                                        >
                                            {currentPage} / {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            href='#'
                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                            onClick={event => {
                                                event.preventDefault();
                                                if (currentPage < totalPages) {
                                                    onPageChange(currentPage + 1);
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        ) : null}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function NewClassPage() {
    const instructor = useInstructor();
    const { replaceBreadcrumbs } = useBreadcrumb();
    const { difficultyMap } = useDifficultyLevels();
    const [selectedClassUuid, setSelectedClassUuid] = useState<string | null>(null);
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [selectedLessonUuid, setSelectedLessonUuid] = useState<string | null>(null);
    const [draftSearchTerm, setDraftSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'new-class',
                title: 'New Class',
                url: '/dashboard/new-class',
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs]);

    const {
        classes,
        isLoading: isLoadingClasses,
        isError: hasClassesError,
    } = useInstructorClassesWithSchedules(instructor?.uuid);

    const selectedClass = useMemo(
        () => classes.find(item => item.uuid === selectedClassUuid) ?? null,
        [classes, selectedClassUuid]
    );

    const {
        isLoading: isLoadingLessons,
        isError: hasLessonsError,
        lessons,
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: selectedClass?.course_uuid });

    const lessonModules = useMemo<LessonModule[]>(() => lessons ?? [], [lessons]);

    useEffect(() => {
        if (!lessonModules.length) {
            setExpandedModuleId(null);
            setSelectedLessonUuid(null);
            return;
        }

        const firstModule = lessonModules[0];
        const firstLesson = firstModule?.content?.data?.[0];

        setExpandedModuleId(previous =>
            previous && lessonModules.some(module => module.lesson.uuid === previous)
                ? previous
                : (firstModule?.lesson?.uuid ?? null)
        );

        setSelectedLessonUuid(previous => {
            if (
                previous &&
                lessonModules.some(module =>
                    module.content?.data?.some(content => content.uuid === previous)
                )
            ) {
                return previous;
            }

            return firstLesson?.uuid ?? null;
        });
    }, [lessonModules]);

    const selectedModule = useMemo(
        () =>
            lessonModules.find(module =>
                module.content?.data?.some(content => content.uuid === selectedLessonUuid)
            ) ?? lessonModules[0] ?? null,
        [lessonModules, selectedLessonUuid]
    );

    const selectedLesson = useMemo(
        () =>
            selectedModule?.content?.data?.find(content => content.uuid === selectedLessonUuid) ??
            selectedModule?.content?.data?.[0] ??
            null,
        [selectedLessonUuid, selectedModule]
    );

    const selectedModuleResources = selectedModule?.content?.data ?? [];

    const now = new Date();

    const totalSessions = selectedClass?.schedule?.length ?? 0;
    const completedSessions =
        selectedClass?.schedule?.filter((session: { start_time?: string }) =>
            session.start_time ? new Date(session.start_time) < now : false
        ).length ?? 0;
    const remainingSessions = Math.max(totalSessions - completedSessions, 0);
    const sessionProgress = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;

    const classCards = useMemo<InstructorClassCard[]>(
        () =>
            classes.map(classItem => {
                const scheduleCount = classItem.schedule?.length ?? 0;
                const classRemainingSessions =
                    classItem.schedule?.filter((session: { start_time?: string }) =>
                        session.start_time ? new Date(session.start_time) >= now : false
                    ).length ?? 0;

                return {
                    uuid: classItem.uuid,
                    title: classItem.title,
                    courseName: classItem.course?.name || 'No linked course',
                    sessionFormat: formatLabel(classItem.session_format),
                    difficulty: classItem.course?.difficulty_uuid
                        ? difficultyMap[classItem.course.difficulty_uuid]
                        : 'General',
                    scheduleCount,
                    remainingSessions: classRemainingSessions,
                };
            }),
        [classes, difficultyMap, now]
    );

    const filteredClassCards = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            return classCards;
        }

        return classCards.filter(classItem =>
            [
                classItem.title,
                classItem.courseName,
                classItem.sessionFormat,
                classItem.difficulty,
            ]
                .filter(Boolean)
                .some(value => value?.toLowerCase().includes(normalizedSearch))
        );
    }, [classCards, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredClassCards.length / CLASSES_PER_PAGE));

    useEffect(() => {
        setCurrentPage(previous => Math.min(previous, totalPages));
    }, [totalPages]);

    const paginatedClassCards = useMemo(() => {
        const startIndex = (currentPage - 1) * CLASSES_PER_PAGE;
        return filteredClassCards.slice(startIndex, startIndex + CLASSES_PER_PAGE);
    }, [currentPage, filteredClassCards]);

    useEffect(() => {
        if (!filteredClassCards.length) {
            setSelectedClassUuid(null);
            return;
        }

        setSelectedClassUuid(previous =>
            previous && filteredClassCards.some(item => item.uuid === previous)
                ? previous
                : filteredClassCards[0]?.uuid ?? null
        );
    }, [filteredClassCards]);

    useEffect(() => {
        if (!paginatedClassCards.length) {
            return;
        }

        setSelectedClassUuid(previous =>
            previous && paginatedClassCards.some(item => item.uuid === previous)
                ? previous
                : paginatedClassCards[0]?.uuid ?? null
        );
    }, [paginatedClassCards]);

    const hasError = hasClassesError || hasLessonsError;
    const isSearchEmpty =
        !isLoadingClasses && searchTerm.trim().length > 0 && filteredClassCards.length === 0;
    const shouldShowWorkspace = isLoadingClasses || classCards.length > 0 || isSearchEmpty;

    return (
        <div className='flex min-h-full flex-col gap-6 pb-8'>
            <Card className='border-border/70 bg-card shadow-sm'>
                <CardContent className='space-y-6 p-5 sm:p-6'>
                    <div className='space-y-3'>
                        <BrandPill
                            icon={<NotebookPen className='h-3.5 w-3.5' />}
                            className='px-3 py-1 text-[10px]'
                        >
                            Class Console
                        </BrandPill>
                        <div className='space-y-2'>
                            <h1 className='text-foreground text-2xl font-semibold sm:text-3xl'>
                                New class workspace
                            </h1>
                            <p className='text-muted-foreground max-w-3xl text-sm sm:text-base'>
                                Review your active classes, inspect the course program, and keep the next
                                lesson content visible from one instructor dashboard.
                            </p>
                        </div>
                    </div>

                    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                        <MetricTile
                            icon={<BookOpen className='h-3.5 w-3.5' />}
                            label='Course'
                            value={selectedClass?.course?.name || 'No linked course'}
                            hint='Current course connected to this class'
                        />
                        <MetricTile
                            icon={<Users className='h-3.5 w-3.5' />}
                            label='Learners'
                            value={
                                selectedClass?.max_participants
                                    ? `${selectedClass.max_participants}`
                                    : 'Not set'
                            }
                            hint='Planned learner capacity for this class'
                        />
                        <MetricTile
                            icon={<GraduationCap className='h-3.5 w-3.5' />}
                            label='Delivery'
                            value={formatLabel(selectedClass?.session_format)}
                            hint='Teaching format for the selected class'
                        />
                        <MetricTile
                            icon={<BarChart3 className='h-3.5 w-3.5' />}
                            label='Progress'
                            value={`${completedSessions}/${totalSessions}`}
                            hint='Scheduled sessions already delivered'
                        />
                    </div>
                </CardContent>
            </Card>

            {hasError ? (
                <Card className='border-destructive/40'>
                    <CardContent className='flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center'>
                        <NotebookPen className='text-destructive h-8 w-8' />
                        <div className='space-y-1'>
                            <p className='text-foreground font-semibold'>Unable to load class workspace</p>
                            <p className='text-muted-foreground text-sm'>
                                We hit a problem while loading classes or course lesson content for this
                                screen.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {shouldShowWorkspace ? (
                <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
                    <aside className='space-y-4'>
                        <ClassRoster
                            isLoading={isLoadingClasses}
                            classes={paginatedClassCards}
                            searchTerm={searchTerm}
                            draftSearchTerm={draftSearchTerm}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            selectedClassUuid={selectedClassUuid}
                            onDraftSearchChange={value => setDraftSearchTerm(value)}
                            onSearch={value => {
                                setSearchTerm((value ?? draftSearchTerm).trim());
                                setCurrentPage(1);
                            }}
                            onPageChange={setCurrentPage}
                            onSelectClass={setSelectedClassUuid}
                        />
                    </aside>

                    {isSearchEmpty ? (
                        <Card className='border-border/70 bg-card shadow-sm'>
                            <CardContent className='flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center'>
                                <div className='bg-primary/10 text-primary rounded-full p-4'>
                                    <Search className='h-6 w-6' />
                                </div>
                                <div className='space-y-2'>
                                    <h3 className='text-foreground text-lg font-semibold'>
                                        No classes found for "{searchTerm}"
                                    </h3>
                                    <p className='text-muted-foreground max-w-lg text-sm'>
                                        Try another class name, course title, format, or difficulty to load a
                                        class into this workspace.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Tabs defaultValue='overview' className='space-y-4'>
                            <TabsList className='bg-card h-auto w-full flex-wrap justify-start rounded-[28px] border border-border/70 p-2'>
                                {tabs.map(tab => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className='rounded-[20px] px-4 py-2 text-[11px] uppercase tracking-[0.18em]'
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContent value='overview' className='mt-0'>
                                <Card className='border-border/70 bg-card shadow-sm'>
                                    <CardContent className='space-y-6 p-4 sm:p-6'>
                                        {isLoadingLessons ? (
                                            <div className='space-y-4'>
                                                <Skeleton className='h-44 rounded-[28px]' />
                                                <Skeleton className='h-72 rounded-[28px]' />
                                            </div>
                                        ) : (
                                            <>
                                                <div className='rounded-[28px] border border-border/70 bg-background/80'>
                                                    <div className='border-border/70 flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-start lg:justify-between'>
                                                        <div className='flex min-w-0 gap-4'>
                                                            <div className='bg-muted hidden h-24 w-24 shrink-0 rounded-[24px] border border-border/60 sm:flex sm:items-center sm:justify-center'>
                                                                <BookOpen className='text-muted-foreground h-8 w-8' />
                                                            </div>
                                                            <div className='min-w-0 space-y-4'>
                                                                <div className='space-y-2'>
                                                                    <h2 className='text-foreground text-2xl font-semibold'>
                                                                        {selectedClass?.course?.name ||
                                                                            selectedClass?.title ||
                                                                            'Select a class'}
                                                                    </h2>
                                                                    <HTMLTextPreview
                                                                        className='text-muted-foreground text-sm leading-6'
                                                                        htmlContent={selectedClass?.course?.description ||
                                                                            selectedClass?.description ||
                                                                            'Open the class to review the course details and lesson flow.'} />
                                                                </div>

                                                                <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                                                                    <span className='inline-flex items-center gap-1.5'>
                                                                        <CircleDot className='h-4 w-4' />
                                                                        {totalSessions} sessions
                                                                    </span>
                                                                    <span className='inline-flex items-center gap-1.5'>
                                                                        <GraduationCap className='h-4 w-4' />
                                                                        {selectedClass?.course?.difficulty_uuid
                                                                            ? difficultyMap[selectedClass.course.difficulty_uuid]
                                                                            : 'General'}
                                                                    </span>
                                                                    <span className='inline-flex items-center gap-1.5'>
                                                                        <Users className='h-4 w-4' />
                                                                        {instructor?.full_name || 'Instructor view'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            type='button'
                                                            variant='secondary'
                                                            className='rounded-full border-border/70 bg-background/90'
                                                        >
                                                            Add classes
                                                        </Button>
                                                    </div>

                                                    <div className='space-y-3 p-5'>
                                                        <Progress value={sessionProgress} className='h-2.5 bg-primary/15' />
                                                        <div className='flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between'>
                                                            <p className='text-foreground font-semibold'>
                                                                {sessionProgress}% completed
                                                            </p>
                                                            <p className='text-muted-foreground'>
                                                                {remainingSessions} session
                                                                {remainingSessions === 1 ? '' : 's'} remaining
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]'>
                                                    <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                                                        <div className='mb-4'>
                                                            <h3 className='text-foreground text-lg font-semibold'>
                                                                Course program
                                                            </h3>
                                                            <p className='text-muted-foreground mt-1 text-sm'>
                                                                Lessons and content currently mapped to this class course.
                                                            </p>
                                                        </div>

                                                        <div className='space-y-3'>
                                                            {lessonModules.length === 0 ? (
                                                                <div className='border-border/70 rounded-[24px] border border-dashed p-6 text-center'>
                                                                    <p className='text-foreground font-medium'>
                                                                        No lesson content yet
                                                                    </p>
                                                                    <p className='text-muted-foreground mt-1 text-sm'>
                                                                        Course lessons will appear here once the program is configured.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                lessonModules.map((module, moduleIndex) => {
                                                                    const isOpen = expandedModuleId === module.lesson.uuid;

                                                                    return (
                                                                        <Collapsible
                                                                            key={module.lesson.uuid ?? `module-${moduleIndex}`}
                                                                            open={isOpen}
                                                                            onOpenChange={() =>
                                                                                setExpandedModuleId(
                                                                                    isOpen ? null : (module.lesson.uuid ?? null)
                                                                                )
                                                                            }
                                                                        >
                                                                            <div className='rounded-[24px] border border-border/70 bg-card'>
                                                                                <CollapsibleTrigger asChild>
                                                                                    <button
                                                                                        type='button'
                                                                                        className='flex w-full items-center justify-between gap-3 p-4 text-left'
                                                                                    >
                                                                                        <div className='min-w-0'>
                                                                                            <p className='text-foreground font-semibold'>
                                                                                                Module {moduleIndex + 1}:{' '}
                                                                                                {module.lesson.title || 'Untitled lesson'}
                                                                                            </p>
                                                                                            <p className='text-muted-foreground mt-1 text-sm'>
                                                                                                {module.content?.data?.length ?? 0} content item
                                                                                                {(module.content?.data?.length ?? 0) === 1
                                                                                                    ? ''
                                                                                                    : 's'}
                                                                                            </p>
                                                                                        </div>
                                                                                        {isOpen ? (
                                                                                            <ChevronUp className='text-muted-foreground h-4 w-4 shrink-0' />
                                                                                        ) : (
                                                                                            <ChevronDown className='text-muted-foreground h-4 w-4 shrink-0' />
                                                                                        )}
                                                                                    </button>
                                                                                </CollapsibleTrigger>

                                                                                <CollapsibleContent>
                                                                                    <div className='space-y-2 border-t border-border/70 p-4 pt-3'>
                                                                                        {module.content?.data?.map((content, contentIndex) => {
                                                                                            const isSelected =
                                                                                                selectedLesson?.uuid === content.uuid;

                                                                                            return (
                                                                                                <button
                                                                                                    key={content.uuid}
                                                                                                    type='button'
                                                                                                    onClick={() =>
                                                                                                        setSelectedLessonUuid(content.uuid)
                                                                                                    }
                                                                                                    className={`flex w-full items-center justify-between rounded-[18px] border p-3 text-left transition-colors ${isSelected
                                                                                                        ? 'border-primary bg-primary/10'
                                                                                                        : 'border-border/60 bg-background/70 hover:bg-accent'
                                                                                                        }`}
                                                                                                >
                                                                                                    <div className='flex min-w-0 items-center gap-3'>
                                                                                                        {getContentTypeIcon(contentTypeMap, content.content_type_uuid)}
                                                                                                        <div className='min-w-0'>
                                                                                                            <p className='text-foreground truncate text-sm font-medium'>
                                                                                                                Lesson {moduleIndex + 1}.{contentIndex + 1}{' '}
                                                                                                                {content.title}
                                                                                                            </p>
                                                                                                            <p className='text-muted-foreground mt-1 text-xs'>
                                                                                                                {getContentTypeLabel(
                                                                                                                    contentTypeMap,
                                                                                                                    content.content_type_uuid
                                                                                                                )}
                                                                                                                {content.duration
                                                                                                                    ? ` • ${content.duration}`
                                                                                                                    : ''}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    {isSelected ? (
                                                                                                        <CircleDot className='text-primary h-4 w-4 shrink-0' />
                                                                                                    ) : null}
                                                                                                </button>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </CollapsibleContent>
                                                                            </div>
                                                                        </Collapsible>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className='space-y-6'>
                                                        <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                                                            <div className='mb-4'>
                                                                <h3 className='text-foreground text-lg font-semibold'>
                                                                    {selectedLesson
                                                                        ? `${selectedModule && lessonModules.length
                                                                            ? `Lesson ${lessonModules.findIndex(module => module.lesson.uuid === selectedModule.lesson.uuid) + 1}.${(selectedModule.content?.data?.findIndex(item => item.uuid === selectedLesson.uuid) ?? 0) + 1}`
                                                                            : 'Lesson'
                                                                        }`
                                                                        : 'Lesson details'}
                                                                </h3>
                                                            </div>

                                                            {selectedLesson ? (
                                                                <div className='space-y-4'>
                                                                    <div className='flex items-center gap-3'>
                                                                        <div className='bg-primary/10 rounded-full p-2.5'>
                                                                            {getContentTypeIcon(
                                                                                contentTypeMap,
                                                                                selectedLesson.content_type_uuid
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className='text-foreground font-medium'>
                                                                                {getContentTypeLabel(
                                                                                    contentTypeMap,
                                                                                    selectedLesson.content_type_uuid
                                                                                )}
                                                                            </p>
                                                                            <p className='text-muted-foreground text-sm'>
                                                                                {selectedLesson.duration || 'Duration not set'}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <Button className='w-full rounded-full'>
                                                                        {contentTypeMap[selectedLesson.content_type_uuid] === 'video' ? (
                                                                            <Play className='mr-2 h-4 w-4' />
                                                                        ) : null}
                                                                        Start lesson
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <p className='text-muted-foreground text-sm'>
                                                                    Select a lesson from the course program to view details.
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                                                            <div className='mb-4'>
                                                                <h3 className='text-foreground text-lg font-semibold'>
                                                                    Resources
                                                                </h3>
                                                            </div>

                                                            {selectedModuleResources.length ? (
                                                                <div className='space-y-3'>
                                                                    {selectedModuleResources.map(resource => (
                                                                        <div
                                                                            key={resource.uuid}
                                                                            className='flex items-start gap-3 rounded-[20px] border border-border/70 bg-card p-3'
                                                                        >
                                                                            {getContentTypeIcon(
                                                                                contentTypeMap,
                                                                                resource.content_type_uuid
                                                                            )}
                                                                            <div className='min-w-0'>
                                                                                <p className='text-foreground text-sm font-medium'>
                                                                                    {resource.title}
                                                                                </p>
                                                                                <p className='text-muted-foreground mt-1 text-xs'>
                                                                                    {getContentTypeLabel(
                                                                                        contentTypeMap,
                                                                                        resource.content_type_uuid
                                                                                    )}
                                                                                    {resource.duration
                                                                                        ? ` • ${resource.duration}`
                                                                                        : ''}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className='text-muted-foreground text-sm'>
                                                                    Resources for the selected lesson will appear here.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value='students' className='mt-0'>
                                <PlaceholderTab
                                    title='Students'
                                    description='This tab is left open for the class roster, learner progress, and other student-facing instructor tools we can add next.'
                                />
                            </TabsContent>

                            <TabsContent value='announcements' className='mt-0'>
                                <PlaceholderTab
                                    title='Announcements'
                                    description='This tab is ready for class-wide announcement tools and communication flows when you are ready to wire them in.'
                                />
                            </TabsContent>

                            <TabsContent value='tasks' className='mt-0'>
                                <PlaceholderTab
                                    title='Tasks'
                                    description='This tab stays open for upcoming instructor actions, assignments, and class tasks in a later update.'
                                />
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            ) : null}
        </div>
    );
}
