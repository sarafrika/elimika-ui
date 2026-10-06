'use client';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseCreator } from '@/context/course-creator-context';
import {
    deleteAssignmentMutation,
    deleteQuizMutation,
    getCourseAssessmentsOptions,
    getCourseAssessmentsQueryKey,
    getCourseByUuidOptions,
    getCourseByUuidQueryKey,
    getCourseLessonsOptions,
    getCourseLessonsQueryKey,
    getLessonContentOptions,
    publishCourseMutation,
    searchAssignmentsOptions,
    searchQuizzesOptions,
    unpublishCourseMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
    ApiResponseCourse,
    Assignment,
    Course,
    CourseAssessment,
    Lesson,
    LessonContent,
    PagedDtoLesson,
    Quiz,
} from '@/services/client/types.gen';
import { CoursePrerequisitesEditor } from '@/src/features/course-prerequisites/course-prerequisites-editor';
import { CourseSkillsEditor } from '@/src/features/course-skills/course-skills-editor';
import { invalidateContentModerationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { skipToken, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Eye, Pencil, PlusCircle, Sparkles, Trash, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import DeleteModal from '../../../../../components/custom-modals/delete-modal';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import { AssignmentPreviewSheet } from '../../_components/AssignmentPreviewSheet';
import CourseBrandingForm from '../../_components/course-branding-form';
import {
    CourseCreationForm,
    type CourseFormRef,
} from '../../_components/course-creation-form';
import type { CourseCreationFormValues } from '../../_components/course-creation-types';
import { CourseEvaluationSection } from '../../_components/course-evaluation-section';
import CourseGradingSection from '../../_components/course-grading-section';
import { CoursePricingForm } from '../../_components/course-pricing-form';
import {
    getCoursePublishReadiness,
} from '../../_components/course-publish-readiness';
import CriteriaCreationForm from '../../_components/criteria-creation-form';
import { LessonContentStack } from '../../_components/lesson-content-stack';
import {
    CourseCreatorEmptyState,
    CourseCreatorLoadingState,
} from '../../_components/loading-state';
import { PracticeActivityManager } from '../../_components/practice-activity-management';
import { QuizPreviewSheet } from '../../_components/QuizPreviewSheet';
import {
    createEmptyDraftsByProvider,
    type Provider,
} from '../../_components/training-requirement-section';
import AssessmentCreation from './assessment-creation';

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
    nextLoadingLabel?: string;
};

function StepNav({
    previousLabel,
    nextLabel,
    onPrevious,
    onNext,
    previousDisabled,
    nextDisabled,
    nextLoading,
    nextLoadingLabel = 'Saving...',
}: StepNavProps) {
    return (
        <div className='flex flex-wrap items-center justify-between gap-3 pt-6'>
            <Button type='button' variant='outline' onClick={onPrevious} disabled={previousDisabled}>
                {previousLabel}
            </Button>
            <Button type='button' onClick={onNext} disabled={nextDisabled}>
                {nextLoading ? <><Spinner className='h-4 w-4' /> {nextLoadingLabel}</> : nextLabel}
            </Button>
        </div>
    );
}


type CourseLesson = Lesson & { uuid: string };
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

const COURSE_TABS = ['setup', 'lessons', 'practice', 'assignments', 'assessment', 'evaluation', 'branding', 'pricing', 'skills'];

const mapCourseValues = (course?: Course | null): Partial<CourseCreationFormValues> | undefined => {
    if (!course) return undefined;

    return {
        name: course.name || '',
        course_code: course.course_code ?? '',
        pass_mark: course.pass_mark ?? '',
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


export default function CreateCoursePage() {
    const creator = useCourseCreator();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(0);
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
    const [isSavingSection, setIsSavingSection] = useState(false);
    const [finishedPricingCourseId, setFinishedPricingCourseId] = useState<string | null>(null);
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
    const [assessmentToPreview, setAssessmentToPreview] = useState<AssessmentListItem | null>(null);
    const courseFormRef = useRef<CourseFormRef>(null);
    const brandingFormRef = useRef<SaveableCourseFormRef>(null);
    const pricingFormRef = useRef<SaveableCourseFormRef>(null);
    const searchParams = useSearchParams();
    const queryCourseId = searchParams.get('id');

    const resolvedCourseId = queryCourseId || createdCourseId;
    const hasFinishedPricing = Boolean(resolvedCourseId && finishedPricingCourseId === resolvedCourseId);
    const handlePricingChange = useCallback(() => setFinishedPricingCourseId(null), []);

    const navigateToStep = useCallback((nextStep: number) => {
        if (nextStep === 1 && !resolvedCourseId) {
            toast.error('Save the course details to add lessons.');
            return;
        }
        setStep(nextStep);
    }, [resolvedCourseId]);

    const courseQuery = resolvedCourseId
        ? getCourseByUuidOptions({ path: { uuid: resolvedCourseId } })
        : null;
    const { data: courseResponse, isLoading: courseLoading } = useQuery({
        ...(courseQuery ?? {
            queryKey: getCourseByUuidQueryKey({ path: { uuid: resolvedCourseId ?? '' } }),
            queryFn: skipToken,
        }),
        enabled: Boolean(resolvedCourseId),
        staleTime: 60_000,
    });

    const course = (courseResponse?.data ?? null) as Course | null;
    const courseInitialValues = useMemo(() => mapCourseValues(course), [course]);
    const courseApiResponse = courseResponse as ApiResponseCourse | undefined;

    const handleSaveSection = useCallback(async (section: 'branding' | 'pricing') => {
        if (isSavingSection) return;

        setIsSavingSection(true);

        try {
            const formRef = section === 'branding' ? brandingFormRef : pricingFormRef;
            const saved = await formRef.current?.submit();
            if (saved && section === 'branding') setStep(7);
            if (saved && section === 'pricing') setFinishedPricingCourseId(resolvedCourseId);
        } finally {
            setIsSavingSection(false);
        }
    }, [isSavingSection, resolvedCourseId]);

    const lessonsQuery = resolvedCourseId
        ? getCourseLessonsOptions({
            path: { courseUuid: resolvedCourseId },
            query: { pageable: { page: 0, size: 100 } },
        })
        : null;
    const { data: lessonsResponse, isLoading: lessonsLoading, isError: lessonsError, refetch: refetchLessons } = useQuery({
        ...(lessonsQuery ?? {
            queryKey: getCourseLessonsQueryKey({ path: { courseUuid: resolvedCourseId ?? '' }, query: { pageable: { page: 0, size: 100 } } }),
            queryFn: skipToken,
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

    const courseAssessmentsQuery = resolvedCourseId
        ? getCourseAssessmentsOptions({
            path: { courseUuid: resolvedCourseId },
            query: { pageable: {} },
        })
        : null;
    const { data: courseAssessmentsResponse } = useQuery({
        ...(courseAssessmentsQuery ?? {
            queryKey: getCourseAssessmentsQueryKey({ path: { courseUuid: resolvedCourseId ?? '' }, query: { pageable: {} } }),
            queryFn: skipToken,
        }),
        enabled: Boolean(resolvedCourseId),
        staleTime: 60_000,
    });
    const courseAssessments = useMemo(
        () =>
            (courseAssessmentsResponse?.data?.content ?? []).filter(
                (assessment): assessment is CourseAssessment => Boolean(assessment?.uuid)
            ),
        [courseAssessmentsResponse]
    );

    const lessonContentQueries = useQueries({
        queries: resolvedCourseId ? lessonsWithUuid.map(lesson => {
            const options = getLessonContentOptions({
                path: { courseUuid: resolvedCourseId, lessonUuid: lesson.uuid },
            });

            return {
                ...options,
                enabled: Boolean(resolvedCourseId && lesson.uuid),
                staleTime: 60_000,
            };
        }) : [],
    });

    const lessonContentMap = useMemo(() => {
        const map = new Map<string, LessonContent[]>();

        lessonsWithUuid.forEach((lesson, index) => {
            const response = lessonContentQueries[index]?.data;
            const contents = response?.error || response?.success === false ? [] : response?.data ?? [];
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

            return quizzes.map((quiz: Quiz) => {
                const isQuizPublished =
                    quiz.is_published === true ||
                    quiz.active === true ||
                    String(quiz.status).toUpperCase() === 'PUBLISHED';

                return {
                    kind: 'Quiz' as const,
                    uuid: quiz.uuid ?? '',
                    lessonUuid: lesson.uuid,
                    lessonTitle: lessonMeta?.title ?? lesson.title ?? 'Untitled lesson',
                    lessonOrder: lessonMeta?.order ?? index,
                    title: quiz.title || 'Untitled quiz',
                    description: getAssessmentDescription(
                        quiz.description ?? quiz.instructions ?? ''
                    ),
                    statusLabel: isQuizPublished ? 'Published' : 'Draft',
                    statusTone: getAssessmentStatusTone(undefined, isQuizPublished),
                    meta: [
                        `Pass ${quiz.passing_score ?? 0}%`,
                        `Attempts ${quiz.attempts_allowed ?? 1}`,
                        quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No time limit',
                    ],
                };
            });
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

    const lessonAssessmentCounts = useMemo(() => {
        const counts = new Map<string, number>();

        lessonsWithUuid.forEach((lesson, index) => {
            const quizCount = assessmentQueries[index]?.data?.data?.content?.length ?? 0;
            const assignmentCount = assignmentQueries[index]?.data?.data?.content?.length ?? 0;
            counts.set(lesson.uuid, quizCount + assignmentCount);
        });

        return counts;
    }, [assessmentQueries, assignmentQueries, lessonsWithUuid]);

    const publishReadiness = getCoursePublishReadiness({
        course,
        structure: {
            lessons: lessonsWithUuid,
            lessonContentMap,
            lessonAssessmentCounts,
            assessments: courseAssessments,
        },
    });

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

    const openAssessmentPreview = useCallback(
        (item: AssessmentListItem) => {
            if (item.uuid) setAssessmentToPreview(item);
        },
        []
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

    const PublishCourse = useMutation(publishCourseMutation());
    const UnpublishCourse = useMutation(unpublishCourseMutation());
    const isPublished = course?.is_published === true;
    const isCourseActionPending = PublishCourse.isPending || UnpublishCourse.isPending;
    const [isUpdatingPublication, setIsUpdatingPublication] = useState(false);
    const publicationDisabled = isCourseActionPending || isUpdatingPublication || isSavingSection || !resolvedCourseId;
    const publicationLoadingLabel = isPublished ? 'Unpublishing...' : 'Publishing...';
    const handleSaveDraft = useCallback(() => {
        courseFormRef.current?.submit();
    }, []);

    const handlePublishCourse = useCallback(async () => {
        if (publicationDisabled || isPublished) return;

        if (!resolvedCourseId) {
            toast.error('Save the draft before publishing.');
            return;
        }

        if (!publishReadiness.canPublish) {
            publishReadiness.missingFields.forEach(message => {
                toast.error(message);
            });
            return;
        }

        setIsUpdatingPublication(true);
        try {
            const data = await PublishCourse.mutateAsync({
                path: { uuid: resolvedCourseId },
            });

            if (data.error || data.success === false) {
                toast.error(data.message || 'Failed to publish course.');
                return;
            }

            toast.success(data.message || 'Course published successfully.');
            await invalidateContentModerationWorkflowQueries(queryClient);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to publish course.');
        } finally {
            setIsUpdatingPublication(false);
        }
    }, [PublishCourse, isPublished, publicationDisabled, publishReadiness, queryClient, resolvedCourseId]);

    const handleUnpublishCourse = useCallback(async () => {
        if (!resolvedCourseId || !isPublished || publicationDisabled) return;

        setIsUpdatingPublication(true);
        try {
            const data = await UnpublishCourse.mutateAsync({
                path: { uuid: resolvedCourseId },
            });
            if (data.error || data.success === false) {
                toast.error(data.message || 'Failed to unpublish course.');
                return;
            }

            toast.success(data.message || 'Course unpublished successfully.');
            await invalidateContentModerationWorkflowQueries(queryClient);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to unpublish course.');
        } finally {
            setIsUpdatingPublication(false);
        }
    }, [UnpublishCourse, isPublished, publicationDisabled, queryClient, resolvedCourseId]);


    if (creator.isLoading) {
        return <CourseCreatorLoadingState headline='Preparing the standalone course workspace…' />;
    }

    if (!creator.profile) {
        return <CourseCreatorEmptyState />;
    }

    return (
        <main className='mx-auto w-full space-y-4 px-4 py-6 lg:px-6'>
            <div className='flex flex-row items-center justify-between' >
                <Link
                    href='/dashboard/course-creator/course-management'
                    className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
                >
                    <ArrowLeft className='h-4 w-4' /> Back to my courses
                </Link>

                <div className='flex flex-wrap items-center gap-2'>
                    <Button
                        type='button'
                        className='px-4 rounded-sm'
                        variant='outline'
                        onClick={handleSaveDraft}
                    >
                        Save Draft
                    </Button>

                    <Button
                        type='button'
                        className='rounded-sm px-4'
                        variant={isPublished ? 'outline' : 'default'}
                        onClick={isPublished ? handleUnpublishCourse : handlePublishCourse}
                        disabled={publicationDisabled}
                        title={
                            !resolvedCourseId
                                ? 'Save the draft before publishing.'
                                : isPublished ? 'Unpublish this course' : publishReadiness.missingFields.join(' • ')
                        }
                    >
                        {isCourseActionPending || isUpdatingPublication ? (
                            <>
                                <Spinner className='h-4 w-4' />
                                {publicationLoadingLabel}
                            </>
                        ) : (
                            <>
                                {isPublished ? <Undo2 className='h-4 w-4' /> : <Sparkles className='h-4 w-4' />}
                                {isPublished ? 'Unpublish' : 'Publish'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <PageHeader
                eyebrow=''
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

            <Tabs
                value={COURSE_TABS[step]}
                onValueChange={value => {
                    const nextStep = COURSE_TABS.indexOf(value);
                    if (nextStep >= 0) navigateToStep(nextStep);
                }}
                className='gap-6'
            >
                <TabsList className='flex h-auto w-full flex-wrap justify-start'>
                    <TabsTrigger className='max-w-fit px-4' value='setup'>Course set-up</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='lessons'>Lesson content</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='practice'>Practice</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='assignments'>Assignments</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='assessment'>Assessment</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='evaluation'>Evaluation</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='branding'>Branding</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='pricing'>Pricing</TabsTrigger>
                    <TabsTrigger className='max-w-fit px-4' value='skills'>Skills &amp; prerequisites</TabsTrigger>
                </TabsList>

                <section className='min-h-[calc(100vh-18rem)] rounded-2xl border-0 p-0 px-0'>
                    <section className='flex flex-col gap-10'>
                        <div className='grow'>
                            <TabsContent value='setup'>
                                {resolvedCourseId && courseLoading ? (
                                    <CourseCreatorLoadingState headline='Loading your course details…' />
                                ) : (
                                    <Card className='space-y-6'>
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
                                            onNext={() => navigateToStep(step + 1)}
                                        />
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value='lessons'>
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Lesson creation becomes available once the course has been saved.'
                                >
                                    <Card className='p-6 space-y-6'>
                                        <LessonContentStack
                                            courseId={resolvedCourseId}
                                            lessons={lessonsWithUuid}
                                            lessonContentsMap={lessonContentMap}
                                            isLoading={lessonsLoading || lessonContentQueries.some(query => query.isPending)}
                                            loadError={lessonContentQueries.some(query => (query.isError && !query.data) || !!query.data?.error || query.data?.success === false)}
                                            onRetry={() => { lessonContentQueries.forEach(query => void query.refetch()); }}
                                        />

                                        <StepNav
                                            previousLabel='Previous step'
                                            nextLabel='Next step'
                                            onPrevious={() => setStep(0)}
                                            onNext={() => navigateToStep(step + 1)}
                                        />
                                    </Card>
                                </SectionGuard>
                            </TabsContent>

                            <TabsContent value='practice'>
                                <SectionGuard
                                    isReady={canRenderCourseSections && lessonsWithUuid.length > 0}
                                    isLoading={Boolean(resolvedCourseId) && lessonsLoading}
                                    title='Add lessons first'
                                    description='Practice activities are available after at least one lesson exists.'
                                >
                                    <Card className='space-y-6 p-6'>
                                        <div>
                                            <p className='text-[15px] font-semibold'>Class Practice Activities</p>
                                            <p className='text-muted-foreground text-xs'>
                                                Manage reusable class practice activities tied to this skill.
                                            </p>
                                        </div>

                                        <div className='space-y-8'>
                                            {[...lessonsWithUuid]
                                                .sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0))
                                                .map((lesson, index) => (
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
                                            onPrevious={() => navigateToStep(1)}
                                            onNext={() => navigateToStep(step + 1)}
                                        />
                                    </Card>
                                </SectionGuard>
                            </TabsContent>

                            <TabsContent value='assignments'>
                                <SectionGuard
                                    isReady={canRenderCourseSections && lessonsWithUuid.length > 0}
                                    isLoading={Boolean(resolvedCourseId) && lessonsLoading}
                                    title='Add lessons first'
                                    description='Assessment tasks need at least one lesson before they can be created.'
                                >
                                    <Card className='space-y-6 p-6'>
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
                                                {[...lessonsWithUuid]
                                                    .sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0))
                                                    .map((lesson, index) => {
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
                                                                            items.map(item => {
                                                                                const isDraft = item.statusLabel === 'Draft';

                                                                                return (
                                                                                    <div
                                                                                        key={`${item.kind}-${item.uuid}`}
                                                                                        className={`flex flex-col gap-4 rounded-xl border p-4 ${isDraft
                                                                                            ? 'border-destructive/30 bg-destructive/5'
                                                                                            : 'border-border bg-muted/40'
                                                                                            }`}
                                                                                    >
                                                                                        <div className='space-y-2'>
                                                                                            <div className='flex flex-wrap items-center gap-2'>
                                                                                                <Badge variant='secondary'>{item.kind}</Badge>

                                                                                                <Badge variant={item.statusTone}>{item.statusLabel}</Badge>

                                                                                                <div className='flex flex-wrap gap-2'>
                                                                                                    {item.meta.map(meta => (
                                                                                                        <Badge
                                                                                                            key={meta}
                                                                                                            variant='outline'
                                                                                                            className='rounded-full'
                                                                                                        >
                                                                                                            {meta}
                                                                                                        </Badge>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className='space-y-1'>
                                                                                                <p className='font-semibold text-foreground'>{item.title}</p>

                                                                                                <p className='line-clamp-2 text-sm text-muted-foreground'>
                                                                                                    {item.description}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div
                                                                                            className='flex flex-row flex-wrap items-end justify-end gap-2'
                                                                                            onClick={e => e.stopPropagation()}
                                                                                        >
                                                                                            <Button
                                                                                                type='button'
                                                                                                variant='outline'
                                                                                                size='sm'
                                                                                                onClick={() => openAssessmentPreview(item)}
                                                                                                aria-label={`Preview ${item.kind.toLowerCase()}: ${item.title}`}
                                                                                                title='View assessment'
                                                                                            >
                                                                                                <Eye className='h-4 w-4' />
                                                                                            </Button>

                                                                                            <Button
                                                                                                type='button'
                                                                                                variant='outline'
                                                                                                size='sm'
                                                                                                onClick={() => openAssessmentEditor(item)}
                                                                                            >
                                                                                                <Pencil className='h-4 w-4' />
                                                                                            </Button>

                                                                                            <Button
                                                                                                type='button'
                                                                                                variant='destructive'
                                                                                                size='sm'
                                                                                                onClick={() => handleDeleteAssessment(item)}
                                                                                            >
                                                                                                <Trash className='h-4 w-4' />
                                                                                            </Button>
                                                                                        </div>

                                                                                        {isDraft && (
                                                                                            <div className='border-t border-destructive/20 pt-3 text-sm font-medium text-destructive'>
                                                                                                This {item.kind.toLowerCase()} is currently in draft and will not be
                                                                                                visible to users until it is published.
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </CardContent>
                                                                ) : null}
                                                            </Card>
                                                        );
                                                    })}
                                            </div>
                                        )}

                                        {assessmentToPreview?.kind === 'Quiz' && (
                                            <QuizPreviewSheet
                                                key={assessmentToPreview.uuid}
                                                open
                                                onOpenChange={open => { if (!open) setAssessmentToPreview(null); }}
                                                quizUuid={assessmentToPreview.uuid}
                                                lessonTitle={assessmentToPreview.lessonTitle}
                                            />
                                        )}
                                        {assessmentToPreview?.kind === 'Assignment' && (
                                            <AssignmentPreviewSheet
                                                key={assessmentToPreview.uuid}
                                                open
                                                onOpenChange={open => { if (!open) setAssessmentToPreview(null); }}
                                                assignmentUuid={assessmentToPreview.uuid}
                                                lessonTitle={assessmentToPreview.lessonTitle}
                                            />
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
                                    </Card>
                                </SectionGuard>
                            </TabsContent>

                            <TabsContent value='assessment'>
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Assessment structure becomes available after the course exists.'
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
                            </TabsContent>

                            <TabsContent value='evaluation' className='m-0 flex flex-col gap-4'>
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Evaluation criteria become available after the course exists.'
                                >
                                    {resolvedCourseId && (
                                        <CourseEvaluationSection
                                            key={resolvedCourseId}
                                            courseUuid={resolvedCourseId}
                                            courseCreatorUuid={creator.profile.uuid}
                                            associatedBy={creator.data.userUuid ?? undefined}
                                            lessons={lessonsWithUuid}
                                            lessonsLoading={lessonsLoading}
                                            lessonsError={lessonsError || Boolean(lessonsResponse?.error) || lessonsResponse?.success === false}
                                            onRetryLessons={() => void refetchLessons()}
                                        />
                                    )}
                                    <StepNav
                                        previousLabel='Previous step'
                                        nextLabel='Next step'
                                        onPrevious={() => setStep(4)}
                                        onNext={() => setStep(6)}
                                    />
                                </SectionGuard>
                            </TabsContent>

                            <TabsContent value='branding'>
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Branding is available after the course is created.'
                                >
                                    <Card className='max-w-5xl p-6'>
                                        <CourseBrandingForm
                                            ref={brandingFormRef}
                                            showSubmitButton={false}
                                            courseId={resolvedCourseId || undefined}
                                            editingCourseId={resolvedCourseId || undefined}
                                            initialValues={courseInitialValues}
                                            nextStepAfterSave={7}
                                        />
                                    </Card>
                                    <StepNav
                                        previousLabel='Previous step'
                                        nextLabel='Save and continue'
                                        onPrevious={() => setStep(5)}
                                        onNext={() => void handleSaveSection('branding')}
                                        nextDisabled={isSavingSection}
                                        nextLoading={isSavingSection}
                                    />
                                </SectionGuard>
                            </TabsContent>

                            <TabsContent value='pricing'>
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Pricing is available after the course is created.'
                                >
                                    <Card className='max-w-5xl p-6'>
                                        <CoursePricingForm
                                            ref={pricingFormRef}
                                            onValuesChange={handlePricingChange}
                                            showSubmitButton={false}
                                            courseId={resolvedCourseId || undefined}
                                            editingCourseId={resolvedCourseId || undefined}
                                            initialValues={courseInitialValues}
                                        />
                                    </Card>

                                    <StepNav
                                        previousLabel='Previous step'
                                        nextLabel={hasFinishedPricing ? (isPublished ? 'Unpublish' : 'Publish') : 'Save and finish'}
                                        onPrevious={() => setStep(6)}
                                        onNext={hasFinishedPricing
                                            ? (isPublished ? handleUnpublishCourse : handlePublishCourse)
                                            : () => void handleSaveSection('pricing')}
                                        nextDisabled={publicationDisabled}
                                        nextLoading={isSavingSection || isCourseActionPending || isUpdatingPublication}
                                        nextLoadingLabel={isSavingSection ? 'Saving...' : publicationLoadingLabel}
                                    />
                                </SectionGuard>
                            </TabsContent>

                            <TabsContent value='skills'>
                                <SectionGuard
                                    isReady={canRenderCourseSections}
                                    isLoading={Boolean(resolvedCourseId) && courseLoading}
                                    title='Save the course first'
                                    description='Skills and prerequisites are available after the course is created.'
                                >
                                    {resolvedCourseId ? (
                                        <div className='grid max-w-5xl gap-6'>
                                            <CourseSkillsEditor courseUuid={resolvedCourseId} />
                                            <CoursePrerequisitesEditor
                                                courseUuid={resolvedCourseId}
                                                isLive={course?.admin_approved === true && course?.is_published === true}
                                            />
                                        </div>
                                    ) : null}
                                    <StepNav
                                        previousLabel='Previous step'
                                        nextLabel='Back to set-up'
                                        onPrevious={() => setStep(7)}
                                        onNext={() => setStep(0)}
                                    />
                                </SectionGuard>
                            </TabsContent>
                        </div>
                    </section>
                </section>
            </Tabs>

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
