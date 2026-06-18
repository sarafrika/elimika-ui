"use client";

import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import type {
    Assignment,
    Course,
    ProgramReview,
    Quiz,
    TrainingProgram
} from '@/services/client';
import {
    getAllAssignmentsOptions,
    getAllDifficultyLevelsOptions,
    getAllQuizzesOptions,
    getClassDefinitionsForInstructorOptions,
    getInstructorRatingSummaryOptions,
    getProgramCoursesOptions,
    getProgramReviewsOptions,
    getProgramReviewsQueryKey,
    getTrainingProgramByUuidOptions,
    submitInstructorReviewMutation,
    submitProgramReviewMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { EnrollmentLoadingState } from '@/src/features/dashboard/courses/components/EnrollmentLoadingState';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    BadgeCheck,
    BookOpen,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    FileCheck,
    Globe,
    GraduationCap,
    Heart,
    Infinity as InfinityIcon,
    Layers3,
    MonitorPlay,
    MoveRight,
    Play,
    Share2,
    Shield,
    Star,
    User2,
    Users,
    Wrench
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { QuizContentPreview } from '../../../../../../components/content-preview/QuizContentPreview';
import HTMLTextPreview from '../../../../../../components/editors/html-text-preview';
import { LinkShareCard } from '../../../../../../components/shared/link-share-card';
import { Button } from '../../../../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../../../../../components/ui/dialog';
import { useUserProfile } from '../../../../../../context/profile-context';
import { CombinedClassDetailsData } from '../../../../../../hooks/use-class-details';
import { useCourseEnrollmentsMap } from '../../../../../../hooks/use-enrollment-map';
import { buildSocialShareUrl, openShareWindow } from '../../../../../../lib/share';
import { socialShareActions } from '../../../../@instructor/classes/overview/[id]/page';
import { CourseTrainingRequirements } from '../../../../_components/course-training-requirements';
import { FeedbackDialog } from '../../../../_components/review-instructor-modal';
import CourseFaq from './CourseFaq';
import ClassCourseTabNav from './CourseTabNav';
import ShareClassCourse, { ShareClass } from './ShareClassCourse';

// ════════════════════════════════════════════════════════════════════════
// Shared types
// ════════════════════════════════════════════════════════════════════════

export type LessonContentItem = {
    lesson: {
        uuid?: string;
        title: string;
        description?: string | null;
        lesson_number?: number;
    };
    content?: {
        data?: Array<{
            uuid?: string;
            title: string;
            file_size_display?: string | null;
            description?: string | null;
        }>;
    };
};

export type LessonsByCourse = Record<string, LessonContentItem[]>;

// ════════════════════════════════════════════════════════════════════════
// Reusable helper: aggregate useCourseLessonsWithContent across N courses
// ════════════════════════════════════════════════════════════════════════
//
// useCourseLessonsWithContent is a hook, so it can never be called inside
// a .map() over a dynamic list of course uuids — the number of hook calls
// would change whenever the course list changes, breaking the rules of
// hooks. Instead, each course uuid gets its own tiny invisible "runner"
// component that calls the hook exactly once and reports the result up to
// a parent aggregator via a stable callback. Because each runner is its
// own component instance (keyed by uuid), React can safely mount/unmount
// runners as the course list changes without violating hook rules.

type RunnerState = {
    lessons: LessonContentItem[];
    isLoading: boolean;
    isFetching: boolean;
};

/**
 * useCourseLessonsWithContent rebuilds its `lessons` array on every render
 * (it derives from useQueries, which always returns a fresh array
 * reference even when the underlying data hasn't changed). Using that
 * array directly as a useEffect dependency below would re-fire the effect
 * every render, which calls onChange -> setState in the parent -> re-render
 * -> new array reference -> effect fires again -> infinite loop.
 *
 * To break the cycle, we derive a small stable "signature" string from the
 * actual lesson/content data and only forward it to the parent when that
 * signature changes, ignoring reference identity entirely.
 */
function getLessonsSignature(lessons: LessonContentItem[]): string {
    return lessons
        .map(item => `${item.lesson?.uuid ?? ''}:${item.content?.data?.length ?? 0}`)
        .join('|');
}

function CourseLessonsRunner({
    courseUuid,
    onChange,
}: {
    courseUuid: string;
    onChange: (uuid: string, state: RunnerState) => void;
}) {
    const { isLoading, isFetching, lessons } = useCourseLessonsWithContent({
        courseUuid,
    });

    const typedLessons = (lessons ?? []) as LessonContentItem[];
    const signature = useMemo(() => getLessonsSignature(typedLessons), [typedLessons]);

    useEffect(() => {
        onChange(courseUuid, {
            lessons: typedLessons,
            isLoading: Boolean(isLoading),
            isFetching: Boolean(isFetching),
        });
        // typedLessons is intentionally excluded: it's a new array reference
        // every render, so we depend on `signature` (content-based) plus the
        // loading flags instead, to avoid re-firing on reference changes alone.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseUuid, signature, isLoading, isFetching, onChange]);

    return null;
}

/**
 * Render-prop component that aggregates lesson+content data across every
 * course bundled in a program.
 *
 * Usage:
 *   <AggregatedCourseLessons courseUuids={courseUuids}>
 *     {({ lessonsByCourse, isLoading }) => (...)}
 *   </AggregatedCourseLessons>
 */
function AggregatedCourseLessons({
    courseUuids,
    children,
}: {
    courseUuids: string[];
    children: (result: {
        lessonsByCourse: LessonsByCourse;
        isLoading: boolean;
        isFetching: boolean;
    }) => React.ReactNode;
}) {
    const [stateByUuid, setStateByUuid] = useState<Record<string, RunnerState>>({});

    const handleChange = useCallback((uuid: string, state: RunnerState) => {
        setStateByUuid(prev => {
            const existing = prev[uuid];
            const sameLoading =
                existing?.isLoading === state.isLoading && existing?.isFetching === state.isFetching;
            const sameLessons =
                existing && getLessonsSignature(existing.lessons) === getLessonsSignature(state.lessons);

            if (existing && sameLoading && sameLessons) {
                return prev;
            }
            return { ...prev, [uuid]: state };
        });
    }, []);

    const lessonsByCourse = useMemo(() => {
        const map: LessonsByCourse = {};
        courseUuids.forEach(uuid => {
            map[uuid] = stateByUuid[uuid]?.lessons ?? [];
        });
        return map;
    }, [courseUuids, stateByUuid]);

    const isLoading =
        courseUuids.length > 0 &&
        courseUuids.some(uuid => stateByUuid[uuid]?.isLoading ?? true);

    const isFetching =
        courseUuids.length > 0 &&
        courseUuids.some(uuid => stateByUuid[uuid]?.isFetching ?? true);

    return (
        <>
            {courseUuids.map(uuid => (
                <CourseLessonsRunner key={uuid} courseUuid={uuid} onChange={handleChange} />
            ))}
            {children({ lessonsByCourse, isLoading, isFetching })}
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Small local StarRating (mirrors the course page's ./StarRating shape)
// ════════════════════════════════════════════════════════════════════════

function StarRatingDisplay({
    rating,
    reviewCount,
    size = 'md',
    showCount = true,
}: {
    rating: number;
    reviewCount?: number;
    size?: 'sm' | 'md';
    showCount?: boolean;
}) {
    const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`${starSize} ${i < Math.round(rating)
                            ? 'fill-warning text-warning'
                            : 'fill-muted text-muted-foreground'
                            }`}
                    />
                ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
            {showCount && typeof reviewCount === 'number' && (
                <span className="text-xs text-muted-foreground">
                    ({reviewCount.toLocaleString()} review{reviewCount === 1 ? '' : 's'})
                </span>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Hero
// ════════════════════════════════════════════════════════════════════════

function ProgramDetailsHero({
    program,
    courseCount,
    reviewCount,
    averageRating,
    lessonCount,
    assignmentCount,
    quizCount,
}: {
    program: TrainingProgram;
    courseCount: number;
    reviewCount: number;
    averageRating: string | null;
    lessonCount: number;
    assignmentCount: number;
    quizCount: number;
}) {
    const totalAssessments = assignmentCount + quizCount;
    const displayRating = averageRating ? Number(averageRating) : 0;

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="bg-primary text-primary-foreground group relative aspect-video overflow-hidden rounded-xl shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="mb-3 flex items-center justify-center">
                            <Layers3 className="h-16 w-16 drop-shadow-lg sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
                        </div>

                        <p className="text-lg font-black tracking-tight drop-shadow sm:text-xl lg:text-2xl">
                            {program.program_type?.toUpperCase() || 'PROGRAM'}
                        </p>

                        <p className="text-base font-bold sm:text-lg lg:text-xl">{program.title}</p>

                        <p className="text-primary-foreground/80 text-xs sm:text-sm">
                            {courseCount} bundled course{courseCount === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                <div className="bg-background/20 text-primary-foreground absolute right-3 top-3 flex items-center gap-1 rounded-md px-2 py-1 text-xs backdrop-blur-sm">
                    <Play className="h-3 w-3 fill-current" />
                    Preview
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
                <h1 className="text-foreground text-xl font-black leading-tight sm:text-2xl lg:text-3xl">
                    {program.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-success/5 text-success border-border flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm">
                        <Award className="h-3.5 w-3.5" />
                        {program.status === 'published' ? 'Published Program' : 'Training Program'}
                    </span>

                    <span className="bg-secondary text-secondary-foreground border-border flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {program.program_type || 'General'}
                    </span>
                </div>

                <StarRatingDisplay rating={displayRating || 0} reviewCount={reviewCount} size="md" />

                <div className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                    <HTMLTextPreview htmlContent={program.description || ''} />
                </div>

                <div className="flex flex-wrap items-center gap-12 w-full text-sm">
                    <div className="flex flex-col items-start gap-1.5">
                        <div className="flex gap-2">
                            <Layers3 className="text-muted-foreground h-4 w-4 shrink-0" />
                            <p className="text-muted-foreground text-xs">Courses</p>
                        </div>
                        <p className="text-foreground text-xs font-semibold sm:text-sm">
                            {courseCount} included
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-1.5">
                        <div className="flex gap-2">
                            <Users className="text-muted-foreground h-4 w-4 shrink-0" />
                            <p className="text-muted-foreground text-xs">Class limit</p>
                        </div>
                        <p className="text-foreground text-xs font-semibold sm:text-sm">
                            {program.class_limit ?? 'Open'}
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-1.5">
                        <div className="flex gap-2">
                            <Globe className="text-muted-foreground h-4 w-4 shrink-0" />
                            <p className="text-muted-foreground text-xs">Price</p>
                        </div>
                        <p className="text-foreground text-xs font-semibold sm:text-sm">
                            {typeof program.price === 'number' ? `KES ${program.price}` : 'Flexible'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-border flex flex-wrap gap-6 border-y py-3 sm:gap-12 sm:py-4">
                {[
                    {
                        icon: <BookOpen className="h-4 w-4 text-primary" />,
                        label: `${lessonCount}`,
                        sub: 'Lessons',
                        bg: 'bg-primary/5',
                    },
                    {
                        icon: <FileCheck className="h-4 w-4 text-success" />,
                        label: `${totalAssessments}`,
                        sub: 'Assessments',
                        bg: 'bg-success/5',
                    },
                    {
                        icon: <MonitorPlay className="h-4 w-4 text-warning" />,
                        label: 'Hands-on',
                        sub: 'Projects',
                        bg: 'bg-warning/5',
                    },
                    {
                        icon: <Award className="h-4 w-4 text-balance" />,
                        label: 'Certificate',
                        sub: 'of Completion',
                        bg: 'bg-muted/50',
                    },
                    {
                        icon: <Globe className="h-4 w-4 text-accent" />,
                        label: 'English',
                        sub: 'Language',
                        bg: 'bg-accent/5',
                    },
                ].map((item, i) => (
                    <div key={i} className="flex flex-row min-w-fit items-center gap-2">
                        <div className={`${item.bg} p-2 rounded-full`}>{item.icon}</div>
                        <div className="flex flex-col">
                            <span className="text-foreground text-xs font-bold sm:text-sm">
                                {item.label}
                            </span>
                            <span className="text-muted-foreground text-xs -mt-1">{item.sub}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Overview tab (about / what you'll learn / curriculum / instructors)
// ════════════════════════════════════════════════════════════════════════

function splitBullets(value?: string | null) {
    if (!value) return [];
    return value
        .split(/\n|•|-/)
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 6);
}

function ProgramCurriculum({
    programCourses,
    lessonsByCourse,
}: {
    programCourses: Course[];
    lessonsByCourse: LessonsByCourse;
}) {
    const [openModules, setOpenModules] = useState<string[]>([]);

    const toggle = (key: string) => {
        setOpenModules(prev =>
            prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
        );
    };

    const totalLessons = useMemo(
        () => Object.values(lessonsByCourse).flat().length,
        [lessonsByCourse]
    );

    const allKeys = useMemo(
        () =>
            programCourses.flatMap((course, ci) =>
                (lessonsByCourse[course.uuid ?? ''] ?? []).map(
                    (_, li) => `${course.uuid ?? ci}-${li}`
                )
            ),
        [programCourses, lessonsByCourse]
    );

    if (programCourses.length === 0) {
        return (
            <section className="text-center py-10 text-muted-foreground">
                <h2 className="text-base font-semibold text-foreground">Program Curriculum</h2>
                <p className="text-sm mt-2">No courses have been added to this program yet.</p>
            </section>
        );
    }

    return (
        <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                    Program Curriculum
                </h2>

                <button
                    type="button"
                    onClick={() => setOpenModules(openModules.length === allKeys.length ? [] : allKeys)}
                    className="text-xs font-medium text-primary transition-colors hover:text-primary/80 sm:text-sm"
                >
                    {openModules.length === allKeys.length ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            <div className="flex flex-col gap-5">
                {programCourses.map((course, ci) => {
                    const courseLessons = lessonsByCourse[course.uuid ?? ''] ?? [];

                    return (
                        <div key={course.uuid ?? ci} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                    {ci + 1}
                                </span>
                                <h3 className="text-sm font-bold text-foreground sm:text-base">
                                    {course.name || 'Untitled course'}
                                </h3>
                            </div>

                            <div className="overflow-hidden rounded-sm border border-border divide-y divide-border">
                                {courseLessons.length === 0 ? (
                                    <div className="px-4 py-3 text-xs text-muted-foreground sm:px-5 sm:text-sm">
                                        No lessons added for this course yet.
                                    </div>
                                ) : (
                                    courseLessons
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                (a.lesson?.lesson_number ?? 0) -
                                                (b.lesson?.lesson_number ?? 0)
                                        )
                                        .map((mod, li) => {
                                            const key = `${course.uuid ?? ci}-${li}`;
                                            const isOpen = openModules.includes(key);

                                            return (
                                                <div key={key}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggle(key)}
                                                        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted sm:px-5 sm:py-4"
                                                    >
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <ChevronDown
                                                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''
                                                                    }`}
                                                            />
                                                            <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                                                                {mod.lesson?.title}
                                                            </span>
                                                        </div>

                                                        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground sm:gap-5 sm:text-sm">
                                                            <span>
                                                                {mod.content?.data?.length || 0} Lessons
                                                            </span>
                                                        </div>
                                                    </button>

                                                    {isOpen &&
                                                        mod.content?.data?.map((lesson, index) => (
                                                            <div
                                                                key={index}
                                                                className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6 sm:text-sm"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex h-1.5 w-1.5 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 24 24"
                                                                            fill="currentColor"
                                                                            className="h-2 w-2 text-on-primary"
                                                                        >
                                                                            <circle cx="12" cy="12" r="6" />
                                                                        </svg>
                                                                    </span>
                                                                    <p>{lesson.title}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap gap-6 text-xs text-muted-foreground sm:gap-6 sm:text-sm">
                <span className="flex gap-2">
                    <strong className="text-foreground text-sm">Total Lessons:</strong>
                    <p>{totalLessons}</p>
                </span>
                <span className="flex gap-2">
                    <strong className="text-foreground text-sm">Total Courses:</strong>
                    <p>{programCourses.length}</p>
                </span>
            </div>
        </section>
    );
}

function ProgramOverview({
    program,
    classData,
    programCourses,
    lessonsByCourse,
    type
}: {
    program: TrainingProgram;
    classData: CombinedClassDetailsData;
    programCourses: Course[];
    lessonsByCourse: LessonsByCourse;
    type: string | undefined
}) {
    const userProfile = useUserProfile()
    const [expanded, setExpanded] = useState(false);

    const learnings = useMemo(
        () => splitBullets(program.objectives || program.description),
        [program.description, program.objectives]
    );

    const instructor = classData?.instructor?.data

    const { data: instructorClassResp } = useQuery({
        ...getClassDefinitionsForInstructorOptions({
            path: { instructorUuid: instructor?.uuid as string }
        }),
        enabled: !!instructor?.uuid
    })
    const instructorClasses = instructorClassResp?.data?.filter(
        (item) => item.class_definition?.is_active
    ) || []
    const { data: instructorReviewResp } = useQuery({
        ...getInstructorRatingSummaryOptions({
            path: { instructorUuid: instructor?.uuid as string }
        }),
        enabled: !!instructor?.uuid
    })

    const profile = {
        name: instructor?.full_name,
        headline: instructor?.professional_headline,
        bio: instructor?.bio,
        courses: instructorClasses?.length,
        rating: instructorReviewResp?.data?.average_rating
    };

    const stats = [
        { val: profile.courses, label: "Courses" },
        { val: 0, label: "Students" },
        { val: profile?.rating, label: "Rating" },
    ];

    const studentUuid = userProfile?.student?.uuid as string;
    const { courseEnrollmentMap } = useCourseEnrollmentsMap([classData?.course?.uuid as string]);
    const courseEnrollments =
        courseEnrollmentMap?.[classData?.course?.uuid as string] || [];

    const enrollment = courseEnrollments?.enrollments?.find(
        (e) => e.student_uuid === studentUuid
    );

    const enrollmentUuid = enrollment?.uuid;

    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [rating, setRating] = useState(0);
    const [clarityRating, setClarityRating] = useState(0);
    const [engagementRating, setEngagementRating] = useState(0);
    const [punctualityRating, setPunctualityRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [headline, setHeadline] = useState('');

    const reviewInstructor = useMutation(submitInstructorReviewMutation());
    const handleSubmitFeedback = () => {
        if (!classData?.class || !classData?.class?.uuid || !instructor?.uuid || !studentUuid) {
            toast.error('Class or student enrollment not found');
            return;
        }

        const instructorUuid = instructor.uuid;

        reviewInstructor.mutate(
            {
                body: {
                    enrollment_uuid: enrollmentUuid,
                    instructor_uuid: instructorUuid,
                    student_uuid: studentUuid,
                    comments: feedbackComment,
                    headline: headline,
                    is_anonymous: false,
                    rating: rating,
                    clarity_rating: clarityRating,
                    engagement_rating: engagementRating,
                    punctuality_rating: punctualityRating,
                },
                path: { instructorUuid },
            },
            {
                onSuccess: (data) => {
                    toast.success(data?.message);
                    setShowFeedbackDialog(false);
                    setFeedbackComment('');
                    setHeadline('');
                    setRating(0);
                    setClarityRating(0);
                    setEngagementRating(0);
                    setPunctualityRating(0);
                },
                onError: (data) => {
                    toast.error(data?.message);
                },
            }
        );
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            {/* ABOUT */}
            <section>
                <h2 className="mb-2 text-base font-bold text-foreground sm:mb-3 sm:text-lg">
                    About this program
                </h2>

                <div className="text-sm leading-relaxed text-muted-foreground">
                    <HTMLTextPreview
                        htmlContent={
                            expanded
                                ? program.description || 'This program is now driven by live API data.'
                                : (program.description || '').slice(0, 260)
                        }
                    />

                    {program.description && program.description.length > 260 && (
                        <button
                            type="button"
                            onClick={() => setExpanded(prev => !prev)}
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                        >
                            {expanded ? 'Show less' : 'Show more'}
                            {expanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </button>
                    )}
                </div>
            </section>

            {/* WHAT YOU'LL LEARN */}
            <section>
                <h2 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-lg">
                    What you'll learn
                </h2>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    {(learnings.length > 0
                        ? learnings
                        : ['Learn the key concepts across this program']
                    ).map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            <div className="text-sm text-muted-foreground">
                                <HTMLTextPreview htmlContent={item} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CURRICULUM (collapsed view, grouped by course) */}
            <ProgramCurriculum programCourses={programCourses} lessonsByCourse={lessonsByCourse} />

            {/* COURSES IN PROGRAM */}
            <section>
                <h2 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-lg">
                    Courses in this program
                </h2>

                {programCourses.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No courses have been bundled into this program yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {programCourses.map((course, i) => (
                            <div
                                key={course.uuid ?? i}
                                className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4"
                            >
                                <span className="bg-primary/10 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                    {i + 1}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                        {course.name || 'Untitled course'}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                        {course.description
                                            ? course.description.replace(/<[^>]*>/g, '')
                                            : 'No description available.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* INSTRUCTOR */}
            {type === 'class' &&
                <section>
                    <div className='flex flex-row items-center justify-between'>
                        <h2 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-lg">
                            Meet your Instructor
                        </h2>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setShowFeedbackDialog(true)}
                            className='gap-2 rounded-sm shadow-none'
                        >
                            <Star className='h-4 w-4' />
                            Write a Review
                        </Button>
                    </div>


                    <div className="flex flex-col items-start gap-4 rounded-md border border-border bg-muted/40 p-4 sm:flex-row sm:gap-6 sm:p-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted sm:h-20 sm:w-20">
                            <User2 className="h-6 w-6 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-foreground sm:text-base">
                                {profile.name}
                            </h3>

                            <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
                                {profile.headline}
                            </p>

                            <div className="mb-3 text-xs leading-relaxed text-muted-foreground sm:mb-4 sm:text-sm">
                                <HTMLTextPreview htmlContent={profile.bio} />
                            </div>

                            <div className="flex flex-wrap gap-6 sm:gap-12">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="text-start">
                                        <p className="text-sm font-black text-foreground sm:text-base">
                                            {stat.label === "Rating" ? (
                                                <span className="inline-flex items-center gap-1">
                                                    {stat.val}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        className="h-4 w-4 text-warning"
                                                    >
                                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                    </svg>
                                                </span>
                                            ) : (
                                                stat.val
                                            )}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <FeedbackDialog
                        open={showFeedbackDialog}
                        onOpenChange={setShowFeedbackDialog}
                        headline={headline}
                        onHeadlineChange={setHeadline}
                        feedback={feedbackComment}
                        onFeedbackChange={setFeedbackComment}
                        rating={rating}
                        onRatingChange={setRating}
                        clarityRating={clarityRating}
                        onClarityRatingChange={setClarityRating}
                        engagementRating={engagementRating}
                        onEngagementRatingChange={setEngagementRating}
                        punctualityRating={punctualityRating}
                        onPunctualityRatingChange={setPunctualityRating}
                        isSubmitting={reviewInstructor.isPending}
                        onSubmit={handleSubmitFeedback}
                    />
                </section>}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Courses tab — full bundled-course list
// ════════════════════════════════════════════════════════════════════════

function ProgramBundledCourses({
    courses,
    lessonsByCourse,
}: {
    courses: Course[];
    lessonsByCourse: LessonsByCourse;
}) {
    if (courses.length === 0) {
        return (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                No courses have been bundled into this program yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courses.map((course, i) => {
                const lessonCount = (lessonsByCourse[course.uuid ?? ''] ?? []).length;

                return (
                    <div
                        key={course.uuid ?? i}
                        className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                    >
                        <div className="relative aspect-video overflow-hidden bg-muted">
                            {course.banner_url || course.thumbnail_url ? (
                                <img
                                    src={course.banner_url || course.thumbnail_url || ''}
                                    alt={course.name || 'Course banner'}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                            )}

                            <span className="bg-primary/90 text-primary-foreground absolute left-2 top-2 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                                {i + 1}
                            </span>
                        </div>

                        <div className="p-4">
                            <h3 className="text-sm font-bold text-foreground sm:text-base">
                                {course.name || 'Untitled course'}
                            </h3>

                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 sm:text-sm">
                                {course.description
                                    ? course.description.replace(/<[^>]*>/g, '')
                                    : 'No description available.'}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    {lessonCount} lessons
                                </span>

                                {typeof course.minimum_training_fee === 'number' && (
                                    <span className="font-semibold text-foreground">
                                        From Ksh {course.minimum_training_fee.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Assessments tab
// ════════════════════════════════════════════════════════════════════════

function ProgramAssessments({
    assignments = [],
    quizzes = [],
}: {
    assignments: Assignment[];
    quizzes: Quiz[];
}) {
    return (
        <div className="space-y-8">
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Assignments</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {assignments.length}
                    </span>
                </div>

                {assignments.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No assignments available.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map(assignment => (
                            <div key={assignment.uuid} className="rounded-lg border bg-card p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold">{assignment.title}</h3>
                                        {assignment.due_date && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Due {new Date(assignment.due_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {assignment.max_points} pts
                                    </div>
                                </div>

                                {assignment.description && (
                                    <div
                                        className="prose prose-sm mt-4 max-w-none"
                                        dangerouslySetInnerHTML={{ __html: assignment.description }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="border-t" />

            <section>
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Quizzes</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {quizzes.length}
                    </span>
                </div>

                {quizzes.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No quizzes available.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map(quiz => (
                            <div key={quiz.uuid} className="rounded-lg bg-card">
                                <QuizContentPreview
                                    quizUuid={quiz.uuid}
                                    role="preview"
                                    questionsOpen={false}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Schedule tab
// ════════════════════════════════════════════════════════════════════════

function ProgramScheduleInfo() {
    return (
        <div className="rounded-lg border border-muted/50 bg-muted/30 p-6">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <CalendarClock className="h-5 w-5" />
                </div>

                <div className="space-y-3">
                    <h3 className="text-base font-semibold">
                        Your Class Schedules Will Be Provided After Enrollment
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Hello! 😊 Once you enroll in this program, you'll receive full scheduling
                        details for each bundled course. This includes:
                    </p>

                    <ul className="ml-5 list-disc text-muted-foreground text-sm leading-relaxed space-y-1">
                        <li>Class dates and start times for every course in the program</li>
                        <li>Frequency and duration of sessions</li>
                        <li>How to join each session</li>
                    </ul>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Make sure your contact information is up to date so you don't miss any
                        updates. You'll have everything you need to plan and prepare right after
                        enrollment.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Sidebar
// ════════════════════════════════════════════════════════════════════════

function ProgramSidebar({
    program,
    lessonCount,
    assessmentCount,
    onEnroll,
}: {
    program: TrainingProgram;
    lessonCount: number;
    assessmentCount: number;
    onEnroll: () => void;
}) {
    const priceLabel =
        typeof program.price === 'number' && program.price > 0
            ? `From Ksh ${program.price.toLocaleString()}`
            : 'Pricing not set';

    return (
        <div className="flex flex-col gap-4 sm:gap-5">
            <div className="rounded-xl border border-border bg-card text-card-foreground p-4 sm:p-5">
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Enroll in this program
                </p>

                <p className="mb-4 text-xl font-black text-foreground sm:text-2xl lg:text-3xl">
                    {priceLabel}
                </p>

                <div className="flex flex-col gap-2.5 sm:gap-3">
                    <Button
                        onClick={onEnroll}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:text-base"
                    >
                        Enroll Now
                        <MoveRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-4 flex flex-col gap-3 pt-1">
                    {[
                        {
                            icon: <Shield className="h-4 w-4 text-muted-foreground" />,
                            text: '30-Day Money-Back Guarantee',
                        },
                        {
                            icon: <InfinityIcon className="h-4 w-4 text-muted-foreground" />,
                            text: 'Full Lifetime Access',
                        },
                        {
                            icon: <Globe className="h-4 w-4 text-muted-foreground" />,
                            text: 'Access on Mobile & Desktop',
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-sm text-muted-foreground">{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                    This program includes:
                </h3>

                <div className="flex flex-col gap-3">
                    {[
                        {
                            icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
                            text: `${lessonCount} Lessons`,
                        },
                        {
                            icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
                            text: `${assessmentCount} Assessments`,
                        },
                        {
                            icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
                            text: 'Hands-on Projects',
                        },
                        {
                            icon: <Download className="h-4 w-4 text-muted-foreground" />,
                            text: 'Downloadable Resources',
                        },
                        {
                            icon: <InfinityIcon className="h-4 w-4 text-muted-foreground" />,
                            text: 'Full Lifetime Access',
                        },
                        {
                            icon: <Award className="h-4 w-4 text-muted-foreground" />,
                            text: 'Certificate of Completion',
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-sm text-muted-foreground">{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Rating sidebar card
// ════════════════════════════════════════════════════════════════════════

function ProgramRating({
    reviewCount,
    averageRating,
    reviews,
    programId,
}: {
    reviewCount: number;
    averageRating: string | null;
    reviews: ProgramReview[];
    programId: string;
}) {
    const profile = useUserProfile();
    const student_uuid = profile?.student?.uuid;

    const rating = averageRating ? Number(averageRating) : 0;

    const dynamicBreakdown = [5, 4, 3, 2, 1].map(stars => {
        const matched = reviews.filter(
            review => Math.round(review.rating || 0) === stars
        ).length;

        const pct =
            reviewCount > 0
                ? Math.round((matched / reviewCount) * 100)
                : 0;

        return { stars, pct };
    });

    const qc = useQueryClient();

    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [headline, setHeadline] = useState("");

    const reviewProgramMut = useMutation(submitProgramReviewMutation());

    const handleSubmitFeedback = () => {
        reviewProgramMut.mutate(
            {
                body: {
                    student_uuid: student_uuid as string,
                    rating: newRating,
                    comments: feedbackComment,
                    headline,
                    is_anonymous: false,
                },
                path: {
                    programUuid: programId,
                },
            },
            {
                onSuccess: (data) => {
                    toast.success("Review added successfully");

                    setShowFeedbackDialog(false);

                    qc.invalidateQueries({
                        queryKey: getProgramReviewsQueryKey({
                            path: { programUuid: programId as string },
                            query: { pageable: {} }
                        }),
                    });
                },
                onError: (error) => {
                    toast.error(error?.message);
                    setShowFeedbackDialog(false);
                },
            }
        );
    };

    return (
        <>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground sm:text-base">
                    Program Rating
                </h3>

                <div className="mb-4 flex flex-col gap-4 sm:gap-6">
                    <div className="flex flex-row items-center gap-3 text-center">
                        <p className="text-3xl font-black text-foreground sm:text-4xl">
                            {rating ? rating.toFixed(1) : "0.0"}
                        </p>

                        <StarRatingDisplay
                            rating={rating}
                            size="sm"
                            showCount={false}
                        />

                        <p className="mt-1 text-xs text-muted-foreground">
                            {reviewCount.toLocaleString()} review
                            {reviewCount === 1 ? "" : "s"}
                        </p>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        {dynamicBreakdown.map(row => (
                            <div
                                key={row.stars}
                                className="flex items-center gap-2 text-xs"
                            >
                                <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
                                    <span>★</span>
                                    <span>{row.stars}</span>
                                </div>

                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${row.pct}%` }}
                                    />
                                </div>

                                <span className="w-6 shrink-0 text-right text-muted-foreground">
                                    {row.pct}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={() => setShowFeedbackDialog(true)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground sm:text-sm"
                >
                    Write a Review
                </Button>
            </div>

            <FeedbackDialog
                type="others"
                open={showFeedbackDialog}
                onOpenChange={setShowFeedbackDialog}
                headline={headline}
                onHeadlineChange={setHeadline}
                feedback={feedbackComment}
                onFeedbackChange={setFeedbackComment}
                rating={newRating}
                onRatingChange={setNewRating}
                isSubmitting={reviewProgramMut.isPending}
                onSubmit={handleSubmitFeedback}
            />
        </>
    );
}

function ProgramReviewsList({ reviews }: { reviews: ProgramReview[] }) {
    if (!reviews.length) {
        return (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                No reviews yet. Be the first!
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map(review => (
                <div key={review.uuid} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">
                            {review.is_anonymous ? 'Anonymous' : review?.student_uuid ?? ''}
                        </p>
                        <span className="text-xs text-muted-foreground">{review.rating ?? 0}★</span>
                    </div>
                    {review.headline && (
                        <p className="text-sm font-medium text-foreground">{review.headline}</p>
                    )}
                    {review.comments && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {review.comments}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════
// Page
// ════════════════════════════════════════════════════════════════════════

export default function ClassProgramDetailsPage({ programId, classData, type }: {
    programId: string,
    classData?: CombinedClassDetailsData;
    type: string | undefined
}) {
    const router = useRouter();
    const params = useParams();
    const { activeDomain } = useUserDomain();
    const qc = useQueryClient();

    const [activeTab, setActiveTab] = useState('Overview');
    const [shareOpen, setShareOpen] = useState(false);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [headline, setHeadline] = useState('');
    const [siteOrigin, setSiteOrigin] = useState('');

    const resolvedProgramId = programId || (params?.id as string);
    const isInstructorDomain = activeDomain === 'instructor';

    useEffect(() => {
        setSiteOrigin(window.location.origin);
    }, []);

    // ── Program ──────────────────────────────────────────────────────
    const {
        data: programResponse,
        isLoading: programLoading,
        isFetching: programFetching,
    } = useQuery({
        ...getTrainingProgramByUuidOptions({ path: { uuid: resolvedProgramId } }),
        enabled: !!resolvedProgramId,
    });
    const program = programResponse?.data;

    // ── Bundled courses ─────────────────────────────────────────────
    const { data: programCoursesResponse, isLoading: coursesLoading } = useQuery({
        ...getProgramCoursesOptions({ path: { programUuid: resolvedProgramId } }),
        enabled: !!resolvedProgramId,
    });
    const programCourses: Course[] = useMemo(
        () => programCoursesResponse?.data ?? [],
        [programCoursesResponse]
    );
    const courseUuids = useMemo(
        () => programCourses.map(c => c.uuid).filter((u): u is string => !!u),
        [programCourses]
    );

    // ── Reviews (program-level) ─────────────────────────────────────
    const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery({
        ...getProgramReviewsOptions({
            path: { programUuid: resolvedProgramId },
            query: { pageable: {} },
        }),
        enabled: !!resolvedProgramId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const reviews: ProgramReview[] = reviewsResponse?.data?.content ?? [];
    const reviewCount = reviews.length;
    const avgRating =
        reviewCount > 0
            ? (
                reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount
            ).toFixed(1)
            : null;

    const reviewProgramMut = useMutation(submitProgramReviewMutation());

    const handleSubmitFeedback = () => {
        reviewProgramMut.mutate(
            {
                body: {
                    rating,
                    comments: feedbackComment,
                    headline,
                    is_anonymous: false,
                },
                path: { programUuid: resolvedProgramId },
            },
            {
                onSuccess: () => {
                    toast.success('Review submitted successfully');
                    setShowFeedbackDialog(false);
                    qc.invalidateQueries({
                        queryKey: getProgramReviewsQueryKey({
                            path: { programUuid: resolvedProgramId },
                            query: { pageable: {} },
                        }),
                    });
                },
                onError: () => {
                    toast.error('An error occurred. Contact support');
                    setShowFeedbackDialog(false);
                },
            }
        );
    };

    // ── Difficulty levels (kept for parity; bundled courses may use these) ──
    const { isLoading: difficultyLoading } = useQuery(getAllDifficultyLevelsOptions());

    // ── Assignments & quizzes (global lists, filtered to program's lessons) ──
    const { data: assignmentsResponse, isLoading: assignmentLoading } = useQuery({
        ...getAllAssignmentsOptions({ query: { pageable: { page: 0, size: 1000 } } }),
    });
    const assignments: Assignment[] = assignmentsResponse?.data?.content ?? [];

    const { data: quizzesResponse, isLoading: quizzesLoading } = useQuery({
        ...getAllQuizzesOptions({ query: { pageable: { page: 0, size: 1000 } } }),
    });
    const quizzes: Quiz[] = quizzesResponse?.data?.content ?? [];

    const aggregatedRequirements = useMemo(
        () => programCourses.flatMap(c => c.training_requirements ?? []),
        [programCourses]
    );

    const totalDurationMinutes = useMemo(
        () =>
            programCourses.reduce(
                (sum, c) => sum + (c.duration_hours ?? 0) * 60 + (c.duration_minutes ?? 0),
                0
            ),
        [programCourses]
    );
    const durationLabel = totalDurationMinutes
        ? `${Math.floor(totalDurationMinutes / 60)} hours / ${totalDurationMinutes % 60} minutes`
        : 'N/A';

    const programShareLink = useMemo(() => {
        if (!siteOrigin) return '';
        return `${siteOrigin}${buildWorkspaceAliasPath(
            activeDomain,
            `/dashboard/courses/available-programs/${resolvedProgramId}`
        )}`;
    }, [activeDomain, resolvedProgramId, siteOrigin]);

    const classId = classData?.class?.uuid

    const registrationLink = useMemo(() => {
        if (!siteOrigin) return '';

        if (program?.uuid) {
            return `${siteOrigin}/dashboard/workspace/student/courses/available-programs/${program.uuid}/enroll?id=${classId}`;
        }

        return '';
    }, [classId, program?.uuid, siteOrigin]);

    return (
        <AggregatedCourseLessons courseUuids={courseUuids}>
            {({ lessonsByCourse, isLoading: lessonsLoading, isFetching: lessonsFetching }) => {
                const allLessonsWithContent = Object.values(lessonsByCourse).flat();
                const lessonUuids = allLessonsWithContent
                    .map(item => item.lesson?.uuid)
                    .filter((uuid): uuid is string => !!uuid);

                const filteredAssignments = assignments.filter(a =>
                    lessonUuids.includes(a.lesson_uuid)
                );
                const filteredQuizzes = quizzes.filter(q => lessonUuids.includes(q.lesson_uuid));
                const totalLessons = allLessonsWithContent.length;

                const isEverythingReady = !(
                    programLoading ||
                    programFetching ||
                    coursesLoading ||
                    reviewsLoading ||
                    difficultyLoading ||
                    assignmentLoading ||
                    quizzesLoading ||
                    lessonsLoading ||
                    lessonsFetching
                );

                if (!isEverythingReady) {
                    return (
                        <EnrollmentLoadingState
                            title="Loading your program details"
                            description="We are gathering courses, lessons, tasks, quizzes, and program information so the full learning overview is ready when the page opens."
                        />
                    );
                }

                if (!program) {
                    return (
                        <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-border p-10 text-center">
                            <h1 className="text-xl font-semibold text-foreground">
                                Program not found
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The program you are trying to open could not be found.
                            </p>
                        </div>
                    );
                }

                const tabs = [
                    'Overview',
                    `Courses (${programCourses.length})`,
                    `Lessons (${totalLessons})`,
                    `Assessment (${filteredAssignments.length + filteredQuizzes.length})`,
                    `Requirements (${aggregatedRequirements.length})`,
                    'Schedule',
                    `Reviews (${reviewCount})`,
                    'FAQs',
                ];

                return (
                    <div className="min-h-screen font-sans">
                        <main className="mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                            <div className="mb-4 flex justify-end gap-2 sm:mb-6">
                                <Button
                                    onClick={() => setShareOpen(true)}
                                    className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors duration-200 ease-in-out hover:bg-muted/50 hover:border-primary/45 hover:text-foreground sm:text-sm"
                                >
                                    <Share2 className="h-3.5 w-3.5" />
                                    Share
                                </Button>

                                <Button className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors duration-200 ease-in-out hover:bg-destructive/10 hover:border-destructive hover:text-destructive sm:text-sm">
                                    <Heart className="h-3.5 w-3.5" />
                                    Wishlist
                                </Button>
                            </div>

                            <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8 xl:gap-10">
                                <div className="flex min-w-0 w-full flex-1 flex-col gap-5 sm:gap-6">
                                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6">
                                        <ProgramDetailsHero
                                            program={program}
                                            courseCount={programCourses.length}
                                            reviewCount={reviewCount}
                                            averageRating={avgRating}
                                            lessonCount={totalLessons}
                                            assignmentCount={filteredAssignments.length}
                                            quizCount={filteredQuizzes.length}
                                        />
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                        <div className="px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6">
                                            <ClassCourseTabNav
                                                tabs={tabs}
                                                activeTab={activeTab}
                                                onTabChange={setActiveTab}
                                            />
                                        </div>

                                        <div className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
                                            {activeTab === 'Overview' && (
                                                <ProgramOverview
                                                    program={program}
                                                    classData={classData}
                                                    programCourses={programCourses}
                                                    lessonsByCourse={lessonsByCourse}
                                                    type={type}
                                                />
                                            )}

                                            {activeTab === `Courses (${programCourses.length})` && (
                                                <ProgramBundledCourses
                                                    courses={programCourses}
                                                    lessonsByCourse={lessonsByCourse}
                                                />
                                            )}

                                            {activeTab === `Lessons (${totalLessons})` && (
                                                <ProgramCurriculum
                                                    programCourses={programCourses}
                                                    lessonsByCourse={lessonsByCourse}
                                                />
                                            )}

                                            {activeTab ===
                                                `Assessment (${filteredAssignments.length + filteredQuizzes.length
                                                })` && (
                                                    <ProgramAssessments
                                                        assignments={filteredAssignments}
                                                        quizzes={filteredQuizzes}
                                                    />
                                                )}

                                            {activeTab ===
                                                `Requirements (${aggregatedRequirements.length})` && (
                                                    <CourseTrainingRequirements
                                                        requirements={aggregatedRequirements}
                                                        title="Program Training Requirements"
                                                        description="Review what you need to prepare before registering for this program, combined across all its courses."
                                                        className="border-none shadow-none"
                                                        viewerRole={activeDomain as string}
                                                    />
                                                )}

                                            {activeTab === 'Schedule' && <ProgramScheduleInfo />}

                                            {activeTab === `Reviews (${reviewCount})` && (
                                                <ProgramReviewsList reviews={reviews} />
                                            )}

                                            {activeTab === 'FAQs' && <CourseFaq faqs={[]} />}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full shrink-0 flex-col gap-4 sm:gap-5 lg:sticky lg:top-20 lg:w-80 xl:w-96">
                                    <ProgramSidebar
                                        program={program}
                                        lessonCount={totalLessons}
                                        assessmentCount={
                                            filteredAssignments.length + filteredQuizzes.length
                                        }
                                        onEnroll={() =>
                                            router.push(
                                                buildWorkspaceAliasPath(
                                                    activeDomain,
                                                    `/dashboard/courses/available-programs/${resolvedProgramId}`
                                                )
                                            )
                                        }
                                    />

                                    <ProgramRating
                                        reviewCount={reviewCount}
                                        averageRating={avgRating}
                                        reviews={reviews}
                                        onWriteReview={() => setShowFeedbackDialog(true)}
                                        canReview={!isInstructorDomain}
                                        programId={programId as string}
                                    />

                                    {type === "program" ? <ShareClassCourse
                                        courseTitle={program?.title ?? ''}
                                        courseUrl={`${window.location.origin}${buildWorkspaceAliasPath(
                                            activeDomain,
                                            `/dashboard/courses/programs/${program?.uuid}`
                                        )}`}

                                        type={type}
                                    /> :
                                        <ShareClass
                                            classTitle={program?.title ?? ''}
                                            classUrl={registrationLink}
                                            type={type}

                                        />}
                                </div>
                            </div>
                        </main>

                        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Share Program</DialogTitle>
                                    <DialogDescription>
                                        Share this program with other learners and instructors.
                                    </DialogDescription>
                                </DialogHeader>

                                <LinkShareCard
                                    title="Program Link"
                                    description="Copy or share this program link."
                                    url={programShareLink}
                                    footer={
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium">Share via</h4>

                                            <div className="flex flex-wrap gap-2">
                                                {socialShareActions.map(({ icon: Icon, label, platform }) => (
                                                    <Button
                                                        key={label}
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                        disabled={!programShareLink}
                                                        onClick={() =>
                                                            openShareWindow(
                                                                buildSocialShareUrl(platform, {
                                                                    title: program?.title ?? 'Program',
                                                                    url: programShareLink,
                                                                    description: `Check out this program: ${program?.title}`,
                                                                })
                                                            )
                                                        }
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        {label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    }
                                />
                            </DialogContent>
                        </Dialog>

                        <FeedbackDialog
                            type="others"
                            open={showFeedbackDialog}
                            onOpenChange={setShowFeedbackDialog}
                            headline={headline}
                            onHeadlineChange={setHeadline}
                            feedback={feedbackComment}
                            onFeedbackChange={setFeedbackComment}
                            rating={rating}
                            onRatingChange={setRating}
                            isSubmitting={reviewProgramMut.isPending}
                            onSubmit={handleSubmitFeedback}
                        />
                    </div>
                );
            }}
        </AggregatedCourseLessons>
    );
}