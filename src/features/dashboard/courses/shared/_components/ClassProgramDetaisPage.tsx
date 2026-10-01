'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Layers3,
  MoveRight,
  Share2,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import { type EntityFact, EntityHeaderCard } from '@/components/data-display/entity-header-card';
import { surfaceTheme } from '@/components/data-display/page-shell';
import {
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  useSectionTab,
} from '@/components/data-display/section-tabs';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useAssignmentsByLessonIds,
  useCourseAssessmentsByCourseUuids,
  useQuizzesByLessonIds,
  useStudentsByIds,
} from '@/hooks/use-batched-lookups';
import type { CombinedClassDetailsData } from '@/hooks/use-class-details';
import {
  type CourseLessonWithContent,
  useCourseLessonsWithContent,
} from '@/hooks/use-courselessonwithcontent';
import { cn } from '@/lib/utils';
import type { Course, ProgramReview } from '@/services/client';
import {
  getProgramCoursesOptions,
  getProgramReviewsOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { AssessmentTab, CurriculumTab, ReviewsTab } from '@/src/features/course-record';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { EnrollmentLoadingState } from '@/src/features/dashboard/courses/components/EnrollmentLoadingState';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  averageRating,
  CLASS_HUB_TAB_LABELS,
  CLASS_PROGRAM_TABS,
  type ClassHubViewer,
  type ClassProgramTab,
  reviewerNameMap,
  reviewerUuids,
  toBlockReviews,
  toCurriculumLessons,
} from './class-hub';
import {
  AssignmentQuizCounts,
  ClassHeaderMedia,
  ClassInstructorCard,
  ClassSchedulePanel,
  DeleteClassButton,
  ShareLinkSheet,
  WriteReviewButton,
} from './class-hub-parts';

type LessonsByCourse = Record<string, CourseLessonWithContent[]>;

/* Lessons across every bundled course ------------------------------------------------- */
//
// `useCourseLessonsWithContent` is a hook, so it cannot run inside a `.map()` over a list
// of course uuids that changes size. Each course gets an invisible runner component that
// calls the hook once and reports up through a stable callback; React mounts and unmounts
// runners with the list without breaking the rules of hooks.

type RunnerState = {
  lessons: CourseLessonWithContent[];
  isLoading: boolean;
  isFetching: boolean;
};

/**
 * The hook returns a fresh `lessons` array every render, so the runner forwards a
 * content-derived signature instead of the array identity, or it would loop forever.
 */
function getLessonsSignature(lessons: CourseLessonWithContent[]): string {
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
  const { isLoading, isFetching, lessons } = useCourseLessonsWithContent({ courseUuid });
  const typedLessons = lessons ?? [];
  const signature = getLessonsSignature(typedLessons);

  useEffect(() => {
    onChange(courseUuid, {
      lessons: typedLessons,
      isLoading: Boolean(isLoading),
      isFetching: Boolean(isFetching),
    });
  }, [courseUuid, signature, isLoading, isFetching, onChange]);

  return null;
}

function useAggregatedCourseLessons(courseUuids: string[]) {
  const [stateByUuid, setStateByUuid] = useState<Record<string, RunnerState>>({});

  const handleChange = useCallback((uuid: string, state: RunnerState) => {
    setStateByUuid(prev => {
      const existing = prev[uuid];
      const sameLoading =
        existing?.isLoading === state.isLoading && existing?.isFetching === state.isFetching;
      const sameLessons =
        existing && getLessonsSignature(existing.lessons) === getLessonsSignature(state.lessons);
      if (existing && sameLoading && sameLessons) return prev;
      return { ...prev, [uuid]: state };
    });
  }, []);

  const lessonsByCourse = useMemo(() => {
    const map: LessonsByCourse = {};
    for (const uuid of courseUuids) map[uuid] = stateByUuid[uuid]?.lessons ?? [];
    return map;
  }, [courseUuids, stateByUuid]);

  const isLoading =
    courseUuids.length > 0 && courseUuids.some(uuid => stateByUuid[uuid]?.isLoading ?? true);
  const isFetching =
    courseUuids.length > 0 && courseUuids.some(uuid => stateByUuid[uuid]?.isFetching ?? true);

  const runners = courseUuids.map(uuid => (
    <CourseLessonsRunner key={uuid} courseUuid={uuid} onChange={handleChange} />
  ));

  return { lessonsByCourse, isLoading, isFetching, runners };
}

/* Page ------------------------------------------------------------------------------- */

/**
 * A class that runs a programme: header card, then Overview · Curriculum · Courses ·
 * Assessment · Requirements · Schedule · Reviews.
 */
export default function ClassProgramDetailsPage({
  programId,
  classData,
  viewer,
}: {
  programId: string;
  classData: CombinedClassDetailsData;
  viewer: ClassHubViewer;
}) {
  const router = useRouter();
  const { activeDomain } = useUserDomain();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(CLASS_PROGRAM_TABS, 'overview');
  const [shareOpen, setShareOpen] = useState(false);
  const [siteOrigin, setSiteOrigin] = useState('');

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  /* ── data ──────────────────────────────────────────────────────────── */

  const programQuery = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programId } }),
    enabled: !!programId,
  });
  const program = programQuery.data?.data;

  const programCoursesQuery = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programId } }),
    enabled: !!programId,
  });
  const programCourses: Course[] = useMemo(
    () => programCoursesQuery.data?.data ?? [],
    [programCoursesQuery.data]
  );
  const courseUuids = useMemo(
    () => programCourses.map(course => course.uuid).filter((uuid): uuid is string => !!uuid),
    [programCourses]
  );

  const { assessmentMap, isLoading: assessmentsLoading } =
    useCourseAssessmentsByCourseUuids(courseUuids);

  const reviewsQuery = useQuery({
    ...getProgramReviewsOptions({ path: { programUuid: programId }, query: { pageable: {} } }),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  // The generated type drops the response envelope; the page sits under `data`.
  const reviews = useMemo(
    () =>
      (reviewsQuery.data as unknown as { data?: { content?: ProgramReview[] } } | undefined)?.data
        ?.content ?? [],
    [reviewsQuery.data]
  );
  const blockReviews = useMemo(() => toBlockReviews(reviews), [reviews]);
  const reviewerIds = useMemo(() => reviewerUuids(reviews), [reviews]);
  const { studentMap } = useStudentsByIds(reviewerIds);
  const avgRating = averageRating(reviews);

  const {
    lessonsByCourse,
    isLoading: lessonsLoading,
    isFetching: lessonsFetching,
    runners,
  } = useAggregatedCourseLessons(courseUuids);

  const lessonUuids = useMemo(
    () =>
      Object.values(lessonsByCourse)
        .flat()
        .map(item => item.lesson?.uuid)
        .filter((uuid): uuid is string => !!uuid),
    [lessonsByCourse]
  );
  const { items: assignments, isLoading: assignmentLoading } =
    useAssignmentsByLessonIds(lessonUuids);
  const { items: quizzes, isLoading: quizzesLoading } = useQuizzesByLessonIds(lessonUuids);

  const curriculumByCourse = useMemo(() => {
    const map: Record<string, ReturnType<typeof toCurriculumLessons>> = {};
    for (const [uuid, lessons] of Object.entries(lessonsByCourse)) {
      map[uuid] = toCurriculumLessons(lessons);
    }
    return map;
  }, [lessonsByCourse]);

  const aggregatedRequirements = useMemo(
    () => programCourses.flatMap(course => course.training_requirements ?? []),
    [programCourses]
  );

  const programShareLink = siteOrigin
    ? `${siteOrigin}${roleScopedDashboardPath(
        activeDomain,
        `/dashboard/courses/available-programs/${programId}`
      )}`
    : '';

  const isEverythingReady = !(
    programQuery.isLoading ||
    programQuery.isFetching ||
    programCoursesQuery.isLoading ||
    reviewsQuery.isLoading ||
    assignmentLoading ||
    quizzesLoading ||
    lessonsLoading ||
    lessonsFetching
  );

  let body: ReactNode;
  if (!isEverythingReady) {
    body = (
      <EnrollmentLoadingState
        title='Loading your program details'
        description='We are gathering courses, lessons, tasks, quizzes, and program information so the full learning overview is ready when the page opens.'
      />
    );
  } else if (!program) {
    body = (
      <div className='border-border mx-auto max-w-3xl rounded-xl border border-dashed p-10 text-center'>
        <h1 className='text-foreground text-xl font-semibold'>Program not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          The program you are trying to open could not be found.
        </p>
      </div>
    );
  } else {
    const totalLessons = lessonUuids.length;
    const assessmentCount = assignments.length + quizzes.length;
    const assessmentRowCount = Object.values(assessmentMap).flat().length;
    const enrolledCount = new Set((classData.enrollments ?? []).map(item => item.student_uuid))
      .size;
    const sessionCount = classData.schedule?.length ?? 0;
    const priceLabel =
      typeof program.price === 'number' && program.price > 0
        ? `From Ksh ${program.price.toLocaleString()}`
        : 'Pricing not set';

    const facts: EntityFact[] = [
      { key: 'courses', icon: Layers3, value: programCourses.length, label: 'courses' },
      { key: 'lessons', icon: BookOpen, value: totalLessons, label: 'lessons' },
      { key: 'assessments', icon: FileCheck, value: assessmentCount, label: 'assessments' },
      { key: 'sessions', icon: CalendarClock, value: sessionCount, label: 'sessions' },
      {
        key: 'enrolled',
        icon: Users,
        value: enrolledCount,
        label: `enrolled · limit ${program.class_limit ?? 'open'}`,
      },
    ];
    if (avgRating !== null) {
      facts.push({
        key: 'rating',
        icon: Star,
        value: avgRating.toFixed(1),
        label: `from ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`,
      });
    }

    const tabCounts: Partial<Record<ClassProgramTab, number>> = {
      curriculum: totalLessons,
      courses: programCourses.length,
      assessment: assessmentRowCount,
      requirements: aggregatedRequirements.length,
      schedule: sessionCount,
      reviews: reviews.length,
    };
    const tabs: SectionTab<ClassProgramTab>[] = CLASS_PROGRAM_TABS.map(id => ({
      id,
      label: CLASS_HUB_TAB_LABELS[id],
      count: tabCounts[id] ?? null,
    }));
    const access = viewer === 'instructor' ? 'instructor' : 'student';

    body = (
      <>
        <EntityHeaderCard
          title={classData.class?.title ?? program.title}
          eyebrow='Programme class'
          badges={
            <>
              <Badge variant='secondary'>{program.program_type || 'General'}</Badge>
              {program.status === 'published' ? (
                <Badge variant='outline'>Published programme</Badge>
              ) : null}
            </>
          }
          context={
            <span className='text-muted-foreground'>
              Programme <b className='text-foreground font-semibold'>{program.title}</b>
            </span>
          }
          facts={facts}
          media={
            <ClassHeaderMedia classData={classData} fallbackIcon={Layers3} label='Programme' />
          }
          aside={
            <div className='bg-muted/30 flex h-full flex-col gap-3 rounded-xl border p-4'>
              <p className='text-muted-foreground text-sm font-medium'>Enroll in this program</p>
              <p className='text-foreground text-2xl font-black'>{priceLabel}</p>
              <Button
                className='gap-2'
                onClick={() =>
                  router.push(
                    roleScopedDashboardPath(
                      activeDomain,
                      `/dashboard/courses/available-programs/${programId}`
                    )
                  )
                }
              >
                Enroll Now
                <MoveRight className='h-4 w-4' />
              </Button>
            </div>
          }
          actions={
            <>
              <Button
                variant='outline'
                size='sm'
                className='gap-2'
                onClick={() => setShareOpen(true)}
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
          label='Programme class sections'
          sticky
        >
          <SectionTabPanel value='overview'>
            <div className='flex flex-col gap-[18px]'>
              <ProgramAbout description={program.description} objectives={program.objectives} />
              <ClassInstructorCard classData={classData} />
            </div>
          </SectionTabPanel>

          <SectionTabPanel value='curriculum'>
            {programCourses.length === 0 ? (
              <EmptyCard>No courses have been added to this program yet.</EmptyCard>
            ) : (
              <div className='flex flex-col gap-6'>
                {programCourses.map((course, index) => (
                  <section key={course.uuid ?? index} className='flex flex-col gap-3'>
                    <CourseHeading index={index} name={course.name} />
                    <CurriculumTab
                      access={access}
                      lessons={curriculumByCourse[course.uuid ?? ''] ?? []}
                    />
                  </section>
                ))}
              </div>
            )}
          </SectionTabPanel>

          <SectionTabPanel value='courses'>
            <ProgramBundledCourses courses={programCourses} lessonsByCourse={lessonsByCourse} />
          </SectionTabPanel>

          <SectionTabPanel value='assessment'>
            <div className='flex flex-col gap-6'>
              {programCourses.map((course, index) => (
                <section key={course.uuid ?? index} className='flex flex-col gap-3'>
                  <CourseHeading index={index} name={course.name} />
                  <AssessmentTab
                    assessments={assessmentMap[course.uuid ?? ''] ?? []}
                    loading={assessmentsLoading}
                  />
                </section>
              ))}
              <AssignmentQuizCounts assignments={assignments.length} quizzes={quizzes.length} />
            </div>
          </SectionTabPanel>

          <SectionTabPanel value='requirements'>
            <CourseTrainingRequirements
              requirements={aggregatedRequirements}
              title='Program Training Requirements'
              description='Review what you need to prepare before registering for this program, combined across all its courses.'
              className='rounded-xl'
              viewerRole={viewer}
            />
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
                  <WriteReviewButton subject='program' subjectUuid={programId} />
                </div>
              ) : null}
              <ReviewsTab
                reviews={blockReviews}
                reviewerNames={reviewerNameMap(studentMap)}
                loading={reviewsQuery.isLoading}
                error={reviewsQuery.error}
                onRetry={() => reviewsQuery.refetch()}
              />
            </div>
          </SectionTabPanel>
        </SectionTabs>

        <ShareLinkSheet
          open={shareOpen}
          onOpenChange={setShareOpen}
          title='Share Program'
          description='Share this program with other learners and instructors.'
          linkTitle='Program Link'
          url={programShareLink}
          shareTitle={program.title ?? 'Program'}
          shareDescription={`Check out this program: ${program.title}`}
        />
      </>
    );
  }

  return (
    <main className={cn(surfaceTheme.pageWide, 'flex flex-col gap-[18px] py-5')}>
      {runners}
      {body}
    </main>
  );
}

/* Panels ----------------------------------------------------------------------------- */

function splitBullets(value?: string | null) {
  if (!value) return [];
  return value
    .split(/\n|•|-/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function ProgramAbout({
  description,
  objectives,
}: {
  description?: string | null;
  objectives?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const learnings = splitBullets(objectives || description);
  const long = (description?.length ?? 0) > 260;

  return (
    <div className='grid gap-[18px] xl:grid-cols-2'>
      <section className='bg-card rounded-xl border px-5 py-[18px] shadow-sm'>
        <h3 className='flex items-center gap-2 text-[15px] font-bold'>
          <Sparkles className='text-primary size-4' aria-hidden />
          About this program
        </h3>
        <div className='text-muted-foreground mt-2.5 max-w-prose text-sm leading-relaxed'>
          <HTMLTextPreview
            htmlContent={expanded || !long ? description || '' : (description ?? '').slice(0, 260)}
          />
          {long ? (
            <button
              type='button'
              onClick={() => setExpanded(prev => !prev)}
              className='text-primary hover:text-primary/80 mt-2 inline-flex items-center gap-1 text-sm font-medium transition-colors'
            >
              {expanded ? 'Show less' : 'Show more'}
              {expanded ? (
                <ChevronUp className='h-3.5 w-3.5' />
              ) : (
                <ChevronDown className='h-3.5 w-3.5' />
              )}
            </button>
          ) : null}
        </div>
      </section>

      <section className='bg-card rounded-xl border px-5 py-[18px] shadow-sm'>
        <h3 className='mb-3 flex items-center gap-2 text-[15px] font-bold'>
          <Target className='text-primary size-4' aria-hidden />
          What you&apos;ll learn
        </h3>
        <ul className='grid gap-2 sm:grid-cols-2'>
          {(learnings.length > 0 ? learnings : ['Learn the key concepts across this program']).map(
            item => (
              <li key={item} className='flex items-start gap-2'>
                <CheckCircle2 className='text-success mt-0.5 h-4 w-4 shrink-0' />
                <div className='text-muted-foreground text-sm'>
                  <HTMLTextPreview htmlContent={item} />
                </div>
              </li>
            )
          )}
        </ul>
      </section>
    </div>
  );
}

function CourseHeading({ index, name }: { index: number; name?: string }) {
  return (
    <div className='flex items-center gap-2'>
      <span className='bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
        {index + 1}
      </span>
      <h3 className='text-foreground text-base font-bold'>{name || 'Untitled course'}</h3>
    </div>
  );
}

function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className='text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm'>
      <BookOpen className='text-muted-foreground/40 mx-auto mb-3 h-8 w-8' />
      {children}
    </div>
  );
}

function ProgramBundledCourses({
  courses,
  lessonsByCourse,
}: {
  courses: Course[];
  lessonsByCourse: LessonsByCourse;
}) {
  if (courses.length === 0) {
    return <EmptyCard>No courses have been bundled into this program yet.</EmptyCard>;
  }

  return (
    <div className={surfaceTheme.cardGrid}>
      {courses.map((course, index) => {
        const lessonCount = (lessonsByCourse[course.uuid ?? ''] ?? []).length;
        const image = toAuthenticatedMediaUrl(course.banner_url || course.thumbnail_url);

        return (
          <article
            key={course.uuid ?? index}
            className='bg-card overflow-hidden rounded-xl border transition-shadow hover:shadow-md'
          >
            <div className='bg-muted relative aspect-video overflow-hidden'>
              {image ? (
                <img src={image} alt='' className='h-full w-full object-cover' />
              ) : (
                <div className='flex h-full w-full items-center justify-center'>
                  <BookOpen className='text-muted-foreground/40 h-8 w-8' />
                </div>
              )}
              <span className='bg-primary/90 text-primary-foreground absolute top-2 left-2 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold'>
                {index + 1}
              </span>
            </div>

            <div className='p-4'>
              <h3 className='text-foreground text-sm font-bold sm:text-base'>
                {course.name || 'Untitled course'}
              </h3>
              <p className='text-muted-foreground mt-1.5 line-clamp-2 text-xs sm:text-sm'>
                {course.description
                  ? course.description.replace(/<[^>]*>/g, '')
                  : 'No description available.'}
              </p>
              <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-xs'>
                <span className='flex items-center gap-1'>
                  <BookOpen className='h-3.5 w-3.5' />
                  {lessonCount} lessons
                </span>
                {typeof course.minimum_training_fee === 'number' ? (
                  <span className='text-foreground font-semibold'>
                    From Ksh {course.minimum_training_fee.toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
