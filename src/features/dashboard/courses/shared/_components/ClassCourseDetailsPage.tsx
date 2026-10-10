'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarClock,
  Clock,
  FileCheck,
  MoveRight,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AsyncSection } from '@/components/data/async-section';
import { LazySection } from '@/components/data/lazy-section';
import { type EntityFact, EntityHeaderCard } from '@/components/data-display/entity-header-card';
import { surfaceTheme } from '@/components/data-display/page-shell';
import {
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  useSectionTab,
} from '@/components/data-display/section-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAssignmentsByLessonIds,
  useQuizzesByLessonIds,
  useStudentsByIds,
} from '@/hooks/use-batched-lookups';
import type { CombinedClassDetailsData } from '@/hooks/use-class-details';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { STALE_TIMES } from '@/lib/query-client';
import type { UserDomain } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  getAllDifficultyLevelsOptions,
  getClassReviewsOptions,
  getCourseAssessmentsOptions,
  getCourseCreatorByUuidOptions,
  searchCoursesAndProgrammesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { allCourseTrainingRequirementsOptions } from '@/services/course-training-requirements';
import { LOCATION_TYPE_LABELS, SESSION_FORMAT_LABELS } from '@/src/features/catalogue/course-page';
import {
  AssessmentTab,
  CurriculumTab,
  courseBulletLines,
  OverviewTab,
  ReviewsTab,
} from '@/src/features/course-record';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import StudentsAlsoBought from '@/src/features/dashboard/courses/shared/_components/StudentsAlsoBought';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { 
  averageRating,
  CLASS_COURSE_TABS,
  CLASS_HUB_TAB_LABELS,
  type ClassCourseTab,
  type ClassHubViewer,enumLabel, 
  reviewerNameMap,
  reviewerUuids,
  scheduleTotalDuration,
  scheduleWeekSpan,
  toBlockReviews,
  toCurriculumLessons,} from './class-hub';
import {
  AssignmentQuizCounts,
  ClassHeaderMedia,
  ClassInstructorCard,
  ClassSchedulePanel,
  DeleteClassButton,
  ShareLinkSheet,
  WriteReviewButton,
} from './class-hub-parts';

/** A class that runs one course: header card, then Overview · Curriculum · Assessment · Schedule · Reviews. */
export default function ClassCourseDetailsPage({
  classData,
  viewer,
}: {
  classData: CombinedClassDetailsData;
  viewer: ClassHubViewer;
}) {
  const router = useRouter();
  const { activeDomain } = useUserDomain();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(CLASS_COURSE_TABS, 'overview');
  const [inviteOpen, setInviteOpen] = useState(false);

  const course = classData.course;
  const courseUuid = course?.uuid ?? '';
  const classId = classData.class?.uuid ?? '';

  /* ── data ──────────────────────────────────────────────────────────── */

  const requirementsQuery = useQuery({
    ...allCourseTrainingRequirementsOptions(courseUuid),
    enabled: !!courseUuid,
  });

  const assessmentsQuery = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid },
      query: { pageable: {} },
    }),
    enabled: !!courseUuid && tab === 'assessment',
  });
  const assessmentScheme = assessmentsQuery.data?.data?.content ?? [];

  const { data: creatorResponse, isLoading: creatorLoading } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid as string } }),
    enabled: !!course?.course_creator_uuid,
  });
  // The generated type drops the response envelope; the payload sits under `data`.
  const creatorName =
    (creatorResponse as unknown as { data?: { full_name?: string } } | undefined)?.data
      ?.full_name ?? '';

  const classReviewsQuery = useQuery({
    ...getClassReviewsOptions({ path: { uuid: classId }, query: { pageable: {} } }),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const classReviews = useMemo(
    () => classReviewsQuery.data?.data?.content ?? [],
    [classReviewsQuery.data]
  );
  const blockReviews = useMemo(() => toBlockReviews(classReviews), [classReviews]);
  const reviewerIds = useMemo(() => reviewerUuids(classReviews), [classReviews]);
  const { studentMap } = useStudentsByIds(reviewerIds);
  const avgRating = averageRating(classReviews);

  const { data: difficultyResponse, isLoading: difficultyLoading } = useQuery(
    getAllDifficultyLevelsOptions()
  );
  const difficultyName =
    (difficultyResponse?.data ?? []).find(level => level.uuid === course?.difficulty_uuid)?.name ??
    null;

  // Lesson bodies load only once the curriculum tab opens; the list is seeded by useClassDetails.
  const {
    isLessonListLoading: lessonsLoading,
    lessons: lessonsWithContent,
  } = useCourseLessonsWithContent({ courseUuid, contentEnabled: tab === 'curriculum' });

  const curriculumLessons = useMemo(
    () => toCurriculumLessons(lessonsWithContent),
    [lessonsWithContent]
  );
  const lessonUuids = useMemo(
    () =>
      (lessonsWithContent ?? [])
        .map(item => item.lesson?.uuid)
        .filter((uuid): uuid is string => !!uuid),
    [lessonsWithContent]
  );
  const contentItemCount = useMemo(
    () =>
      lessonsWithContent?.length && lessonsWithContent.every(item => item.content)
        ? lessonsWithContent.reduce((sum, item) => sum + (item.content?.data?.length ?? 0), 0)
        : undefined,
    [lessonsWithContent]
  );

  // Quiz and assignment searches wait for a tab that shows them, then stay on once seen.
  const lessonAssessmentsTab = tab === 'assessment' || tab === 'curriculum';
  const [lessonAssessmentsWanted, setLessonAssessmentsWanted] = useState(lessonAssessmentsTab);
  if (lessonAssessmentsTab && !lessonAssessmentsWanted) setLessonAssessmentsWanted(true);
  const assessmentLessonUuids = lessonAssessmentsWanted ? lessonUuids : NO_LESSONS;
  const { items: quizzes, isLoading: quizzesLoading } =
    useQuizzesByLessonIds(assessmentLessonUuids);
  const { items: assignments, isLoading: assignmentLoading } =
    useAssignmentsByLessonIds(assessmentLessonUuids);
  const filteredAssignments = assignments.filter(item => lessonUuids.includes(item.lesson_uuid));
  const filteredQuizzes = quizzes.filter(item => lessonUuids.includes(item.lesson_uuid));

  const [siteOrigin, setSiteOrigin] = useState('');
  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);
  const registrationLink =
    siteOrigin && course?.uuid
      ? `${siteOrigin}/dashboard/student/courses/available-classes/${course.uuid}/enroll?id=${classId}`
      : '';

  /* ── header ────────────────────────────────────────────────────────── */

  const access = viewer === 'instructor' ? 'instructor' : 'student';
  const enrolledCount = new Set((classData.enrollments ?? []).map(item => item.student_uuid)).size;
  const sessionCount = classData.schedule?.length ?? 0;
  const assessmentCount = filteredAssignments.length + filteredQuizzes.length;
  const assessmentCountLoading = lessonsLoading || quizzesLoading || assignmentLoading;
  const factSkeleton = <Skeleton className='inline-block h-4 w-6 align-middle' />;

  const facts: EntityFact[] = [
    {
      key: 'schedule',
      icon: CalendarClock,
      value: sessionCount,
      label: `${sessionCount === 1 ? 'session' : 'sessions'} · ${scheduleTotalDuration(classData.schedule)}`,
    },
    { key: 'weeks', icon: Clock, value: scheduleWeekSpan(classData.schedule), label: 'weeks' },
    { key: 'enrolled', icon: Users, value: enrolledCount, label: 'enrolled' },
    {
      key: 'lessons',
      icon: BookOpen,
      value: lessonsLoading ? factSkeleton : curriculumLessons.length,
      label: 'lessons',
    },
    {
      key: 'assessments',
      icon: FileCheck,
      value: !lessonAssessmentsWanted
        ? undefined
        : assessmentCountLoading
          ? factSkeleton
          : assessmentCount,
      label: 'assessments',
    },
  ];
  if (avgRating !== null) {
    facts.push({
      key: 'rating',
      icon: Star,
      value: avgRating.toFixed(1),
      label: `from ${classReviews.length} ${classReviews.length === 1 ? 'review' : 'reviews'}`,
    });
  }

  const tabCounts: Partial<Record<ClassCourseTab, number>> = {
    curriculum: curriculumLessons.length,
    assessment: assessmentsQuery.data ? assessmentScheme.length : undefined,
    schedule: sessionCount,
    reviews: classReviews.length,
  };
  const tabs: SectionTab<ClassCourseTab>[] = CLASS_COURSE_TABS.map(id => ({
    id,
    label: CLASS_HUB_TAB_LABELS[id],
    count: tabCounts[id] ?? null,
  }));

  const instructorAside =
    viewer === 'instructor' ? (
      <div className='bg-muted/30 flex h-full flex-col gap-3 rounded-xl border p-4'>
        <p className='text-muted-foreground text-sm font-medium'>Enroll students in this class</p>
        <p className='text-foreground text-2xl font-black'>
          From Ksh {classData.class?.sale_price ?? 0}
        </p>
        <Button className='gap-2' onClick={() => setInviteOpen(true)}>
          Invite Students
          <MoveRight className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          onClick={() =>
            router.push(roleScopedDashboardPath(activeDomain, '/dashboard/skills-fund'))
          }
        >
          Apply for funding
        </Button>
      </div>
    ) : undefined;

  return (
    <main className={cn(surfaceTheme.pageWide, 'flex flex-col gap-[18px] py-5')}>
      <EntityHeaderCard
        title={classData.class?.title ?? course?.name ?? 'Class'}
        eyebrow='Class'
        badges={
          <>
            {difficultyLoading ? (
              <Skeleton className='h-5 w-16 rounded-full' />
            ) : difficultyName ? (
              <Badge variant='secondary'>{difficultyName}</Badge>
            ) : null}
            {classData.class?.location_type ? (
              <Badge variant='outline'>
                {enumLabel(LOCATION_TYPE_LABELS, classData.class.location_type)}
              </Badge>
            ) : null}
            {classData.class?.session_format ? (
              <Badge variant='outline'>
                {enumLabel(SESSION_FORMAT_LABELS, classData.class.session_format)}
              </Badge>
            ) : null}
          </>
        }
        context={
          <span className='text-muted-foreground'>
            Course <b className='text-foreground font-semibold'>{course?.name}</b>
            {creatorLoading ? (
              <>
                {' · by '}
                <Skeleton className='inline-block h-3.5 w-24 align-middle' />
              </>
            ) : creatorName ? (
              <> · by {creatorName}</>
            ) : null}
          </span>
        }
        facts={facts}
        media={<ClassHeaderMedia classData={classData} fallbackIcon={BookOpen} label='Class' />}
        aside={instructorAside}
        actions={
          <>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => setInviteOpen(true)}
            >
              <Share2 className='h-4 w-4' />
              Share
            </Button>
            {viewer === 'instructor' ? (
              <DeleteClassButton classData={classData} activeDomain={activeDomain ?? null} />
            ) : null}
          </>
        }
      />

      <SectionTabs
        tabs={tabs}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
        label='Class sections'
        sticky
      >
        <SectionTabPanel value='overview'>
          <div className='flex flex-col gap-[18px]'>
            <OverviewTab
              access={access}
              description={course?.description}
              objectives={courseBulletLines(course?.objectives)}
              prerequisites={courseBulletLines(course?.prerequisites)}
              requirements={requirementsQuery.data?.data?.content}
              // A learner gains nothing from an empty "no requirements" note meant for providers.
              hideRequirements={
                requirementsQuery.isSuccess && !requirementsQuery.data?.data?.content?.length
              }
              requirementsAsync={{
                loading: requirementsQuery.isLoading,
                error: requirementsQuery.error,
                onRetry: () => requirementsQuery.refetch(),
              }}
            />
            <ClassInstructorCard classData={classData} />
            {course?.course_creator_uuid ? (
              <LazySection skeleton={<div className='h-px' />}>
                <RelatedCreatorCourses
                  creatorUuid={course.course_creator_uuid}
                  courseUuid={courseUuid}
                  creatorName={creatorName}
                  activeDomain={activeDomain ?? null}
                />
              </LazySection>
            ) : null}
          </div>
        </SectionTabPanel>

        <SectionTabPanel value='curriculum'>
          <CurriculumTab
            access={access}
            lessons={curriculumLessons}
            contentItemCount={contentItemCount}
            loading={lessonsLoading}
          />
        </SectionTabPanel>

        <SectionTabPanel value='assessment'>
          <div className='flex flex-col gap-[18px]'>
            <AssessmentTab
              assessments={assessmentScheme}
              loading={assessmentsQuery.isLoading}
              error={assessmentsQuery.error}
              onRetry={() => assessmentsQuery.refetch()}
            />
            <AsyncSection
              name='class-assignment-quiz-counts'
              loading={assessmentCountLoading}
              skeleton={<Skeleton className='h-24 w-full rounded-xl' />}
            >
              <AssignmentQuizCounts
                assignments={filteredAssignments.length}
                quizzes={filteredQuizzes.length}
              />
            </AsyncSection>
          </div>
        </SectionTabPanel>

        <SectionTabPanel value='schedule'>
          <ClassSchedulePanel
            classData={classData}
            viewer={viewer}
            activeDomain={activeDomain ?? null}
          />
        </SectionTabPanel>

        <SectionTabPanel value='reviews'>
          <div className='flex flex-col gap-[18px]'>
            {viewer === 'student' ? (
              <div className='flex justify-end'>
                <WriteReviewButton subject='class' subjectUuid={classId} />
              </div>
            ) : null}
            <ReviewsTab
              reviews={blockReviews}
              reviewerNames={reviewerNameMap(studentMap)}
              loading={classReviewsQuery.isLoading}
              error={classReviewsQuery.error}
              onRetry={() => classReviewsQuery.refetch()}
            />
          </div>
        </SectionTabPanel>
      </SectionTabs>

      <ShareLinkSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title='Invite Student'
        description='Share this class with learners.'
        linkTitle='Class Registration Link'
        url={registrationLink}
        shareTitle={classData.class?.title ?? 'Class'}
        shareDescription={`Check out this class: ${classData.class?.title ?? ''}`}
      />
    </main>
  );
}

const NO_LESSONS: string[] = [];

/** Other courses by the same creator; mounted by LazySection so it loads near the viewport. */
function RelatedCreatorCourses({
  creatorUuid,
  courseUuid,
  creatorName,
  activeDomain,
}: {
  creatorUuid: string;
  courseUuid: string;
  creatorName: string;
  activeDomain: UserDomain | null;
}) {
  // The catalogue search returns rating and review counts inline, so no per-course review calls.
  const { data: relatedCoursesResponse, isLoading: relatedCoursesLoading } = useQuery({
    ...searchCoursesAndProgrammesOptions({
      query: { show: 'courses', creator_uuid: creatorUuid, sort: 'newest', size: '4' },
    }),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.reference,
    refetchOnWindowFocus: false,
  });
  const relatedCourses = useMemo(
    () =>
      (relatedCoursesResponse?.data?.content ?? [])
        .filter(item => item.uuid && item.uuid !== courseUuid)
        .slice(0, 3),
    [courseUuid, relatedCoursesResponse?.data?.content]
  );

  if (!relatedCoursesLoading && relatedCourses.length === 0) return null;

  return (
    <section className='bg-card rounded-xl border px-5 py-[18px] shadow-sm'>
      <AsyncSection
        name='class-related-courses'
        loading={relatedCoursesLoading}
        skeleton={<Skeleton className='h-48 w-full rounded-xl' />}
      >
        <StudentsAlsoBought
          courses={relatedCourses}
          activeDomain={activeDomain}
          creatorName={creatorName}
        />
      </AsyncSection>
    </section>
  );
}
