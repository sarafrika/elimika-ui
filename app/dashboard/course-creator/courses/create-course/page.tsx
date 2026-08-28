'use client';

import { LessonContentViewerDialog } from '@/components/content-preview/LessonContentPreview';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreator } from '@/context/course-creator-context';
import {
    deleteLessonContentMutation,
    getCourseByUuidOptions,
    getCourseLessonsOptions,
    getLessonContentOptions,
    getLessonContentQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type {
    ApiResponseCourse,
    Course,
    Lesson,
    LessonContent,
    PagedDtoLesson,
} from '@/services/client/types.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Sparkles, Trash } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import DeleteModal from '../../../../../components/custom-modals/delete-modal';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import AssessmentCreationForm from '../../_components/assessment-creation-form';
import CourseBrandingForm from '../../_components/course-branding-form';
import { CourseCreationForm } from '../../_components/course-creation-form';
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
import { Stepper } from './stepper';


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

const CONTENT_TYPE_OPTIONS: ContentType[] = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'PDF'];

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
                    Add Lesson
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
                                    content_type: (editingContent.content_type_key ?? 'TEXT').toUpperCase(),
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
    const [requirementDrafts, setRequirementDrafts] = useState(createEmptyDraftsByProvider());
    const [activeRequirementProvider, setActiveRequirementProvider] =
        useState<Provider | null>(null);
    const [assessmentSheetOpen, setAssessmentSheetOpen] = useState(false);
    const [selectedPracticeLessonId, setSelectedPracticeLessonId] = useState<string>('');
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

    const canRenderCourseSections = Boolean(resolvedCourseId && courseApiResponse);

    if (creator.isLoading) {
        return <CourseCreatorLoadingState headline='Preparing the standalone course workspace…' />;
    }

    if (!creator.profile) {
        return <CourseCreatorEmptyState />;
    }

    return (
        <main className='mx-auto w-full space-y-6 px-4 py-6 lg:px-6'>
            <Link
                href='/dashboard/course-creator/course-management/all?type=courses'
                className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
            >
                <ArrowLeft className='h-4 w-4' /> Back to my courses
            </Link>

            <PageHeader
                eyebrow='Program Creator'
                title={resolvedCourseId ? course?.name! : 'Create New Course'}
                description={
                    resolvedCourseId
                        ? 'Update this courses, including its lesson, contents, requirements, assessments, pricing and learning outcomes.'
                        : 'Build a high-quality course and empower students to learn new skills.'
                }
                action={
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
                }
            />

            <div className='space-y-6'>
                <Stepper step={step} onStep={setStep} />

                <Card className='min-h-[calc(100vh-18rem)] rounded-2xl'>
                    <CardContent className='flex flex-col gap-10'>
                        <div className='grow'>
                            {step === 0 ? (
                                <CourseCreationForm
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
                            ) : step === 1 ? (
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Lesson creation becomes available once the course has been saved.'
                                >
                                    <LessonContentStack
                                        courseId={resolvedCourseId}
                                        lessons={lessonsWithUuid}
                                        lessonContentsMap={lessonContentMap}
                                        isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    />
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
                                    </div>
                                </SectionGuard>
                            ) : step === 3 ? (
                                <SectionGuard
                                    isReady={canRenderCourseSections && lessonsWithUuid.length > 0}
                                    isLoading={Boolean(resolvedCourseId) && lessonsLoading}
                                    title='Add lessons first'
                                    description='Assessment tasks need at least one lesson before they can be created.'
                                >
                                    <div className='space-y-4'>
                                        <div className='flex items-center justify-between gap-3'>
                                            <div className='space-y-1'>
                                                <p className='text-foreground text-sm font-medium'>Assessment builder</p>
                                                <p className='text-muted-foreground text-sm'>
                                                    Create or edit quizzes and assignments without leaving this page.
                                                </p>
                                            </div>
                                            <Button type='button' onClick={() => setAssessmentSheetOpen(true)}>
                                                Open assessment sheet
                                            </Button>
                                        </div>

                                        <Sheet open={assessmentSheetOpen} onOpenChange={setAssessmentSheetOpen}>
                                            <SheetContent side='right'
                                                className='flex h-full w-full max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl'
                                            >
                                                <SheetHeader className='space-y-2'>
                                                    <SheetTitle>Assessment Tasks</SheetTitle>
                                                    <SheetDescription>
                                                        Manage quizzes and assignments for every lesson from a right-side sheet.
                                                    </SheetDescription>
                                                </SheetHeader>

                                                <div className='mt-6'>
                                                    <AssessmentCreationForm
                                                        course={courseApiResponse}
                                                        lessons={lessonsResponse?.data}
                                                        lessonContentsMap={lessonContentMap}
                                                    />
                                                </div>
                                            </SheetContent>
                                        </Sheet>
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
                                            showSubmitButton
                                            courseId={resolvedCourseId || undefined}
                                            editingCourseId={resolvedCourseId || undefined}
                                            initialValues={courseInitialValues}
                                            nextStepAfterSave={5}
                                        />
                                        <CoursePricingForm
                                            showSubmitButton
                                            courseId={resolvedCourseId || undefined}
                                            editingCourseId={resolvedCourseId || undefined}
                                            initialValues={courseInitialValues}
                                        />
                                    </div>
                                </SectionGuard>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
