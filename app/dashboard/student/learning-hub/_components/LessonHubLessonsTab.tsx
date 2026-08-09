'use client';

import { useQueries } from '@tanstack/react-query';
import {
    Bookmark,
    BookmarkCheck,
    BookOpen,
    Download,
    FileText,
    PlayCircle,
    StickyNote,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
    getCourseLessonsOptions,
    getLessonContentOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { LessonContent } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

import { useClassesByIds, useCoursesByIds } from '../../../../../hooks/use-batched-lookups';
import { cn } from '../../../../../lib/utils';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import type { LearningHubData } from './useStudentLearningHubData';

type LessonCourse = {
    uuid?: string;
    title?: string | null;
    name?: string | null;
    description?: string | null;
};

type ClassDetails = {
    uuid?: string;
    title: string;
    description?: string | null;
    course_uuid?: string | null;
    thumbnail_url?: string | null;
};

type ClassCardRow = {
    id: string;
    classDefinitionUuid: string;
    classTitle: string;
    classDescription?: string | null;
    classHref: string;
    courseId?: string;
    statusLabel: string;
    sessionCountLabel: string;
    latestActivityLabel: string;
    latestStartLabel: string;
};

type ClassCard = ClassCardRow & {
    courseTitle: string;
};

type LessonSummary = {
    uuid?: string;
    lesson_number?: number;
    title: string;
    description?: string | null;
};

type LessonModule = {
    id: string;
    classDefinitionUuid: string;
    classTitle: string;
    classHref: string;
    courseId: string;
    courseTitle: string;
    position?: number;
    title: string;
    description?: string;
    content_url?: string | null;
    content_text?: string | null;
    lessonUuid?: string;
    contentItems: LessonContent[];
};

type LessonNotes = Record<string, string>;

interface LessonHubLessonsTabProps {
    learningHubData: LearningHubData;
}

const buildClassLessonHref = (classHref: string, lesson: LessonModule) => {
    const params = new URLSearchParams();

    if (lesson.lessonUuid) params.set('lesson', lesson.lessonUuid);
    if (lesson.courseId) params.set('course', lesson.courseId);
    const contentUuid = lesson.contentItems[0]?.uuid;
    if (contentUuid) params.set('content', contentUuid);

    const search = params.toString();
    return search ? `${classHref}?${search}` : classHref;
};

export function LessonHubLessonsTab({ learningHubData }: LessonHubLessonsTabProps) {
    const [classFilter, setClassFilter] = useState<string>('all');
    const [onlyBookmarked, setOnlyBookmarked] = useState(false);
    const [activeLesson, setActiveLesson] = useState<LessonModule | null>(null);
    const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
    const [notesByLesson, setNotesByLesson] = useState<LessonNotes>({});

    const classDefinitionUuids = useMemo(
        () =>
            Array.from(
                new Set(
                    learningHubData.classEnrollments
                        .map(item => item.class_definition_uuid)
                        .filter((value): value is string => Boolean(value))
                )
            ),
        [learningHubData.classEnrollments]
    );

    const { classDefinitionMap, isLoading: classDefinitionsLoading } =
        useClassesByIds(classDefinitionUuids);

    const baseClassRows = useMemo<ClassCardRow[]>(() => {
        return learningHubData.classEnrollments
            .map(item => {
                const classDefinition = classDefinitionMap[item.class_definition_uuid] as
                    | ClassDetails
                    | undefined;
                const courseUuid = classDefinition?.course_uuid ?? undefined;
                const classTitle =
                    classDefinition?.title?.trim() ||
                    '';
                const classHref = `/dashboard/student/learning-hub/classes/${item.class_definition_uuid}`;

                return {
                    id: item.id,
                    classDefinitionUuid: item.class_definition_uuid,
                    classTitle,
                    classDescription: classDefinition?.description ?? null,
                    classHref,
                    courseId: courseUuid,
                    statusLabel: item.latest_enrollment_status
                        ? String(item.latest_enrollment_status).replaceAll('_', ' ')
                        : 'Enrolled',
                    sessionCountLabel:
                        item.scheduled_instance_count === 1
                            ? '1 scheduled session'
                            : `${item.scheduled_instance_count ?? 0} scheduled sessions`,
                    latestActivityLabel: item.latest_activity_date
                        ? `Updated ${new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }).format(new Date(item.latest_activity_date))}`
                        : 'No recent activity',
                    latestStartLabel: item.latest_scheduled_instance_start_time
                        ? `Starts ${new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }).format(new Date(item.latest_scheduled_instance_start_time))}`
                        : 'Start time pending',
                };
            })
            .filter(item => Boolean(item.courseId));
    }, [classDefinitionMap, learningHubData.classEnrollments]);

    const courseUuids = useMemo(
        () =>
            Array.from(
                new Set(
                    baseClassRows
                        .map(item => item.courseId)
                        .filter((value): value is string => Boolean(value))
                )
            ),
        [baseClassRows]
    );

    const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseUuids);

    const classRows = useMemo<ClassCard[]>(() => {
        return baseClassRows.map(row => {
            const course = row.courseId ? (courseMap[row.courseId] as LessonCourse | undefined) : undefined;

            return {
                ...row,
                courseTitle: course?.title ?? course?.name ?? 'Course content',
            };
        });
    }, [baseClassRows, courseMap]);

    const courseLessonQueries = useQueries({
        queries: courseUuids.map(courseUuid => ({
            ...getCourseLessonsOptions({
                path: { courseUuid },
                query: { pageable: {} },
            }),
            enabled: Boolean(courseUuid),
            staleTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        })),
    });

    const courseLessonsByUuid = useMemo(() => {
        const map = new Map<string, LessonSummary[]>();

        courseUuids.forEach((courseUuid, index) => {
            const lessons = courseLessonQueries[index]?.data?.data?.content ?? [];
            map.set(courseUuid, lessons);
        });

        return map;
    }, [courseLessonQueries, courseUuids]);

    const uniqueLessonRecords = useMemo(
        () =>
            courseUuids.flatMap(courseUuid =>
                (courseLessonsByUuid.get(courseUuid) ?? [])
                    .filter((lesson): lesson is LessonSummary & { uuid: string } => Boolean(lesson.uuid))
                    .map(lesson => ({
                        courseUuid,
                        lesson,
                    }))
            ),
        [courseLessonsByUuid, courseUuids]
    );

    const lessonContentQueries = useQueries({
        queries: uniqueLessonRecords.map(({ courseUuid, lesson }) => ({
            ...getLessonContentOptions({
                path: {
                    courseUuid,
                    lessonUuid: lesson.uuid,
                },
            }),
            enabled: Boolean(courseUuid && lesson.uuid),
            staleTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        })),
    });

    const lessonContentByKey = useMemo(() => {
        const map = new Map<string, LessonContent[]>();

        uniqueLessonRecords.forEach((record, index) => {
            map.set(`${record.courseUuid}:${record.lesson.uuid}`, lessonContentQueries[index]?.data?.data ?? []);
        });

        return map;
    }, [lessonContentQueries, uniqueLessonRecords]);

    const lessons = useMemo<LessonModule[]>(() => {
        return classRows.flatMap(classRow => {
            if (!classRow.courseId) return [];

            const course = courseMap[classRow.courseId] as LessonCourse | undefined;

            const courseLessons = courseLessonsByUuid.get(classRow.courseId) ?? [];

            return courseLessons.map((lesson, index) => {
                const lessonUuid = lesson.uuid ?? '';
                const contentItems = lessonUuid
                    ? lessonContentByKey.get(`${classRow.courseId}:${lessonUuid}`) ?? []
                    : [];
                const firstContent = contentItems[0] ?? null;
                const lessonId = lessonUuid || `${classRow.classDefinitionUuid}-${lesson.lesson_number ?? index}`;

                return {
                    id: lessonId,
                    classDefinitionUuid: classRow.classDefinitionUuid,
                    classTitle: classRow.classTitle,
                    classHref: classRow.classHref,
                    courseId: classRow.courseId,
                    courseTitle: course?.title ?? course?.name ?? classRow.courseTitle,
                    position: lesson.lesson_number,
                    title: lesson.title,
                    description: lesson.description,
                    content_url: firstContent?.file_url ?? null,
                    content_text: firstContent?.content_text ?? null,
                    lessonUuid: lessonUuid || undefined,
                    contentItems,
                };
            });
        });
    }, [classRows, courseLessonsByUuid, courseMap, lessonContentByKey]);

    const visibleClasses = useMemo(
        () =>
            classRows
                .map(classRow => {
                    const rows = lessons.filter(
                        lesson =>
                            lesson.classDefinitionUuid === classRow.classDefinitionUuid &&
                            (classFilter === 'all' || lesson.classDefinitionUuid === classFilter) &&
                            (!onlyBookmarked || bookmarks.has(lesson.id))
                    );

                    return {
                        ...classRow,
                        rows,
                    };
                })
                .filter(item => item.rows.length > 0),
        [bookmarks, classFilter, classRows, lessons, onlyBookmarked]
    );

    const filteredLessons = useMemo(
        () =>
            lessons.filter(
                lesson =>
                    (classFilter === 'all' || lesson.classDefinitionUuid === classFilter) &&
                    (!onlyBookmarked || bookmarks.has(lesson.id))
            ),
        [bookmarks, classFilter, lessons, onlyBookmarked]
    );

    useEffect(() => {
        if (activeLesson && !filteredLessons.some(item => item.id === activeLesson.id)) {
            setActiveLesson(null);
        }
    }, [activeLesson, filteredLessons]);

    if (learningHubData.loading || classDefinitionsLoading || coursesLoading) {
        return <LessonHubLessonsSkeleton />;
    }

    if (classRows.length === 0) {
        return (
            <EmptyState
                variant='plain'
                icon={BookOpen}
                title='No class lessons yet'
                description='Enroll in a class to unlock the lesson library and access course content through that class.'
                action={
                    <Button asChild>
                        <Link href='/dashboard/student/learning-hub/classes'>Browse classes</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
                <div className='flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1'>
                    <Button
                        size='sm'
                        variant={classFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setClassFilter('all')}
                        className={cn('shrink-0', classFilter === 'all' && 'bg-primary hover:bg-primary/90')}
                    >
                        All classes
                    </Button>

                    {classRows.map(classRow => {
                        const active = classFilter === classRow.classDefinitionUuid;

                        return (
                            <Button
                                key={classRow.classDefinitionUuid}
                                size='sm'
                                variant={active ? 'default' : 'outline'}
                                onClick={() => setClassFilter(classRow.classDefinitionUuid)}
                                title={classRow.classTitle}
                                className={cn(
                                    'group relative shrink-0 overflow-visible transition-all duration-200',
                                    'max-w-[180px] hover:z-20 hover:max-w-[320px]',
                                    active && 'bg-primary hover:bg-primary/90'
                                )}
                            >
                                <span className='block truncate group-hover:overflow-visible group-hover:whitespace-normal'>
                                    {classRow.classTitle}
                                </span>
                            </Button>
                        );
                    })}
                </div>

                <div className='shrink-0'>
                    <Button
                        size='sm'
                        variant={onlyBookmarked ? 'default' : 'outline'}
                        onClick={() => setOnlyBookmarked(value => !value)}
                        className={cn('whitespace-nowrap', onlyBookmarked && 'bg-warning/50 hover:bg-warning/60')}
                    >
                        <BookmarkCheck className='mr-1 h-4 w-4' />
                        Bookmarked ({bookmarks.size})
                    </Button>
                </div>
            </div>

            <div className='mt-6 space-y-6'>
                {filteredLessons.length === 0 ? (
                    <Card>
                        <CardContent className='py-8 text-center text-sm text-muted-foreground'>
                            No lessons match this filter.
                        </CardContent>
                    </Card>
                ) : (
                    visibleClasses.map(classRow => (
                        <Card key={classRow.classDefinitionUuid}>
                            <CardHeader>
                                <CardTitle className='text-base'>{classRow.courseTitle}</CardTitle>
                                <CardDescription className='space-y-1'>
                                    <div>{classRow.classTitle}</div>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className='space-y-2'>
                                {classRow.rows
                                    .slice()
                                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                                    .map(lesson => (
                                        <LessonRow
                                            key={lesson.id}
                                            lesson={lesson}
                                            bookmarked={bookmarks.has(lesson.id)}
                                            onToggleBookmark={() =>
                                                setBookmarks(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(lesson.id)) next.delete(lesson.id);
                                                    else next.add(lesson.id);
                                                    return next;
                                                })
                                            }
                                            onOpenNotes={() => setActiveLesson(lesson)}
                                        />
                                    ))}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <LessonNotesSheet
                lesson={activeLesson}
                notesByLesson={notesByLesson}
                onClose={() => setActiveLesson(null)}
                onSave={(lessonId, content) =>
                    setNotesByLesson(prev => ({
                        ...prev,
                        [lessonId]: content,
                    }))
                }
            />
        </div>
    );
}

function LessonRow({
    lesson,
    bookmarked,
    onToggleBookmark,
    onOpenNotes,
}: {
    lesson: LessonModule;
    bookmarked: boolean;
    onToggleBookmark: () => void;
    onOpenNotes: () => void;
}) {
    const url = lesson.content_url ?? null;
    const isVideo = url ? /youtube|youtu\.be|vimeo|\.mp4($|\?)|\.webm($|\?)/i.test(url) : false;
    const canDownload = Boolean(url && !isVideo);
    const href = buildClassLessonHref(lesson.classHref, lesson);

    return (
        <div className='flex items-center justify-between gap-3 rounded-md border p-3'>
            <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>
                    {lesson.position ? `${lesson.position}. ` : ''}
                    {lesson.title}
                </p>
                {lesson.description && (
                    <p className='line-clamp-1 mt-1.5 text-xs text-muted-foreground'>
                        {stripHtml(lesson.description)}
                    </p>
                )}
            </div>

            <div className='flex shrink-0 items-center gap-1'>
                <Button
                    size='icon'
                    variant='ghost'
                    title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    onClick={onToggleBookmark}
                >
                    {bookmarked ? <BookmarkCheck className='h-4 w-4 text-warning' /> : <Bookmark className='h-4 w-4' />}
                </Button>

                <Button size='sm' variant='outline' className='gap-1 text-xs' onClick={onOpenNotes}>
                    <StickyNote className='mr-1 h-3 w-3' />
                    Notes
                </Button>

                <Button asChild size='sm' className='gap-0 bg-success text-xs hover:bg-success/90'>
                    <Link href={href}>
                        {isVideo ? (
                            <>
                                <PlayCircle className='mr-1 h-3 w-3' />
                                Watch
                            </>
                        ) : (
                            <>
                                <FileText className='mr-1 h-3 w-3' />
                                Open
                            </>
                        )}
                    </Link>
                </Button>

                {canDownload ? (
                    <Button asChild size='icon' variant='ghost' title='Download'>
                        <a href={toAuthenticatedMediaUrl(url)!} download target='_blank' rel='noreferrer'>
                            <Download className='h-3 w-3' />
                        </a>
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

function LessonNotesSheet({
    lesson,
    notesByLesson,
    onClose,
    onSave,
}: {
    lesson: LessonModule | null;
    notesByLesson: LessonNotes;
    onClose: () => void;
    onSave: (lessonId: string, content: string) => void;
}) {
    const [content, setContent] = useState('');
    const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

    useEffect(() => {
        if (!lesson) {
            setCurrentLessonId(null);
            setContent('');
            return;
        }

        if (currentLessonId !== lesson.id) {
            setContent(notesByLesson[lesson.id] ?? '');
            setCurrentLessonId(lesson.id);
        }
    }, [lesson, currentLessonId, notesByLesson]);

    const handleClose = () => {
        setCurrentLessonId(null);
        setContent('');
        onClose();
    };

    const handleSave = () => {
        if (!lesson) return;
        onSave(lesson.id, content);
        toast.success('Notes saved');
    };

    return (
        <Sheet open={Boolean(lesson)} onOpenChange={open => !open && handleClose()}>
            <SheetContent className='sm:max-w-lg'>
                <SheetHeader>
                    <SheetTitle>{lesson?.title}</SheetTitle>
                    <SheetDescription>
                        {lesson?.classTitle} · private notes
                    </SheetDescription>
                </SheetHeader>
                <div className='mt-4 space-y-3'>
                    <Textarea
                        value={content}
                        onChange={event => setContent(event.target.value)}
                        rows={14}
                        placeholder='Jot down key points, questions, references...'
                    />
                    <div className='flex justify-end gap-2'>
                        <Button variant='outline' onClick={handleClose}>
                            Close
                        </Button>
                        <Button onClick={handleSave} className='bg-primary'>
                            Save notes
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function LessonHubLessonsSkeleton() {
    return (
        <div className='space-y-4'>
            <Skeleton className='h-10 w-full rounded-sm' />
            <Skeleton className='h-44 w-full rounded-md' />
            <Skeleton className='h-44 w-full rounded-md' />
        </div>
    );
}
