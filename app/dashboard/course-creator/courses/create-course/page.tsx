'use client';

import { LessonContentViewerDialog } from '@/components/content-preview/LessonContentPreview';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreator } from '@/context/course-creator-context';
import {
    deleteAssignmentMutation,
    deleteLessonContentMutation,
    deleteQuizMutation,
    getCourseByUuidOptions,
    getCourseLessonsOptions,
    getLessonContentOptions,
    getLessonContentQueryKey,
    searchAssignmentsOptions,
    searchQuizzesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
    ApiResponseCourse,
    Assignment,
    Course,
    Lesson,
    LessonContent,
    PagedDtoLesson,
    Quiz,
} from '@/services/client/types.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, PlusCircle, Sparkles, Trash } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import DeleteModal from '../../../../../components/custom-modals/delete-modal';
import { useCourseLessonsWithContent } from '../../../../../hooks/use-courselessonwithcontent';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import CourseBrandingForm from '../../_components/course-branding-form';
import { CourseCreationForm, type CourseFormRef } from '../../_components/course-creation-form';
import type { CourseCreationFormValues } from '../../_components/course-creation-types';
import CourseGradingSection from '../../_components/course-grading-section';
import { CoursePricingForm } from '../../_components/course-pricing-form';
import CriteriaCreationForm from '../../_components/criteria-creation-form';
import {
    CONTENT_TYPES,
    LessonContentDialog,
    LessonDialog,
    getContentTypeIcon,
    type ContentType,
    type LessonFormValues,
} from '../../_components/lesson-management-form';
import {
    CourseCreatorEmptyState,
    CourseCreatorLoadingState,
} from '../../_components/loading-state';
import { PracticeActivityManager } from '../../_components/practice-activity-management';
import {
    createEmptyDraftsByProvider,
    type Provider,
} from '../../_components/training-requirement-section';
import AssessmentCreation from './assessment-creation';
import { Stepper } from './stepper';

type SaveableCourseFormRef = {
    submit: () => Promise<boolean>;
};

type StepNavProps = {
    previousLabel: string;
    nextLabel: string;
    onPrevious?: () => void;
    onNext?: () => void;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    nextLoading?: boolean;
};

function StepNav({
    previousLabel,
    nextLabel,
    onPrevious,
    onNext,
    previousDisabled,
    nextDisabled,
    nextLoading,
}: StepNavProps) {
    return (
        <div className='flex flex-wrap items-center justify-between gap-3 pt-6'>
            <Button type='button' variant='outline' onClick={onPrevious} disabled={previousDisabled}>
                {previousLabel}
            </Button>
            <Button type='button' onClick={onNext} disabled={nextDisabled}>
                {nextLoading ? 'Saving...' : nextLabel}
            </Button>
        </div>
    );
}


type CourseLesson = Lesson & { uuid: string };
type InlineLessonContent = LessonContent & {
    content_type_key?: string;
};
type LessonEditable = CourseLesson & {
    learning_objectives?: string;
    duration_hours?: number;
    duration_minutes?: number;
    resources?: Array<{ title?: string; url?: string }>;
};

type AssessmentMode = 'Quiz' | 'Assignment';

type AssessmentListItem = {
    kind: AssessmentMode;
    uuid: string;
    lessonUuid: string;
    lessonTitle: string;
    lessonOrder: number;
    title: string;
    description: string;
    statusLabel: string;
    statusTone: 'default' | 'secondary' | 'outline';
    meta: string[];
};

const CONTENT_TYPE_OPTIONS: ContentType[] = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'PDF'];

const formatAssessmentDate = (value?: string | Date | null) => {
    if (!value) return 'No due date';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No due date';
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
};

const getAssessmentDescription = (value?: string | null) => {
    const description = stripHtml(value ?? '').trim();
    return description || 'No description provided.';
};

const getAssessmentStatusTone = (isActive?: boolean, isPublished?: boolean): AssessmentListItem['statusTone'] => {
    if (isActive || isPublished) return 'default';
    return 'secondary';
};

const STEP_DETAILS = [
    { title: 'Course Setup', description: 'Create the course and define its training requirements.' },
    { title: 'Lessons + Content', description: 'Create lessons, then add lesson content on the same page.' },
    { title: 'Practice Activities', description: 'Attach activities to a specific lesson.' },
    { title: 'Assessment Tasks', description: 'Open quiz and assignment editing in a sheet from the right.' },
    { title: 'Assessment + Grading', description: 'Define the assessment structure and grading rules.' },
    { title: 'Branding + Pricing', description: 'Finalize the course brand styling and the pricing details.' },
];

const mapCourseValues = (course?: Course | null): Partial<CourseCreationFormValues> | undefined => {
    if (!course) return undefined;

    return {
        name: course.name || '',
        description: course.description || '',
        instructor: course.course_creator_uuid || '',
        price: course.price ?? 0,
        objectives: course.objectives || '',
        categories: course.category_uuids || [],
        difficulty: course.difficulty_uuid || '',
        class_limit: course.class_limit ?? 0,
        prerequisites: course.prerequisites || '',
        duration_hours: course.duration_hours ?? 0,
        duration_minutes: course.duration_minutes ?? 0,
        age_lower_limit: course.age_lower_limit ?? 0,
        age_upper_limit: course.age_upper_limit ?? 0,
        thumbnail_url: course.thumbnail_url || '',
        intro_video_url: course.intro_video_url || '',
        banner_url: course.banner_url || '',
        status: course.status || '',
        active: course.active ?? true,
        created_by: course.created_by || '',
        updated_by: course.updated_by || '',
        is_published: course.is_published ?? false,
        total_duration_display: course.total_duration_display || '',
        is_draft: course.is_draft ?? false,
        minimum_training_fee: course.minimum_training_fee ?? 0,
        creator_share_percentage: course.creator_share_percentage ?? 0,
        instructor_share_percentage: course.instructor_share_percentage ?? 0,
        revenue_share_notes: course.revenue_share_notes || '',
        training_requirements: [],
    };
};

const mapLessonValues = (lesson: LessonEditable | null): Partial<LessonFormValues> | undefined => {
    if (!lesson) return undefined;

    return {
        number: lesson.lesson_number ?? 0,
        title: lesson.title ?? '',
        description: lesson.description ?? '',
        objectives: lesson.learning_objectives ?? '',
        duration_hours: lesson.duration_hours ?? 0,
        duration_minutes: lesson.duration_minutes ?? 0,
        uuid: lesson.uuid,
    };
};

function LoadingBlock() {
    return (
        <div className='space-y-4'>
            <Skeleton className='h-28 w-full rounded-2xl' />
            <Skeleton className='h-56 w-full rounded-2xl' />
            <Skeleton className='h-56 w-full rounded-2xl' />
        </div>
    );
}

function SectionGuard({
    isReady,
    isLoading,
    title,
    description,
    children,
}: {
    isReady: boolean;
    isLoading: boolean;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    if (isLoading) {
        return <LoadingBlock />;
    }

    if (!isReady) {
        return <EmptyState title={title} description={description} />;
    }

    return <>{children}</>;
}


function LessonContentStack({
    courseId,
    lessons,
    lessonContentsMap,
    isLoading,
}: {
    courseId: string | null;
    lessons: CourseLesson[];
    lessonContentsMap: Map<string, LessonContent[]>;
    isLoading: boolean;
}) {
    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonEditable | null>(null);
    const [contentDialogOpen, setContentDialogOpen] = useState(false);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState<InlineLessonContent | null>(null);
    const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
    const [viewingContent, setViewingContent] = useState<InlineLessonContent | null>(null);
    const [contentViewerOpen, setContentViewerOpen] = useState(false);

    const {
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: courseId as string });

    // ---- delete confirmation state ----
    const [deleteModal, setDeleteModal] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{
        lessonUuid: string;
        content: LessonContent;
    } | null>(null);

    const openCreateLesson = () => {
        setEditingLesson(null);
        setLessonDialogOpen(true);
    };

    const openEditLesson = (lesson: LessonEditable) => {
        setEditingLesson(lesson);
        setLessonDialogOpen(true);
    };

    const closeLessonDialog = () => {
        setLessonDialogOpen(false);
        setEditingLesson(null);
    };

    const openCreateContent = (lessonId: string, contentType?: ContentType) => {
        setSelectedLessonId(lessonId);
        setEditingContent(null);
        setSelectedContentType(contentType ?? null);
        setContentDialogOpen(true);
    };

    // How many content blocks the currently-targeted lesson already has — used to
    // seed display_order for a brand-new piece of content as (count + 1). Recomputed
    // on every render off the live lessonContentsMap, so it stays correct even if the
    // map refreshes while the sheet is open.
    const nextDisplayOrder = selectedLessonId
        ? (lessonContentsMap.get(selectedLessonId)?.length ?? 0) + 1
        : 1;

    const openEditContent = (lessonId: string, content: LessonContent) => {
        setSelectedLessonId(lessonId);
        setEditingContent(content as InlineLessonContent);
        setSelectedContentType((content as InlineLessonContent).content_type_key?.toUpperCase() as ContentType | null);
        setContentDialogOpen(true);
    };

    const openViewContent = (content: LessonContent) => {
        setViewingContent(content as InlineLessonContent);
        setContentViewerOpen(true);
    };

    const qc = useQueryClient();
    const deleteContentMut = useMutation(deleteLessonContentMutation());
    const onDeleteContent = (lessonUuid: string, content: LessonContent) => {
        setPendingDelete({ lessonUuid, content });
        setDeleteModal(true);
    };
    const confirmDelete = () => {
        if (!pendingDelete || !courseId) return;

        deleteContentMut.mutate(
            {
                path: {
                    contentUuid: pendingDelete.content.uuid!,
                    courseUuid: courseId,
                    lessonUuid: pendingDelete.lessonUuid,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Content deleted");
                    qc.invalidateQueries({
                        queryKey: getLessonContentQueryKey({
                            path: {
                                courseUuid: courseId as string,
                                lessonUuid: pendingDelete.lessonUuid,
                            },
                        }),
                    });
                    setDeleteModal(false);
                    setPendingDelete(null);
                },
                onError: (error) => {
                    toast.error(error.message || "Failed to delete content");
                },
            }
        );
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-3'>
                <div className='space-y-1'>
                    <p className='text-foreground text-sm font-medium'>Lessons</p>
                    <p className='text-muted-foreground text-sm'>
                        Create a lesson, then add content directly underneath it.
                    </p>
                </div>
                <Button type='button' onClick={openCreateLesson}>
                    <PlusCircle className="h-4 w-4" />  Add Lesson
                </Button>
            </div>

            {isLoading ? (
                <LoadingBlock />
            ) : lessons.length === 0 ? (
                <EmptyState
                    title='No lessons yet'
                    description='Create your first lesson to start adding content beneath it.'
                />
            ) : (
                <div className='space-y-4'>
                    {lessons
                        .slice()
                        .sort((a, b) => a.lesson_number - b.lesson_number)
                        .map((lesson, index) => {
                            const contents = lesson.uuid ? lessonContentsMap.get(lesson.uuid) ?? [] : [];

                            return (
                                <Card key={lesson.uuid} className='overflow-hidden rounded-2xl'>
                                    <CardHeader className='flex flex-row items-start justify-between gap-4 border-b'>
                                        <div className='space-y-1'>
                                            <CardTitle className='text-base'>
                                                Lesson {index + 1}: {lesson.title || 'Untitled lesson'}
                                            </CardTitle>
                                            <CardDescription>
                                                {stripHtml(lesson.description) || 'Add engaging content for effective learning.'}
                                            </CardDescription>
                                        </div>

                                        <Button
                                            type='button'
                                            variant='ghost'
                                            onClick={() => openEditLesson(lesson as LessonEditable)}
                                        >
                                            <Pencil className='h-5 w-5' />
                                        </Button>
                                    </CardHeader>

                                    <CardContent className='space-y-4 p-6'>
                                        <div className='space-y-3'>
                                            <div className='flex flex-row flex-wrap gap-3'>
                                                {CONTENT_TYPE_OPTIONS.map(contentType => {
                                                    const label = CONTENT_TYPES[contentType];
                                                    const Icon = getContentTypeIcon(contentType);

                                                    return (
                                                        <Button
                                                            key={contentType}
                                                            type='button'
                                                            variant='outline'
                                                            className='justify-start gap-2 rounded p-4 text-left max-w-fit'
                                                            onClick={() => openCreateContent(lesson.uuid, contentType)}
                                                        >
                                                            {Icon}
                                                            <span>{label}</span>
                                                        </Button>
                                                    );
                                                })}
                                            </div>

                                            <div className='flex items-center justify-between gap-3'>
                                                <p className='text-foreground text-sm font-medium'>Lesson Content</p>
                                            </div>

                                            {contents.length === 0 ? (
                                                <div className='border-border text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-sm'>
                                                    No content added yet. Choose a content type above to get started.
                                                </div>
                                            ) : (
                                                <div className='space-y-3'>
                                                    {contents.map(content => (
                                                        <div
                                                            key={content.uuid}
                                                            className='bg-muted/40 border-border flex items-start justify-between gap-4 rounded-xl border p-4'
                                                        >
                                                            <div className='space-y-1'>
                                                                <p className='text-sm font-medium'>{content.title || 'Untitled content'}</p>
                                                                <p className='text-muted-foreground text-xs'>
                                                                    {content.content_text
                                                                        ? 'Text content'
                                                                        : content.file_url
                                                                            ? 'File or media content'
                                                                            : 'Lesson content'}
                                                                </p>
                                                            </div>

                                                            <div className='flex flex-row items-center gap-2' >
                                                                <Button
                                                                    type='button'
                                                                    variant='ghost'
                                                                    size='sm'
                                                                    onClick={() => openViewContent(content)}
                                                                >
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    type='button'
                                                                    variant='ghost'
                                                                    size='sm'
                                                                    onClick={() => openEditContent(lesson.uuid, content)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    type='button'
                                                                    variant='destructive'
                                                                    size='sm'
                                                                    onClick={() => onDeleteContent(lesson.uuid, content)}
                                                                >
                                                                    <Trash />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                </div>
            )}

            {courseId ? (
                <>
                    <LessonDialog
                        isOpen={lessonDialogOpen}
                        onOpenChange={open => {
                            if (!open) {
                                closeLessonDialog();
                            } else {
                                setLessonDialogOpen(true);
                            }
                        }}
                        courseId={courseId}
                        lessonId={editingLesson?.uuid}
                        initialValues={mapLessonValues(editingLesson)}
                        onCancel={closeLessonDialog}
                    />

                    <LessonContentDialog
                        isOpen={contentDialogOpen}
                        onOpenChange={setContentDialogOpen}
                        courseId={courseId}
                        lessonId={selectedLessonId ?? ''}
                        contentId={editingContent?.uuid ?? ''}
                        onCancel={() => {
                            setContentDialogOpen(false);
                            setSelectedLessonId(null);
                            setEditingContent(null);
                            setSelectedContentType(null);
                        }}
                        initialValues={
                            editingContent
                                ? ({
                                    ...editingContent,
                                    content_type: contentTypeMap[editingContent.content_type_uuid ?? ''] ?? '',
                                    content_type_uuid: editingContent.content_type_uuid ?? '',
                                    content_category: editingContent.content_category ?? '',
                                    title: editingContent.title ?? '',
                                    description: editingContent.description ?? '',
                                    content_text: editingContent.content_text ?? '',
                                    value: editingContent.file_url ?? '',
                                    file_url: editingContent.file_url ?? '',
                                    display_order: editingContent.display_order ?? 1,
                                    uuid: editingContent.uuid,
                                } as never)
                                : selectedContentType
                                    ? ({
                                        content_type: selectedContentType,
                                        title: selectedContentType === 'TEXT' ? 'Text Content' : '',
                                        description: '',
                                        content_type_uuid: '',
                                        content_category: '',
                                        content_text: '',
                                        value: '',
                                        // Auto-filled from the lesson's current content count, not hardcoded.
                                        display_order: nextDisplayOrder,
                                    } as never)
                                    : undefined
                        }
                    />

                    <LessonContentViewerDialog
                        open={contentViewerOpen}
                        onOpenChange={open => {
                            setContentViewerOpen(open);
                            if (!open) {
                                setViewingContent(null);
                            }
                        }}
                        content={viewingContent}
                        contentTypeMap={contentTypeMap}
                        contentType={viewingContent?.content_type_key ?? null}
                    />

                    <DeleteModal
                        open={deleteModal}
                        setOpen={(open: boolean) => {
                            setDeleteModal(open);
                            if (!open) setPendingDelete(null);
                        }}
                        title='Delete Content'
                        description={`Are you sure you want to delete "${pendingDelete?.content.title || 'this content'}"? This action cannot be undone.`}
                        onConfirm={confirmDelete}
                        isLoading={deleteContentMut.isPending}
                        confirmText='Delete Content'
                    />
                </>
            ) : null}
        </div>
    );
}

export default function CreateCoursePage() {
    const creator = useCourseCreator();
    const [step, setStep] = useState(0);
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
    const [isSavingBrandingPricing, setIsSavingBrandingPricing] = useState(false);
    const [requirementDrafts, setRequirementDrafts] = useState(createEmptyDraftsByProvider());
    const [activeRequirementProvider, setActiveRequirementProvider] =
        useState<Provider | null>(null);
    const [selectedPracticeLessonId, setSelectedPracticeLessonId] = useState<string>('');
    const [assessmentSheetOpen, setAssessmentSheetOpen] = useState(false);
    const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('Quiz');
    const [selectedAssessmentLessonId, setSelectedAssessmentLessonId] = useState<string>('');
    const [selectedAssessmentLesson, setSelectedAssessmentLesson] = useState<Lesson | null>(null);
    const [selectedQuizUuid, setSelectedQuizUuid] = useState<string | null>(null);
    const [selectedAssignmentUuid, setSelectedAssignmentUuid] = useState<string | null>(null);
    const [assessmentToDelete, setAssessmentToDelete] = useState<AssessmentListItem | null>(null);
    const courseFormRef = useRef<CourseFormRef>(null);
    const brandingFormRef = useRef<SaveableCourseFormRef>(null);
    const pricingFormRef = useRef<SaveableCourseFormRef>(null);
    const searchParams = useSearchParams();
    const queryCourseId = searchParams.get('id');

    const resolvedCourseId = queryCourseId ?? createdCourseId;

    const courseQuery = resolvedCourseId
        ? getCourseByUuidOptions({ path: { uuid: resolvedCourseId } })
        : null;
    const { data: courseResponse, isLoading: courseLoading } = useQuery({
        ...(courseQuery ?? {
            queryKey: ['create-course', 'course-placeholder'],
            queryFn: async () => null,
        }),
        enabled: Boolean(resolvedCourseId),
        staleTime: 60_000,
    });

    const course = (courseResponse?.data ?? null) as Course | null;
    const courseInitialValues = useMemo(() => mapCourseValues(course), [course]);
    const courseApiResponse = courseResponse as ApiResponseCourse | undefined;
    const handleSaveBrandingAndPricing = useCallback(async () => {
        if (isSavingBrandingPricing) return;

        setIsSavingBrandingPricing(true);

        try {
            const brandingSaved = await brandingFormRef.current?.submit();
            if (brandingSaved === false) return;

            const pricingSaved = await pricingFormRef.current?.submit();
            if (pricingSaved === false) return;
        } finally {
            setIsSavingBrandingPricing(false);
        }
    }, [isSavingBrandingPricing]);

    const lessonsQuery = resolvedCourseId
        ? getCourseLessonsOptions({
            path: { courseUuid: resolvedCourseId },
            query: { pageable: { page: 0, size: 100 } },
        })
        : null;
    const { data: lessonsResponse, isLoading: lessonsLoading } = useQuery({
        ...(lessonsQuery ?? {
            queryKey: ['create-course', 'lessons-placeholder'],
            queryFn: async () => null,
        }),
        enabled: Boolean(resolvedCourseId),
        staleTime: 60_000,
    });

    const lessons = lessonsResponse?.data as PagedDtoLesson | undefined;
    const lessonsWithUuid = useMemo(
        () =>
            ((lessons?.content ?? []) as Lesson[]).filter(
                (lesson): lesson is CourseLesson => Boolean(lesson?.uuid)
            ),
        [lessons]
    );

    const lessonContentQueries = useQueries({
        queries: lessonsWithUuid.map(lesson => {
            const options = getLessonContentOptions({
                path: { courseUuid: resolvedCourseId ?? '', lessonUuid: lesson.uuid },
            });

            return {
                ...options,
                enabled: Boolean(resolvedCourseId && lesson.uuid),
                staleTime: 60_000,
            };
        }),
    });

    const lessonContentMap = useMemo(() => {
        const map = new Map<string, LessonContent[]>();

        lessonsWithUuid.forEach((lesson, index) => {
            const contents = (lessonContentQueries[index]?.data?.data ?? []) as LessonContent[];
            map.set(lesson.uuid, contents);
        });

        return map;
    }, [lessonContentQueries, lessonsWithUuid]);

    useEffect(() => {
        if (!selectedPracticeLessonId && lessonsWithUuid[0]?.uuid) {
            setSelectedPracticeLessonId(lessonsWithUuid[0].uuid);
        }

        if (
            selectedPracticeLessonId &&
            !lessonsWithUuid.some(lesson => lesson.uuid === selectedPracticeLessonId)
        ) {
            setSelectedPracticeLessonId(lessonsWithUuid[0]?.uuid ?? '');
        }
    }, [lessonsWithUuid, selectedPracticeLessonId]);

    const practiceLesson = useMemo(
        () => lessonsWithUuid.find(lesson => lesson.uuid === selectedPracticeLessonId),
        [lessonsWithUuid, selectedPracticeLessonId]
    );

    useEffect(() => {
        if (!lessonsWithUuid.length) return;

        const matchedLesson =
            lessonsWithUuid.find(lesson => lesson.uuid === selectedAssessmentLessonId) ?? null;

        if (!selectedAssessmentLessonId) {
            const fallbackLesson = lessonsWithUuid[0];
            if (fallbackLesson) {
                setSelectedAssessmentLessonId(fallbackLesson.uuid);
                setSelectedAssessmentLesson(fallbackLesson);
            }
            return;
        }

        if (!matchedLesson) {
            const fallbackLesson = lessonsWithUuid[0];
            setSelectedAssessmentLessonId(fallbackLesson?.uuid ?? '');
            setSelectedAssessmentLesson(fallbackLesson ?? null);
            return;
        }

        if (matchedLesson.uuid !== selectedAssessmentLesson?.uuid) {
            setSelectedAssessmentLesson(matchedLesson);
        }
    }, [
        lessonsWithUuid,
        selectedAssessmentLesson?.uuid,
        selectedAssessmentLessonId,
    ]);

    const assessmentQueries = useQueries({
        queries: lessonsWithUuid.map(lesson => ({
            ...searchQuizzesOptions({
                query: { searchParams: { lesson_uuid_eq: lesson.uuid }, pageable: {} },
            }),
            enabled: Boolean(lesson.uuid),
            staleTime: 60_000,
        })),
    });

    const assignmentQueries = useQueries({
        queries: lessonsWithUuid.map(lesson => ({
            ...searchAssignmentsOptions({
                query: { searchParams: { lesson_uuid_eq: lesson.uuid }, pageable: {} },
            }),
            enabled: Boolean(lesson.uuid),
            staleTime: 60_000,
        })),
    });

    const lessonTitlesById = useMemo(() => {
        const map = new Map<string, { title: string; order: number }>();

        lessonsWithUuid.forEach((lesson, index) => {
            map.set(lesson.uuid, {
                title: lesson.title || `Lesson ${index + 1}`,
                order: index,
            });
        });

        return map;
    }, [lessonsWithUuid]);

    const assessmentItems = useMemo<AssessmentListItem[]>(() => {
        const quizItems = assessmentQueries.flatMap((query, index) => {
            const lesson = lessonsWithUuid[index];
            if (!lesson) return [];

            const lessonMeta = lessonTitlesById.get(lesson.uuid);
            const quizzes = query.data?.data?.content ?? [];

            return quizzes.map((quiz: Quiz) => ({
                kind: 'Quiz' as const,
                uuid: quiz.uuid ?? '',
                lessonUuid: lesson.uuid,
                lessonTitle: lessonMeta?.title ?? lesson.title ?? 'Untitled lesson',
                lessonOrder: lessonMeta?.order ?? index,
                title: quiz.title || 'Untitled quiz',
                description: getAssessmentDescription(quiz.description ?? quiz.instructions ?? ''),
                statusLabel: quiz.active ? 'Active' : 'Draft',
                statusTone: getAssessmentStatusTone(quiz.active),
                meta: [
                    `Pass ${quiz.passing_score ?? 0}%`,
                    `Attempts ${quiz.attempts_allowed ?? 1}`,
                    quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No time limit',
                ],
            }));
        });

        const assignmentItems = assignmentQueries.flatMap((query, index) => {
            const lesson = lessonsWithUuid[index];
            if (!lesson) return [];

            const lessonMeta = lessonTitlesById.get(lesson.uuid);
            const assignments = query.data?.data?.content ?? [];

            return assignments.map((assignment: Assignment) => ({
                kind: 'Assignment' as const,
                uuid: assignment.uuid ?? '',
                lessonUuid: lesson.uuid,
                lessonTitle: lessonMeta?.title ?? lesson.title ?? 'Untitled lesson',
                lessonOrder: lessonMeta?.order ?? index,
                title: assignment.title || 'Untitled assignment',
                description: getAssessmentDescription(assignment.description ?? assignment.instructions ?? ''),
                statusLabel: assignment.is_published ? 'Published' : 'Draft',
                statusTone: getAssessmentStatusTone(undefined, assignment.is_published),
                meta: [
                    assignment.due_date ? `Due ${formatAssessmentDate(assignment.due_date)}` : 'No due date',
                    assignment.max_points != null ? `${assignment.max_points} pts` : 'No max points',
                    assignment.submission_types ? String(assignment.submission_types).replaceAll('_', ' ') : 'Submission type open',
                ],
            }));
        });

        return [...quizItems, ...assignmentItems].filter(item => item.uuid).sort((left, right) => {
            if (left.lessonOrder !== right.lessonOrder) {
                return left.lessonOrder - right.lessonOrder;
            }

            if (left.kind !== right.kind) {
                return left.kind === 'Quiz' ? -1 : 1;
            }

            return left.title.localeCompare(right.title);
        });
    }, [assessmentQueries, assignmentQueries, lessonTitlesById, lessonsWithUuid]);

    const [expandedAssessmentLessonIds, setExpandedAssessmentLessonIds] = useState<string[]>([]);

    const assessmentsByLesson = useMemo(() => {
        const map = new Map<string, AssessmentListItem[]>();

        assessmentItems.forEach(item => {
            const items = map.get(item.lessonUuid) ?? [];
            items.push(item);
            map.set(item.lessonUuid, items);
        });

        for (const [lessonUuid, items] of map.entries()) {
            map.set(
                lessonUuid,
                items.sort((left, right) => {
                    if (left.kind !== right.kind) {
                        return left.kind === 'Quiz' ? -1 : 1;
                    }

                    return left.title.localeCompare(right.title);
                })
            );
        }

        return map;
    }, [assessmentItems]);

    const isAssessmentsLoading =
        assessmentQueries.some(query => query.isLoading) ||
        assignmentQueries.some(query => query.isLoading);

    const refreshAssessmentLists = useCallback(async () => {
        await Promise.all([
            ...assessmentQueries.map(query => query.refetch()),
            ...assignmentQueries.map(query => query.refetch()),
        ]);
    }, [assessmentQueries, assignmentQueries]);

    const openAssessmentSheet = useCallback(
        (mode: AssessmentMode, lessonId?: string, quizUuid?: string | null, assignmentUuid?: string | null) => {
            const lesson =
                lessonsWithUuid.find(currentLesson => currentLesson.uuid === lessonId) ??
                lessonsWithUuid[0] ??
                null;

            setAssessmentMode(mode);
            setSelectedAssessmentLessonId(lesson?.uuid ?? '');
            setSelectedAssessmentLesson(lesson);
            setSelectedQuizUuid(mode === 'Quiz' ? quizUuid ?? null : null);
            setSelectedAssignmentUuid(mode === 'Assignment' ? assignmentUuid ?? null : null);
            setAssessmentSheetOpen(true);
        },
        [lessonsWithUuid]
    );

    const closeAssessmentSheet = useCallback(() => {
        setAssessmentSheetOpen(false);
        setSelectedQuizUuid(null);
        setSelectedAssignmentUuid(null);
    }, []);

    const openNewAssessment = useCallback(
        (mode: AssessmentMode, lessonId?: string) => {
            openAssessmentSheet(mode, lessonId);
        },
        [openAssessmentSheet]
    );

    const openAssessmentEditor = useCallback(
        (item: AssessmentListItem) => {
            openAssessmentSheet(
                item.kind,
                item.lessonUuid,
                item.kind === 'Quiz' ? item.uuid : null,
                item.kind === 'Assignment' ? item.uuid : null
            );
        },
        [openAssessmentSheet]
    );

    const deleteQuizMut = useMutation(deleteQuizMutation());
    const deleteAssignmentMut = useMutation(deleteAssignmentMutation());

    const handleDeleteAssessment = useCallback((item: AssessmentListItem) => {
        setAssessmentToDelete(item);
    }, []);

    const confirmAssessmentDelete = useCallback(async () => {
        if (!assessmentToDelete?.uuid) return;

        try {
            if (assessmentToDelete.kind === 'Quiz') {
                await deleteQuizMut.mutateAsync({ path: { uuid: assessmentToDelete.uuid } });
            } else {
                await deleteAssignmentMut.mutateAsync({ path: { uuid: assessmentToDelete.uuid } });
            }

            await refreshAssessmentLists();
            setAssessmentToDelete(null);
            toast.success(`${assessmentToDelete.kind} deleted successfully.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to delete ${assessmentToDelete.kind.toLowerCase()}.`);
        }
    }, [assessmentToDelete, deleteAssignmentMut, deleteQuizMut, refreshAssessmentLists]);

    const canRenderCourseSections = Boolean(resolvedCourseId && courseApiResponse);

    if (creator.isLoading) {
        return <CourseCreatorLoadingState headline='Preparing the standalone course workspace…' />;
    }

    if (!creator.profile) {
        return <CourseCreatorEmptyState />;
    }

    return (
        <main className='mx-auto w-full space-y-6 px-4 py-6 lg:px-6'>
            <div className='flex flex-row items-center justify-between' >
                <Link
                    href='/dashboard/course-creator/course-management/all?type=courses'
                    className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
                >
                    <ArrowLeft className='h-4 w-4' /> Back to my courses
                </Link>

                <div className='flex flex-wrap items-center gap-2'>
                    <Button
                        type='button'
                        variant='outline'
                    // onClick={() => saveProgramAndAdvance(undefined)}
                    // disabled={createProgramMut.isPending || updateProgramMut.isPending || !creatorUuid}
                    >
                        Save Draft
                    </Button>
                    <Button
                        type='button'
                    // onClick={handlePublish}
                    // disabled={publishProgramMut.isPending || !creatorUuid || !canPublish}
                    >
                        <Sparkles className='mr-2 h-4 w-4' />
                        Publish
                    </Button>
                </div>

            </div>

            <PageHeader
                eyebrow='Program Creator'
                title={resolvedCourseId ? course?.name! : 'Create New Course'}
                description={
                    resolvedCourseId
                        ? 'Update this courses, including its lesson, contents, requirements, assessments, pricing and learning outcomes.'
                        : 'Build a high-quality course and empower students to learn new skills.'
                }
                action={
                    <></>
                }
            />

            <div className='space-y-6'>
                <Stepper step={step} onStep={setStep} />

                <Card className='min-h-[calc(100vh-18rem)] rounded-2xl'>
                    <CardContent className='flex flex-col gap-10'>
                        <div className='grow'>
                            {step === 0 ? (
                                resolvedCourseId && courseLoading ? (
                                    <CourseCreatorLoadingState headline='Loading your course details…' />
                                ) : (
                                    <div className='space-y-6'>
                                        <CourseCreationForm
                                            ref={courseFormRef}
                                            showSubmitButton
                                            courseId={resolvedCourseId || undefined}
                                            editingCourseId={resolvedCourseId || undefined}
                                            initialValues={courseInitialValues}
                                            requirementDrafts={requirementDrafts}
                                            setRequirementDrafts={setRequirementDrafts}
                                            activeRequirementProvider={activeRequirementProvider}
                                            setActiveRequirementProvider={setActiveRequirementProvider}
                                            postCreateRedirectHref={null}
                                            successResponse={data => {
                                                if (data?.uuid) {
                                                    setCreatedCourseId(data.uuid);
                                                    setStep(1);
                                                }
                                            }}
                                        />

                                        <StepNav
                                            previousLabel='Previous step'
                                            nextLabel='Next step'
                                            previousDisabled
                                            onNext={() => setStep(step + 1)}
                                        />
                                    </div>
                                )
                            ) : step === 1 ? (
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Lesson creation becomes available once the course has been saved.'
                                >
                                    <div className='space-y-6'>
                                        <LessonContentStack
                                            courseId={resolvedCourseId}
                                            lessons={lessonsWithUuid}
                                            lessonContentsMap={lessonContentMap}
                                            isLoading={Boolean(resolvedCourseId) && courseLoading}
                                        />

                                        <StepNav
                                            previousLabel='Previous step'
                                            nextLabel='Next step'
                                            onPrevious={() => setStep(0)}
                                            onNext={() => setStep(step + 1)}
                                        />
                                    </div>
                                </SectionGuard>
                            ) : step === 2 ? (
                                <SectionGuard
                                    isReady={canRenderCourseSections && lessonsWithUuid.length > 0}
                                    isLoading={Boolean(resolvedCourseId) && lessonsLoading}
                                    title='Add lessons first'
                                    description='Practice activities are available after at least one lesson exists.'
                                >
                                    <div className='space-y-6'>
                                        <div className='space-y-8'>
                                            {lessonsWithUuid.map((lesson, index) => (
                                                <section key={lesson.uuid} className='relative'>
                                                    {/* Lesson header */}
                                                    <div className='mb-3 flex items-center gap-2'>
                                                        <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground'>
                                                            {lesson.lesson_number ?? index + 1}
                                                        </div>

                                                        <div>
                                                            <p className='text-[10px] font-medium uppercase tracking-wide text-primary'>
                                                                Lesson {lesson.lesson_number ?? index + 1}
                                                            </p>

                                                            <h3 className='text-sm font-semibold'>
                                                                {lesson.title || 'Untitled lesson'}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    {/* Activities */}
                                                    <div className='ml-3 border-l pl-6'>
                                                        <PracticeActivityManager
                                                            courseUuid={resolvedCourseId}
                                                            lessonUuid={lesson.uuid}
                                                            showHeader
                                                        />
                                                    </div>
                                                </section>
                                            ))}
                                        </div>
                                        <StepNav
                                            previousLabel='Previous step'
                                            nextLabel='Next step'
                                            onPrevious={() => setStep(1)}
                                            onNext={() => setStep(step + 1)}
                                        />
                                    </div>
                                </SectionGuard>
                            ) : step === 3 ? (
                                <SectionGuard
                                    isReady={canRenderCourseSections && lessonsWithUuid.length > 0}
                                    isLoading={Boolean(resolvedCourseId) && lessonsLoading}
                                    title='Add lessons first'
                                    description='Assessment tasks need at least one lesson before they can be created.'
                                >
                                    <div className='space-y-6'>
                                        <div className='space-y-1'>
                                            <p className='text-foreground text-md font-bold'>Assessment builder</p>
                                            <p className='text-muted-foreground text-sm'>
                                                Track quizzes and assignments by lesson, then open the sheet to create or edit one.
                                            </p>
                                        </div>

                                        {isAssessmentsLoading && assessmentItems.length === 0 ? (
                                            <div className='grid gap-4'>
                                                {Array.from({ length: 3 }).map((_, index) => (
                                                    <Card key={index} className='rounded-2xl border-border/70 bg-card/80'>
                                                        <CardContent className='space-y-3 p-5'>
                                                            <Skeleton className='h-5 w-32' />
                                                            <Skeleton className='h-7 w-3/5' />
                                                            <Skeleton className='h-4 w-4/5' />
                                                            <div className='flex gap-2'>
                                                                <Skeleton className='h-8 w-20' />
                                                                <Skeleton className='h-8 w-20' />
                                                                <Skeleton className='h-8 w-20' />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {lessonsWithUuid.map((lesson, index) => {
                                                    const items = assessmentsByLesson.get(lesson.uuid) ?? [];
                                                    const isExpanded = expandedAssessmentLessonIds.includes(lesson.uuid);
                                                    const lessonLabel = lesson.lesson_number ?? index + 1;

                                                    const toggleLesson = () => {
                                                        setExpandedAssessmentLessonIds(prev =>
                                                            prev.includes(lesson.uuid)
                                                                ? prev.filter(id => id !== lesson.uuid)
                                                                : [...prev, lesson.uuid]
                                                        );
                                                    };

                                                    return (
                                                        <Card
                                                            key={lesson.uuid}
                                                            className="overflow-hidden rounded-2xl border-border/70 bg-card/80 shadow-sm transition hover:border-primary/30 hover:shadow-md py-0"
                                                        >
                                                            <CardHeader
                                                                className="bg-muted/30 cursor-pointer border-b border-border/70 pt-4 pb-2"
                                                                onClick={toggleLesson}
                                                            >
                                                                <div className="  flex items-center justify-between gap-4">
                                                                    {/* Lesson info */}
                                                                    <div className="min-w-0 flex-1 space-y-2">
                                                                        <div className="flex flex-wrap items-center gap-2 justify-between">
                                                                            <div className='flex flex-wrap items-center gap-2'>
                                                                                <Badge variant="secondary">
                                                                                    Lesson {lessonLabel}
                                                                                </Badge>

                                                                                <CardTitle className="text-lg">
                                                                                    {lesson.title || 'Untitled lesson'}
                                                                                </CardTitle>
                                                                            </div>

                                                                            {/* Expand indicator */}
                                                                            <div className="shrink-0">
                                                                                {isExpanded ? (
                                                                                    <ChevronUp className="h-5 w-5" />
                                                                                ) : (
                                                                                    <ChevronDown className="h-5 w-5" />
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="w-full min-w-0 line-clamp-2 text-sm text-muted-foreground">
                                                                            {getAssessmentDescription(lesson.description)}
                                                                        </div>


                                                                        {/* Actions */}
                                                                        <div className='flex flex-row flex-wrap items-center justify-between mt-2' >
                                                                            <Badge variant="outline" className='text-[13px]'>
                                                                                {items.length}{' '}
                                                                                {items.length === 1
                                                                                    ? 'assessment added to this lesson'
                                                                                    : 'assessments added to this lesson'}
                                                                            </Badge>
                                                                            <div
                                                                                className="flex flex-wrap gap-2 sef-end justify-end "
                                                                                onClick={e => e.stopPropagation()}
                                                                            >
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        openNewAssessment('Quiz', lesson.uuid)
                                                                                    }
                                                                                >
                                                                                    <PlusCircle className="h-4 w-4" />
                                                                                    Quiz
                                                                                </Button>

                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() =>
                                                                                        openNewAssessment(
                                                                                            'Assignment',
                                                                                            lesson.uuid
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <PlusCircle className="h-4 w-4" />
                                                                                    Assignment
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>

                                                            {isExpanded ? (
                                                                <CardContent className="space-y-3 p-5">
                                                                    {items.length === 0 ? (
                                                                        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                                                                            No assessments have been added to this lesson yet.
                                                                        </div>
                                                                    ) : (
                                                                        items.map(item => (
                                                                            <div
                                                                                key={`${item.kind}-${item.uuid}`}
                                                                                className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4"
                                                                            >
                                                                                <div className="space-y-2">
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <Badge variant="secondary">
                                                                                            {item.kind}
                                                                                        </Badge>

                                                                                        <Badge variant={item.statusTone}>
                                                                                            {item.statusLabel}
                                                                                        </Badge>


                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {item.meta.map(meta => (
                                                                                                <Badge
                                                                                                    key={meta}
                                                                                                    variant="outline"
                                                                                                    className="rounded-full"
                                                                                                >
                                                                                                    {meta}
                                                                                                </Badge>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="space-y-1">
                                                                                        <p className="font-semibold text-foreground">
                                                                                            {item.title}
                                                                                        </p>

                                                                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                                                                            {item.description}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>

                                                                                <div
                                                                                    className="flex flex-row flex-wrap gap-2 items-end justify-end"
                                                                                    onClick={e => e.stopPropagation()}
                                                                                >
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            openAssessmentEditor(item)
                                                                                        }
                                                                                    >
                                                                                        <Pencil className=" h-4 w-4" />
                                                                                    </Button>

                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="destructive"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleDeleteAssessment(item)
                                                                                        }
                                                                                    >
                                                                                        <Trash className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </CardContent>
                                                            ) : null}
                                                        </Card>
                                                    );
                                                })}
                                            </div>

                                        )}

                                        <Sheet open={assessmentSheetOpen} onOpenChange={open => (!open ? closeAssessmentSheet() : setAssessmentSheetOpen(true))}>
                                            <SheetContent
                                                side='right'
                                                className='flex h-full w-full max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl'
                                            >
                                                <SheetHeader className='px-6 pt-6'>
                                                    <SheetTitle className='font-semibold text-xl' >
                                                        {assessmentMode === 'Quiz' ? 'Quiz Builder' : 'Assignment Builder'}
                                                    </SheetTitle>
                                                    <SheetDescription>
                                                        {assessmentMode === 'Quiz'
                                                            ? 'Create or edit quiz questions for the selected lesson.'
                                                            : 'Create or edit assignment details for the selected lesson.'}
                                                    </SheetDescription>
                                                </SheetHeader>

                                                <div className='overflow-y-auto px-6 pb-6'>
                                                    <AssessmentCreation
                                                        key={`${assessmentMode}-${selectedQuizUuid ?? selectedAssignmentUuid ?? 'new'}-${selectedAssessmentLessonId || 'lesson'}`}
                                                        course={courseApiResponse}
                                                        lessons={lessonsResponse?.data}
                                                        lessonContentsMap={lessonContentMap}
                                                        mode={assessmentMode}
                                                        selectedLessonId={selectedAssessmentLessonId}
                                                        selectedLesson={selectedAssessmentLesson}
                                                        setSelectedLessonId={setSelectedAssessmentLessonId}
                                                        setSelectedLesson={setSelectedAssessmentLesson}
                                                        initialQuizUuid={assessmentMode === 'Quiz' ? selectedQuizUuid : null}
                                                        initialAssignmentUuid={
                                                            assessmentMode === 'Assignment' ? selectedAssignmentUuid : null
                                                        }
                                                        onQuizSaved={() => {
                                                            closeAssessmentSheet();
                                                            void refreshAssessmentLists();
                                                        }}
                                                        onQuizDeleted={() => {
                                                            closeAssessmentSheet();
                                                            void refreshAssessmentLists();
                                                        }}
                                                        onAssignmentSaved={() => {
                                                            closeAssessmentSheet();
                                                            void refreshAssessmentLists();
                                                        }}
                                                        onAssignmentDeleted={() => {
                                                            closeAssessmentSheet();
                                                            void refreshAssessmentLists();
                                                        }}
                                                    />
                                                </div>
                                            </SheetContent>
                                        </Sheet>
                                        <StepNav
                                            previousLabel='Previous step'
                                            nextLabel='Next step'
                                            onPrevious={() => setStep(2)}
                                            onNext={() => setStep(4)}
                                        />
                                    </div>
                                </SectionGuard>
                            ) : step === 4 ? (
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Assessment structure and grading become available after the course exists.'
                                >
                                    <div className='space-y-10'>
                                        <CriteriaCreationForm course={courseApiResponse} />
                                        <CourseGradingSection course={courseApiResponse} />
                                    </div>
                                    <StepNav
                                        previousLabel='Previous step'
                                        nextLabel='Next step'
                                        onPrevious={() => setStep(3)}
                                        onNext={() => setStep(5)}
                                    />
                                </SectionGuard>
                            ) : (
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Branding and pricing are available after the course is created.'
                                >
                                    <div className='space-y-10'>
                                        <CourseBrandingForm
                                            ref={brandingFormRef}
                                            showSubmitButton={false}
                                            courseId={resolvedCourseId || undefined}
                                            editingCourseId={resolvedCourseId || undefined}
                                            initialValues={courseInitialValues}
                                            nextStepAfterSave={5}
                                        />
                                        <CoursePricingForm
                                            ref={pricingFormRef}
                                            showSubmitButton={false}
                                            courseId={resolvedCourseId || undefined}
                                            editingCourseId={resolvedCourseId || undefined}
                                            initialValues={courseInitialValues}
                                        />
                                    </div>
                                    <StepNav
                                        previousLabel='Previous step'
                                        nextLabel='Save and finish'
                                        onPrevious={() => setStep(4)}
                                        onNext={() => void handleSaveBrandingAndPricing()}
                                        nextDisabled={isSavingBrandingPricing}
                                        nextLoading={isSavingBrandingPricing}
                                    />
                                </SectionGuard>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DeleteModal
                open={Boolean(assessmentToDelete)}
                setOpen={open => {
                    if (!open) {
                        setAssessmentToDelete(null);
                    }
                }}
                title={`Delete ${assessmentToDelete?.kind ?? 'Assessment'}?`}
                description={`This will permanently remove the selected ${assessmentToDelete?.kind?.toLowerCase() ?? 'assessment'} from the course.`}
                onConfirm={() => void confirmAssessmentDelete()}
                isLoading={deleteQuizMut.isPending || deleteAssignmentMut.isPending}
                confirmText={`Delete ${assessmentToDelete?.kind ?? 'Assessment'}`}
            />
        </main>
    );
}
