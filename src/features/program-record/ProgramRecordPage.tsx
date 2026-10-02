'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { type ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { CourseReview } from '@/services/client';
import {
  getCategoryByUuidOptions,
  getCourseCreatorByUuidOptions,
  getProgramCoursesOptions,
  getProgramEnrollmentsOptions,
  getProgramReviewsOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course } from '@/services/client/types.gen';
import {
  AccessCard,
  ActionsCard,
  ActivityTab,
  COURSE_DEFAULT_CURRENCY,
  CommercialsTab,
  type CourseCurriculumItem,
  type CourseCurriculumLesson,
  type CourseRailActionItem,
  DeliveryTab,
  GateBanner,
  GlanceCard,
  KpiBand,
  OverviewTab,
  OwnerDecisionsPanel,
  ReviewsTab,
  summarise,
} from '@/src/features/course-record/blocks';
import { CourseRecordView } from '@/src/features/course-record/CourseRecordView';
import type { CourseStats } from '@/src/features/course-record/types';
import {
  absoluteUrl,
  publicCourseUrl,
  routeSegmentFromPath,
} from '@/src/features/dashboard/lib/dashboard-url';
import { ProgramCurriculumPanel } from './ProgramCurriculumPanel';
import { ProgramEnrollmentsPanel } from './ProgramEnrollmentsPanel';

interface ProgramRecordPageProps {
  programUuid: string;
  /** Where the shell's back link goes. Omitted, the link is not rendered. */
  backHref?: string;
  /** The back link's text. */
  backLabel?: string;

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
  backLabel = 'Back to programmes',
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
  const courses = useMemo(
    () =>
      coursesQ.data?.error || coursesQ.data?.success === false ? [] : (coursesQ.data?.data ?? []),
    [coursesQ.data]
  );

  const enrollmentsQ = useQuery({
    ...getProgramEnrollmentsOptions({ path: { programUuid }, query: { pageable: {} } }),
    enabled: !!programUuid,
  });
  const enrollments = useMemo(
    () => enrollmentsQ.data?.data?.content ?? [],
    [enrollmentsQ.data]
  );

  const reviewsQ = useQuery({
    ...getProgramReviewsOptions({ path: { programUuid }, query: { pageable: {} } }),
    enabled: !!programUuid,
  });
  const reviews = useMemo(() => extractPage<CourseReview>(reviewsQ.data).items, [reviewsQ.data]);

  const categoryUuid = program?.category_uuid;
  const categoryQ = useQuery({
    ...getCategoryByUuidOptions({ path: { uuid: categoryUuid ?? '' } }),
    enabled: !!categoryUuid,
    staleTime: STALE_TIMES.reference,
  });
  const categoryName = categoryQ.data?.data?.name;

  // The byline names the creator, as the course record does; `created_by` is an email.
  const creatorUuid = program?.course_creator_uuid;
  const creatorQ = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: creatorUuid ?? '' } }),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.entity,
  });
  const creator = creatorQ.data;

  const segment = routeSegmentFromPath(usePathname());

  // Simple derived figures
  const enrolledCount = enrollments.length;

  // Reviews summary
  const ratings = useMemo(() => summarise(reviews), [reviews]);

  // Student names, in one batched lookup: the non-anonymous reviewers, and the
  // enrolled learners for the viewers who see the enrolment list.
  const showsEnrollments = segment !== 'student' && segment !== 'parent' && segment !== null;
  const studentIds = useMemo(() => {
    const ids = reviews
      .filter(
        (review: { is_anonymous?: boolean; student_uuid?: string | null }) => !review.is_anonymous
      )
      .map((review: { student_uuid?: string | null }) => review.student_uuid)
      .filter((studentUuid): studentUuid is string => Boolean(studentUuid));
    if (showsEnrollments) {
      for (const enrollment of enrollments) {
        if (enrollment.student_uuid) ids.push(enrollment.student_uuid);
      }
    }
    return [...new Set(ids)];
  }, [reviews, enrollments, showsEnrollments]);
  const { studentMap } = useStudentsByIds(studentIds);
  const resolvedReviewerNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(studentMap)) if (v?.full_name) m[k] = v.full_name;
    return m;
  }, [studentMap]);

  // Derive viewer access from the current dashboard path segment so the
  // ProgramRecordPage mirrors CourseRecordPage behaviour and shows creator/
  // instructor/admin views when opened on those dashboards.
  const access = (() => {
    switch (segment) {
      case 'course-creator':
        return 'creator' as const;
      case 'instructor':
        return 'instructor' as const;
      case 'organisation':
        return 'organisation' as const;
      case 'admin':
        return 'admin' as const;
      case 'student':
        return 'student' as const;
      case 'parent':
        return 'prospect' as const;
      default:
        return 'prospect' as const;
    }
  })();

  // Vars for capability copy interpolation — best-effort mapping
  const vars: Record<string, string | number | null | undefined> = {
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
    lessons: undefined,
    contentItems: undefined,
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
  };

  // Build a CourseStats-like object from program data so we can reuse
  // `KpiBand` (shared with courses) and display the same cards where
  // figures exist. Missing figures are left undefined so the band omits
  // their tiles.
  const enrollmentsTotal =
    (enrollmentsQ.data?.data?.metadata?.totalElements as bigint | undefined) !== undefined
      ? Number(enrollmentsQ.data?.data?.metadata?.totalElements)
      : enrollments.length;

  const stats = useMemo<CourseStats>(
    () => ({
      public: {
        learners_trained: enrollmentsTotal ?? 0,
        classes_running: 0,
        average_class_fill: 0,
        completion_rate: 0,
        average_rating: ratings.average ?? 0,
        total_reviews: ratings.total ?? 0,
        approved_trainer_count: 0,
      },
      scoped: undefined,
      owner: undefined,
    }),
    [enrollmentsTotal, ratings]
  );

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
      error={statsError}
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
    <ProgramCurriculumPanel
      key={programUuid}
      courses={courses}
      loading={coursesQ.isLoading}
      error={coursesQ.error || coursesQ.data?.error || coursesQ.data?.success === false}
      onRetry={() => void coursesQ.refetch()}
      onReadItem={onReadItem}
    />
  );

  const assessmentPanel = (
    <div className='flex flex-col gap-5'>
      <div className='text-muted-foreground rounded-[12px] border border-dashed px-4 py-6 text-sm'>
        No assessment have been added to this program yet.
      </div>
    </div>
  );

  const deliveryPanel = (
    <div className='flex flex-col gap-[22px]'>
      <DeliveryTab
        access={access}
        trainers={[]}
        trainersAsync={{ loading: false }}
        classes={[]}
        classesAsync={{ loading: false }}
        classesAcceptingCount={0}
      />
      {showsEnrollments ? (
        <ProgramEnrollmentsPanel
          enrollments={enrollments}
          studentNames={resolvedReviewerNames}
          total={enrollmentsTotal}
          loading={enrollmentsQ.isLoading}
          error={enrollmentsQ.error}
          onRetry={() => void enrollmentsQ.refetch()}
        />
      ) : null}
    </div>
  );

  const programCommercialCourse = useMemo<Course | undefined>(
    () =>
      program
        ? {
            ...program,
            name: program.title,
            duration_hours: program.total_duration_hours,
            duration_minutes: program.total_duration_minutes,
            price: program.price ?? 0,
            minimum_training_fee: program.price ?? 0,
            creator_share_percentage: 60,
            instructor_share_percentage: 40,
          }
        : undefined,
    [program]
  );

  const programCommercialStats = useMemo(
    () => ({
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
        platform_fee: Math.max((program?.price ?? 0) * Math.max(enrollmentsTotal, 0) * 0.1, 0),
        paid_orders: enrollmentsTotal,
        refunded_orders: 0,
      },
    }),
    [enrollmentsTotal, program?.price, ratings.average, ratings.total]
  );

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

  const reviewsPanel = (
    <ReviewsTab reviews={reviews} reviewerNames={reviewerNames ?? resolvedReviewerNames} />
  );

  const activityPanel = <ActivityTab access={access} />;

  const tabPanels: Partial<Record<string, ReactNode>> = {
    overview: overviewPanel,
    curriculum: curriculumPanel,
    assessment: assessmentPanel,
    delivery: deliveryPanel,
    commercials: commercialsPanel,
    reviews: reviewsPanel,
    activity: activityPanel,
  };

  const tabCounts: Partial<Record<string, number>> = {
    curriculum: coursesQ.isLoading ? undefined : courses.length,
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
        eyebrow='Programme'
        courseName={program?.title}
        backHref={backHref}
        backLabel={backLabel}
        onShare={onShare ?? handleShare}
        onExport={onExport}
        primaryAction={primaryAction}
        onPrimaryAction={onPrimaryAction}
        hero={{
          title: program?.title,
          summary: program?.description ?? undefined,
          categories: categoryName ? [categoryName] : undefined,
          status: program?.status,
          creatorName: creator?.full_name,
          creatorRole: creator?.professional_headline ?? undefined,
          averageRating: ratings.average,
          totalReviews: ratings.total,
          enrolledCount,
          contentCountNote: undefined,
          duration: program?.total_duration_display ?? undefined,
          level: program?.program_type ?? undefined,
          loading: programQ.isLoading,
          error: programQ.error ?? undefined,
          onRetry: () => void programQ.refetch(),
        }}
        kpiBand={kpiBand}
        progressStrip={undefined}
        gateBanner={<GateBanner access={access} vars={vars} />}
        rail={rail}
        tabPanels={tabPanels}
        tabCounts={tabCounts}
      />
    </>
  );
}
