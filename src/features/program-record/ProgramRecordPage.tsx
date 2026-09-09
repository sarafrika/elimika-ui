'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';

import { absoluteUrl, publicCourseUrl, routeSegmentFromPath } from '@/src/features/dashboard/lib/dashboard-url';

import {
    LessonContentViewerDialog
} from '@/components/content-preview/LessonContentPreview';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
    getCategoryByUuidOptions,
    getCourseLessonsOptions,
    getLessonContentOptions,
    getProgramCoursesOptions,
    getProgramEnrollmentsOptions,
    getProgramReviewsOptions,
    getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';

import { CourseRecordView } from '@/src/features/course-record/CourseRecordView';
import {
    AccessCard,
    ActionsCard,
    ActivityTab,
    CommercialsTab,
    COURSE_DEFAULT_CURRENCY,
    CurriculumTab,
    DeliveryTab,
    GateBanner,
    GlanceCard,
    KpiBand,
    OverviewTab,
    OwnerDecisionsPanel,
    ReviewsTab,
    summarise,
    type CourseCurriculumItem,
    type CourseCurriculumLesson,
    type CourseRailActionItem,
} from '@/src/features/course-record/blocks';
import { courseContentKind } from '@/src/features/course-record/blocks/CurriculumTab';


export interface ProgramRecordPageProps {
    programUuid: string;
    /** Where the shell's back link goes. Omitted, the link is not rendered. */
    backHref?: string;

    /* — actions the route may own; each one defaults to the table above — */
    /** Replaces the capability map's primary button outright. */
    primaryAction?: ReactNode;
    /** Keeps the map's label, runs this instead of following the default link. */
    onPrimaryAction?: () => void;
    /** The prospect's "Enroll" target. Wins over `onEnrol`, as the panel does. */
    enrolHref?: string;
    onEnrol?: () => void;
    /** "Compare the N open classes". Defaults to the same class list. */
    compareHref?: string;
    onCompareClasses?: () => void;
    /** Overrides the rail's action rows — label and icon still come from the map. */
    actions?: readonly CourseRailActionItem[];
    /** Opens a curriculum item. Defaults to this feature's content viewer. */
    onReadItem?: (item: CourseCurriculumItem, lesson: CourseCurriculumLesson) => void;
    /** Reviewer display names by `student_uuid`. Resolved here when not supplied. */
    reviewerNames?: Readonly<Record<string, string>>;
    /** Wired, the "Export record" button and its rail row both appear. */
    onExport?: () => void;
    /** Defaults to copying the public catalogue link. */
    onShare?: () => void;

    className?: string;
}

export function ProgramRecordPage({
    programUuid,
    backHref,
    primaryAction,
    onPrimaryAction,
    enrolHref,
    onEnrol,
    compareHref,
    onCompareClasses,
    actions,
    onReadItem,
    reviewerNames,
    onExport,
    onShare,
    className,
}: ProgramRecordPageProps) {
    // Program data
    const programQ = useQuery({
        ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
        enabled: !!programUuid,
        staleTime: STALE_TIMES.entity,
    });
    const program = programQ.data?.data;

    const coursesQ = useQuery({
        ...getProgramCoursesOptions({ path: { programUuid } }),
        enabled: !!programUuid,
        staleTime: STALE_TIMES.reference,
    });
    const courses = coursesQ.data?.data ?? [];

    const enrollmentsQ = useQuery({
        ...getProgramEnrollmentsOptions({ path: { programUuid }, query: { pageable: {} } }),
        enabled: !!programUuid,
    });
    const enrollments = enrollmentsQ.data?.data?.content ?? [];

    const reviewsQ = useQuery({
        ...getProgramReviewsOptions({ path: { programUuid }, query: { pageable: {} } }),
        enabled: !!programUuid,
    });
    const reviews = reviewsQ.data?.data?.content ?? [];

    const categoryUuid = program?.category_uuid;
    const categoryQ = useQuery({
        ...getCategoryByUuidOptions({ path: { uuid: categoryUuid ?? '' } }),
        enabled: !!categoryUuid,
        staleTime: STALE_TIMES.reference,
    });
    const categoryName = categoryQ.data?.data?.name;

    // Simple derived figures
    const enrolledCount = enrollments.length;

    // Fetch course lessons for each program course, then fetch their content
    const courseLessonsQueries = useQueries({
        queries: courses.map((c: any) => ({
            ...getCourseLessonsOptions({ path: { courseUuid: c.uuid }, query: { pageable: {} } }),
            enabled: Boolean(c?.uuid),
            staleTime: STALE_TIMES.reference,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        })),
    });

    // Collect all lesson entries across every course so we can request their
    // contents. Each lesson knows its course_uuid so we can request the right
    // lesson content endpoint.
    const allLessons = useMemo(() => {
        return courseLessonsQueries.flatMap((q: any, courseIdx: number) => {
            const list = q.data?.data?.content ?? [];
            return (list as any[]).map((lesson, lessonIdx) => ({
                ...lesson,
                _programCourseIndex: courseIdx,
                _programLessonIndex: lessonIdx,
            }));
        });
    }, [courseLessonsQueries]);

    const lessonContentQueries = useQueries({
        queries: allLessons.map(lesson => ({
            ...getLessonContentOptions({ path: { courseUuid: lesson.course_uuid, lessonUuid: lesson.uuid }, query: { pageable: {} } }),
            enabled: Boolean(lesson?.uuid),
            staleTime: STALE_TIMES.reference,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        })),
    });

    // Each program course gets its own curriculum section, preserving the course
    // wrapper and then rendering the same lesson/content accordion the single
    // course record uses inside it.
    const courseCurricula = useMemo(() => {
        return courses.map((course: any, idx: number) => {
            const relatedLessons = allLessons.filter(l => l._programCourseIndex === idx);
            const lessons = relatedLessons.map(lesson => {
                const lessonIndex = allLessons.findIndex(
                    entry =>
                        entry._programCourseIndex === lesson._programCourseIndex &&
                        entry._programLessonIndex === lesson._programLessonIndex &&
                        entry.uuid === lesson.uuid
                );
                const q = lessonContentQueries[lessonIndex];
                const contents = q?.data?.data ?? [];

                const items = (contents as any[]).map(content => ({
                    uuid: content.uuid,
                    title: `${lesson.lesson_number}. ${lesson.title} — ${content.title ?? ''}`.trim(),
                    kind: courseContentKind(content.content_category ?? content.mime_type ?? content.content_type_uuid ?? ''),
                    required: !!content.is_required,
                }));

                return {
                    number: lesson.lesson_number ?? 1,
                    title: lesson.title ?? `Lesson ${lesson.lesson_number ?? 1}`,
                    objective: lesson.description ?? undefined,
                    itemCount: items.length || undefined,
                    items,
                } satisfies CourseCurriculumLesson;
            });

            return {
                course,
                lessons,
                itemCount: lessons.reduce((sum, lesson) => sum + (lesson.items?.length ?? 0), 0),
            };
        });
    }, [courses, allLessons, lessonContentQueries]);

    const lessonCount = courseCurricula.reduce((sum, group) => sum + group.lessons.length, 0);
    const contentItemCount = courseCurricula.reduce((sum, group) => sum + group.itemCount, 0);

    // Reviews summary
    const ratings = useMemo(() => summarise(reviews), [reviews]);

    // reviewer names: try to resolve student ids carried on reviews
    const reviewerIds = reviews.filter((r: any) => !r.is_anonymous).map((r: any) => r.student_uuid).filter(Boolean as any);
    const { studentMap } = useStudentsByIds(reviewerIds ?? []);
    const resolvedReviewerNames = useMemo(() => {
        const m: Record<string, string> = {};
        for (const [k, v] of Object.entries(studentMap)) if (v?.full_name) m[k] = v.full_name;
        return m;
    }, [studentMap]);

    // Derive viewer access from the current dashboard path segment so the
    // ProgramRecordPage mirrors CourseRecordPage behaviour and shows creator/
    // instructor/admin views when opened on those dashboards.
    const segment = routeSegmentFromPath(usePathname());
    const access = ((): any => {
        switch (segment) {
            case 'course-creator':
                return 'creator';
            case 'instructor':
                return 'instructor';
            case 'organisation':
                return 'organisation';
            case 'admin':
                return 'admin';
            case 'student':
                return 'student';
            case 'parent':
                return 'prospect';
            default:
                return 'prospect';
        }
    })();

    // Vars for capability copy interpolation — best-effort mapping
    const vars = {
        lifecycle: program?.status,
        enrolment: enrollments?.length || 0,
        classLimit: program?.class_limit,
        classSize: program?.class_limit,
        ageRange: undefined,
        assessments: undefined,
        majorAssessments: undefined,
        lastUpdated: program?.updated_date ? new Date(program.updated_date).toISOString() : undefined,
        price: program?.price,
        nextClassStarts: undefined,
        openClasses: undefined,
        totalClasses: undefined,
        formats: undefined,
        lessons: lessonCount,
        contentItems: contentItemCount,
        duration: program?.total_duration_display,
        minimumFee: undefined,
        creatorShare: undefined,
        trainerShare: undefined,
        mandatoryRequirements: undefined,
        approvedTrainers: 0,
        learners: enrolledCount,
        averageFill: undefined,
        rating: ratings.average?.toFixed(1),
        reviews: ratings.total ?? undefined,
        pendingApplications: undefined,
    } as Record<string, any>;

    // Build a CourseStats-like object from program data so we can reuse
    // `KpiBand` (shared with courses) and display the same cards where
    // figures exist. Missing figures are left undefined so the band omits
    // their tiles.
    const enrollmentsTotal =
        (enrollmentsQ.data?.data?.metadata?.totalElements as bigint | undefined) !== undefined
            ? Number(enrollmentsQ.data?.data?.metadata?.totalElements)
            : enrollments.length;

    const stats = useMemo(() => {
        return {
            public: {
                learners_trained: enrollmentsTotal ?? 0,
                classes_running: 0,
                completion_rate: 0,
                average_rating: ratings.average ?? 0,
                total_reviews: ratings.total ?? 0,
                approved_trainer_count: 0,
            },
            scoped: 0,
            owner: undefined,
        } as any;
    }, [enrollmentsTotal, ratings]);

    const statsLoading = programQ.isLoading || enrollmentsQ.isLoading || reviewsQ.isLoading;
    const statsError = programQ.error ?? enrollmentsQ.error ?? reviewsQ.error;

    const kpiBand = (
        <KpiBand
            access={access}
            stats={stats}
            currency={COURSE_DEFAULT_CURRENCY}
            priceFrom={program?.price ?? undefined}
            classesOpenNow={undefined}
            nextClassStarts={undefined}
            loading={statsLoading}
            error={statsError as any}
        />
    );

    // Build tab panels using the course-record blocks where possible
    const overviewPanel = (
        <OverviewTab
            access={access}
            description={program?.description}
            objectives={(program?.objectives ?? '').split('\n')}
            prerequisites={(program?.prerequisites ?? '').split('\n')}
            fitVars={vars}
            requirements={undefined}
            requirementsAsync={{ loading: false, error: undefined }}
        />
    );

    const curriculumPanel = (
        <div className='flex flex-col gap-5'>
            {courseCurricula.length === 0 ? (
                <div className='text-muted-foreground rounded-[12px] border border-dashed px-4 py-6 text-sm'>
                    No courses have been added to this program yet.
                </div>
            ) : (
                courseCurricula.map(({ course, lessons }, index) => (
                    <div key={course?.uuid ?? `course-${index}`} className='space-y-3'>
                        <div className='border-border bg-muted/40 rounded-[12px] border px-3 py-2.5'>
                            <h3 className='text-foreground text-sm font-semibold sm:text-base'>
                                {course?.name ?? `Course ${index + 1}`}
                            </h3>
                        </div>

                        <CurriculumTab
                            access={access}
                            lessons={lessons}
                            lessonCount={lessons.length}
                            contentItemCount={lessons.reduce((sum, lesson) => sum + (lesson.items?.length ?? 0), 0)}
                            onReadItem={onReadItem}
                        />
                    </div>
                ))
            )}
        </div>
    );

    const deliveryPanel = <DeliveryTab access={access} trainers={[]} trainersAsync={{ loading: false }} classes={[]} classesAsync={{ loading: false }} classesAcceptingCount={0} />;

    const programCommercialCourse = useMemo(() => ({
        ...program,
        name: program?.title ?? 'Program',
        price: program?.price ?? 0,
        minimum_training_fee: program?.price ?? 0,
        creator_share_percentage: 60,
        instructor_share_percentage: 40,
    }) as any, [program]);

    const programCommercialStats = useMemo(() => ({
        public: {
            learners_trained: enrollmentsTotal,
            classes_running: 0,
            completion_rate: 0,
            average_class_fill: 0,
            average_rating: ratings.average ?? 0,
            total_reviews: ratings.total ?? 0,
            approved_trainer_count: 0,
        },
        owner: {
            total_enrollments: enrollmentsTotal,
            gross_sales: Math.max((program?.price ?? 0) * Math.max(enrollmentsTotal, 0), 0),
            platform_fee: Math.max(((program?.price ?? 0) * Math.max(enrollmentsTotal, 0)) * 0.1, 0),
            paid_orders: enrollmentsTotal,
            refunded_orders: 0,
        },
    }) as any, [enrollmentsTotal, program?.price, ratings.average, ratings.total]);

    const commercialsPanel = (
        <CommercialsTab
            access={access}
            course={programCommercialCourse}
            stats={programCommercialStats}
            statsAsync={{ loading: false }}
            trainers={[]}
            trainersAsync={{ loading: false }}
            orders={[]}
            ordersAsync={{ loading: false }}
            currency={COURSE_DEFAULT_CURRENCY}
        />
    );

    const reviewsPanel = <ReviewsTab reviews={reviews} reviewerNames={reviewerNames ?? resolvedReviewerNames} />;

    const activityPanel = <ActivityTab access={access} />;

    const tabPanels: Partial<Record<string, ReactNode>> = {
        overview: overviewPanel,
        curriculum: curriculumPanel,
        delivery: deliveryPanel,
        commercials: commercialsPanel,
        reviews: reviewsPanel,
        activity: activityPanel,
    };

    const tabCounts: Partial<Record<string, number>> = {
        curriculum: lessonCount,
        reviews: reviews.length,
    };

    const handleShare = useCallback(() => {
        if (!programUuid) return;
        const url = absoluteUrl(publicCourseUrl(programUuid));
        navigator.clipboard.writeText(url).then(() => toast.success('Link copied to clipboard'));
    }, [programUuid]);

    const rail = useMemo(() => {
        const cards: ReactNode[] = [
            <AccessCard key='access' access={access} vars={vars} />,
            <GlanceCard key='glance' access={access} vars={vars} />,
        ];

        if (access === 'creator') {
            cards.push(
                <OwnerDecisionsPanel key='ownerDecisions' applications={[]} />,
                <ActionsCard key='actions' access={access} vars={vars} actions={actions} />
            );
            return cards;
        }

        cards.push(<ActionsCard key='actions' access={access} vars={vars} actions={actions} />);
        return cards;
    }, [access, actions, vars]);

    return (
        <>
            <CourseRecordView
                access={access}
                className={className}
                courseName={program?.title}
                backHref={backHref}
                onShare={onShare ?? handleShare}
                onExport={onExport}
                primaryAction={primaryAction}
                onPrimaryAction={onPrimaryAction}
                hero={{
                    title: program?.title,
                    summary: program?.description ?? undefined,
                    categories: categoryName ? [categoryName] : undefined,
                    status: program?.status,
                    creatorName: program?.created_by ?? undefined,
                    creatorRole: undefined,
                    averageRating: ratings.average,
                    totalReviews: ratings.total,
                    enrolledCount,
                    lessonCount,
                    contentItemCount,
                    contentCountNote: undefined,
                    duration: program?.total_duration_display ?? undefined,
                    level: program?.program_type ?? undefined,
                }}
                kpiBand={kpiBand}
                progressStrip={undefined}
                gateBanner={<GateBanner access={access} vars={vars} />}
                rail={rail}
                tabPanels={tabPanels as any}
                tabCounts={tabCounts as any}
            />

            <LessonContentViewerDialog open={false} onOpenChange={() => { }} content={null} />
        </>
    );
}

export default ProgramRecordPage;
