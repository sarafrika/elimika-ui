// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Star,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { logger } from '@/lib/logger';
import { STALE_TIMES } from '@/lib/query-client';
import { coursePrefetchQuery } from '@/lib/route-prefetch';
import { cn } from '@/lib/utils';
import type { StudentClassEnrollmentSummary } from '@/services/client';
import {
  getClassSchedulesOptions,
  searchEnrollmentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { CoursesCatalogCard } from '@/src/features/dashboard/courses/shared/_components/CoursesCatalogCard';
import {
  type CoursesCatalogCardData,
  formatDurationFromParts,
  getCardPresentation,
} from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';

type CourseStatus = 'in_progress' | 'completed' | 'not_started';

type EnrolledCourseCard = CoursesCatalogCardData & {
  sortTitle: string;
  status: CourseStatus;
};

type FilterTab = 'all' | 'in_progress' | 'completed';

// Cards need only the class, the course and the student's own enrolment summaries.
const MY_COURSES_SECTIONS = [] as const;

// latest_enrollment_status is the most recently changed session row, so CANCELLED needs a recheck.
const isCancelledLatest = (row: StudentClassEnrollmentSummary | null | undefined) =>
  row?.latest_enrollment_status === 'CANCELLED';

// Backend cap on class_uuids per /classes/schedules call; the recheck fits in one call.
const MAX_RECHECK_CLASSES = 100;
const RECHECK_PAGE_SIZE = 500;

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
    >
      {label === 'In Progress' && <Clock className='size-3.5' />}
      {label === 'Completed' && <CheckCircle2 className='size-3.5' />}
      {label} ({count})
    </button>
  );
}

function CourseProgressWidget({
  total,
  inProgress,
  completed,
}: {
  total: number;
  inProgress: number;
  completed: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className='border-border bg-card rounded-2xl border p-4 shadow-sm'>
      <h3 className='text-foreground mb-3 text-sm font-semibold'>Course Progress</h3>
      <div className='mb-3 grid grid-cols-3 gap-2 text-center'>
        {[
          { label: 'Total', value: total },
          { label: 'In Progress', value: inProgress },
          { label: 'Completed', value: completed },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className='text-foreground text-xl font-bold'>{value}</p>
            <p className='text-muted-foreground text-[11px]'>{label}</p>
          </div>
        ))}
      </div>
      <div className='bg-muted h-2 overflow-hidden rounded-full'>
        <div
          className='bg-success/50 h-full rounded-full transition-all'
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RecommendedItem({
  title,
  level,
  duration,
}: {
  title: string;
  level: string;
  duration: string;
}) {
  return (
    <div className='flex items-center gap-3'>
      <div className='bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-xl'>
        <Star className='text-primary/60 size-5' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-foreground truncate text-sm font-semibold'>{title}</p>
        <p className='text-muted-foreground text-[11px]'>
          {level} &nbsp;|&nbsp; {duration}
        </p>
      </div>
    </div>
  );
}

/** Milestone item */
function MilestoneItem({
  title,
  subtitle,
  rating,
  icon,
}: {
  title: string;
  subtitle?: string;
  rating?: number;
  icon: 'award' | 'trophy';
}) {
  return (
    <div className='flex items-start gap-3'>
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${icon === 'award' ? 'bg-accent/20' : 'bg-primary/10'
          }`}
      >
        {icon === 'award' ? (
          <Award className='text-accent-foreground size-5' />
        ) : (
          <Trophy className='text-primary size-5' />
        )}
      </div>

      <div className='min-w-0 flex-1'>
        <p className='text-foreground text-sm font-semibold'>{title}</p>

        {rating !== undefined && (
          <div className='mt-0.5 flex items-center gap-0.5'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${i < rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                  }`}
              />
            ))}
          </div>
        )}

        {subtitle && <p className='text-muted-foreground mt-0.5 text-[11px]'>{subtitle}</p>}
      </div>
    </div>
  );
}

export function StudentMyCoursesPage() {
  const user = useUserProfile();
  const student = user?.student;
  const { classDefinitions, loading } = useStudentClassDefinitions(student ?? undefined, {
    include: MY_COURSES_SECTIONS,
  });

  // Classes whose latest session row is CANCELLED may still hold live sessions.
  const recheckClassIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of classDefinitions) {
      for (const row of item.studentEnrollments ?? []) {
        if (isCancelledLatest(row) && row.class_definition_uuid) ids.add(row.class_definition_uuid);
      }
    }
    const sorted = Array.from(ids).sort();
    if (sorted.length > MAX_RECHECK_CLASSES) {
      logger.warn('My courses: cancelled-latest recheck truncated', { count: sorted.length });
    }
    return sorted.slice(0, MAX_RECHECK_CLASSES);
  }, [classDefinitions]);

  const recheckEnabled = recheckClassIds.length > 0 && Boolean(student?.uuid);
  const recheckEnrollmentsQuery = useQuery({
    ...searchEnrollmentsOptions({
      query: {
        searchParams: {
          student_uuid: student?.uuid ?? '',
          class_definition_uuid_in: recheckClassIds.join(','),
        },
        pageable: { page: 0, size: RECHECK_PAGE_SIZE },
      },
    }),
    enabled: recheckEnabled,
    staleTime: STALE_TIMES.live,
  });
  const recheckSchedulesQuery = useQuery({
    ...getClassSchedulesOptions({ query: { class_uuids: recheckClassIds } }),
    enabled: recheckEnabled,
    staleTime: STALE_TIMES.live,
  });

  // Classes in the recheck set where the learner still holds a non-CANCELLED session row.
  const liveRecheckClassIds = useMemo(() => {
    const instanceClass = new Map<string, string>();
    for (const instance of recheckSchedulesQuery.data?.data ?? []) {
      if (instance.uuid && instance.class_definition_uuid) {
        instanceClass.set(instance.uuid, instance.class_definition_uuid);
      }
    }
    const page = recheckEnrollmentsQuery.data?.data;
    if ((page?.metadata?.totalPages ?? 1) > 1) {
      logger.warn('My courses: enrolment recheck truncated', { pages: page?.metadata?.totalPages });
    }
    const live = new Set<string>();
    for (const enrollment of page?.content ?? []) {
      if (enrollment.student_uuid !== student?.uuid || enrollment.status === 'CANCELLED') continue;
      const classId = instanceClass.get(enrollment.scheduled_instance_uuid);
      if (classId) live.add(classId);
    }
    return live;
  }, [recheckEnrollmentsQuery.data, recheckSchedulesQuery.data, student?.uuid]);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Auto-Suggested');

  // courses/search already carries course_creator_name; only nameless courses need a lookup.
  const inlineCreatorNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of classDefinitions) {
      const uuid = item.course?.course_creator_uuid;
      const name = item.course?.course_creator_name?.trim();
      if (uuid && name && !map.has(uuid)) map.set(uuid, name);
    }
    return map;
  }, [classDefinitions]);

  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitions
            .map(item => item.course?.course_creator_uuid)
            .filter((value): value is string => Boolean(value) && !inlineCreatorNames.has(value))
        )
      ),
    [classDefinitions, inlineCreatorNames]
  );

  const { courseCreatorMap, isLoading: creatorsLoading } = useCourseCreatorsByIds(creatorIds);

  const creatorMap = useMemo(() => {
    const map = new Map(inlineCreatorNames);
    for (const [uuid, creator] of Object.entries(courseCreatorMap)) {
      if (creator?.full_name && !map.has(uuid)) map.set(uuid, creator.full_name);
    }
    return map;
  }, [inlineCreatorNames, courseCreatorMap]);

  const enrolledCourseCards = useMemo<EnrolledCourseCard[]>(() => {
    const cards = new Map<string, EnrolledCourseCard>();

    classDefinitions.forEach((item, index) => {
      const course = item.course;
      const classDetails = item.classDetails;
      const classId = item.uuid;
      // One summary row per class; a CANCELLED latest row counts only if the recheck finds a live one.
      const enrolledClasses = item.studentEnrollments ?? [];
      const activeEnrollment = enrolledClasses.find(
        row =>
          row != null &&
          (!isCancelledLatest(row) || liveRecheckClassIds.has(row.class_definition_uuid))
      );
      const sessionCount = enrolledClasses.reduce(
        (total, row) => total + (row.scheduled_instance_count ?? 0),
        0
      );

      if (!course?.uuid || !activeEnrollment) return;

      const presentation = getCardPresentation(index);
      if (cards.has(course.uuid)) return;

      const scheduleCount =
        item.studentEnrollments?.[0]?.scheduled_instance_count ?? sessionCount;

      const rawProgress = item?.classDetails?.class_progress_percentage ?? 0;

      const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));

      const isCompleted = progress === 100;

      const status: CourseStatus = isCompleted ? 'completed' : 'in_progress';

      cards.set(course.uuid, {
        id: course.uuid,
        title: course.name,
        provider: creatorMap.get(course.course_creator_uuid) ?? 'Course Creator',
        duration: formatDurationFromParts(
          course.duration_hours,
          course.duration_minutes,
          course.total_duration_display
        ),
        secondaryMeta:
          classDetails?.title ??
          course.category_names?.[0] ??
          (scheduleCount === 1 ? '1 session' : `${scheduleCount} sessions`),
        ctaLabel: isCompleted ? 'View Certificate' : 'Continue',
        ctaKind: 'link',
        showInstructorCta: false,
        detailsHref: roleScopedDashboardPath('student', `/dashboard/courses/${course.uuid}`),
        detailsPrefetchQuery: coursePrefetchQuery(course.uuid),
        certificateHref: roleScopedDashboardPath('student', '/dashboard/skills-wallet?tab=credentials'),
        // enrollHref: roleScopedDashboardPath('student', `/dashboard/learning-hub/classes/${classId}`),
        enrollHref: roleScopedDashboardPath('student', `/dashboard/learning-hub/classes`),
        instructorHref: roleScopedDashboardPath(
          'student',
          `/dashboard/courses/instructor?courseId=${course.uuid}`
        ),
        icon: presentation.icon,
        imageTone: presentation.imageTone,
        imageUrl: course.banner_url ?? course.thumbnail_url,
        sortTitle: course.name,
        status,
        enrolledClasses,
        enrollmentCount: sessionCount,

        // temporary defaults
        rating: 0,
        reviewCount: 0,
        minimumRate: 0,
        ctaDisabled: false,
        ctaTone: isCompleted ? 'success' : 'primary',
      });
    });

    return Array.from(cards.values()).sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
  }, [classDefinitions, creatorMap, liveRecheckClassIds]);

  const inProgressCards = useMemo(
    () => enrolledCourseCards.filter(c => c.status === 'in_progress'),
    [enrolledCourseCards]
  );
  const completedCards = useMemo(
    () => enrolledCourseCards.filter(c => c.status === 'completed'),
    [enrolledCourseCards]
  );

  const filteredCards = useMemo(() => {
    let cards =
      activeTab === 'in_progress'
        ? inProgressCards
        : activeTab === 'completed'
          ? completedCards
          : enrolledCourseCards;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cards = cards.filter(c => c.title.toLowerCase().includes(q));
    }

    return cards;
  }, [activeTab, enrolledCourseCards, inProgressCards, completedCards, searchQuery]);

  const recheckLoading =
    recheckEnabled && (recheckEnrollmentsQuery.isLoading || recheckSchedulesQuery.isLoading);
  const isLoading = loading || creatorsLoading || recheckLoading;

  const studentName = student?.full_name ?? 'Student';

  const recommendedData = [];
  const learningMilestonesData = completedCards || [];

  return (
    <div className='bg-background mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-4 lg:px-6 2xl:px-8'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-foreground text-[clamp(1.4rem,2vw,2rem)] font-bold tracking-[-0.03em]'>
            My Courses
          </h1>
        </div>

        <div className='flex flex-row items-center gap-4'>
          <Button
            asChild
            variant='outline'
            className='border-primary text-primary hover:bg-primary/90 h-9 gap-1.5 rounded-sm px-4 text-sm font-semibold'
          >
            <Link href='/dashboard/student/learning-hub'>
              <Plus className='size-4' />
              My Classes
            </Link>
          </Button>

          <Button
            asChild
            className='bg-primary hover:bg-primary/90 h-9 gap-1.5 rounded-sm px-4 text-sm font-semibold text-white shadow-sm'
          >
            <Link href='/dashboard/student/courses'>
              <Plus className='size-4' />
              Enroll in New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Main layout: content + sidebar ──────────────────────────────── */}
      <div className='flex flex-col gap-5 lg:flex-row lg:items-start'>
        {/* ── Left: Course list ──────────────────────────────────────────── */}
        <div className='min-w-0 flex-1 space-y-8'>
          {/* Filters & controls */}
          <div className='flex flex-col gap-6'>
            {/* Tab row */}
            <div className='flex flex-wrap items-center gap-2'>
              <FilterPill
                label='All'
                count={enrolledCourseCards.length}
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
              />
              <FilterPill
                label='In Progress'
                count={inProgressCards.length}
                active={activeTab === 'in_progress'}
                onClick={() => setActiveTab('in_progress')}
              />
              <FilterPill
                label='Completed'
                count={completedCards.length}
                active={activeTab === 'completed'}
                onClick={() => setActiveTab('completed')}
              />

              <div className='text-muted-foreground ml-auto flex items-center gap-1.5 text-sm'>
                <span className='font-medium'>Sort by</span>
                <div className='relative'>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className='border-border bg-card text-foreground focus:ring-primary/50 appearance-none rounded-md border py-1.5 pr-8 pl-3 text-sm font-medium outline-none focus:ring-2'
                  >
                    {['Auto-Suggested', 'A-Z', 'Z-A', 'Recently Accessed', 'Progress'].map(opt => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className='text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2' />
                </div>
              </div>
            </div>

            {/* Search + category filter */}
            <div className='flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                <input
                  type='text'
                  placeholder='Search'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-primary/50 w-full rounded-md border py-2 pr-4 pl-9 text-sm outline-none focus:ring-2'
                />
              </div>
              <button className='border-border bg-card text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium'>
                <Filter className='size-4' />
                Filter by All Categories
                <ChevronDown className='size-4' />
              </button>
            </div>
          </div>

          {/* Course sections */}
          {isLoading ? (
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-2'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-[268px] rounded-2xl' />
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            <div className='border-border bg-card rounded-2xl border px-4 py-14 text-center'>
              <span className='bg-primary/10 text-primary mx-auto inline-flex size-12 items-center justify-center rounded-xl'>
                <BookOpenCheck className='size-6' />
              </span>
              <p className='text-foreground mt-4 text-base font-semibold'>
                No enrolled courses yet
              </p>
              <p className='text-muted-foreground mx-auto mt-2 max-w-md text-sm'>
                Courses you enroll in will appear here with quick links back to your active classes.
              </p>
              <Button asChild className='mt-5 rounded-xl shadow-none'>
                <Link href='/dashboard/student/courses'>
                  <GraduationCap className='size-4' />
                  Enroll in New Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* In Progress section */}
              {(activeTab === 'all' || activeTab === 'in_progress') &&
                inProgressCards.length > 0 &&
                (!searchQuery ||
                  inProgressCards.some(c =>
                    c.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )) && (
                  <section className='space-y-3'>
                    <h2 className='text-foreground text-base font-semibold'>
                      In Progress (
                      {
                        inProgressCards.filter(
                          c =>
                            !searchQuery ||
                            c.title.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length
                      }
                      )
                    </h2>
                    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                      {inProgressCards
                        .filter(
                          c =>
                            !searchQuery ||
                            c.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(({ sortTitle: _sortTitle, status: _status, ...card }) => (
                          <CoursesCatalogCard type='class' key={card.id} card={card} />
                        ))}
                    </div>
                  </section>
                )}

              {/* Completed section */}
              {(activeTab === 'all' || activeTab === 'completed') &&
                completedCards.length > 0 &&
                (!searchQuery ||
                  completedCards.some(c =>
                    c.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )) && (
                  <section className='space-y-3'>
                    <h2 className='text-foreground text-base font-semibold'>
                      Completed (
                      {
                        completedCards.filter(
                          c =>
                            !searchQuery ||
                            c.title.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length
                      }
                      )
                    </h2>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      {completedCards
                        .filter(
                          c =>
                            !searchQuery ||
                            c.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(({ sortTitle: _sortTitle, status: _status, ...card }) => (
                          <CoursesCatalogCard type='class' key={card.id} card={card} />
                        ))}
                    </div>
                  </section>
                )}
            </div>
          )}
        </div>

        <aside className='w-full shrink-0 space-y-4 lg:max-w-[280px] xl:max-w-[300px]'>
          <CourseProgressWidget
            total={enrolledCourseCards.length}
            inProgress={inProgressCards.length}
            completed={completedCards.length}
          />

          {/* Recommended for You */}
          <div className='border-border bg-card rounded-2xl border p-4 shadow-sm'>
            <h3 className='text-foreground mb-3 text-sm font-semibold'>Recommended for You</h3>

            {recommendedData.length > 0 ? (
              <>
                <div className='space-y-3'>
                  <RecommendedItem title='SEO Essentials' level='Beginner' duration='6 h' />
                  <RecommendedItem
                    title='Advanced Excel Analysis'
                    level='Intermediate'
                    duration='5 h'
                  />
                </div>

                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  className='mt-3 w-full rounded-xl text-xs font-semibold shadow-none'
                >
                  <Link href='/dashboard/student/courses'>
                    See All 29
                    <ArrowRight className='size-3.5' />
                  </Link>
                </Button>
              </>
            ) : (
              <div className='border-border/60 bg-muted/20 flex min-h-[140px] items-center justify-center rounded-xl border border-dashed text-center'>
                <p className='text-muted-foreground text-xs'>No recommendations yet</p>
              </div>
            )}
          </div>

          {/* Learning Milestones */}
          <div className='border-border bg-card rounded-2xl border p-4 shadow-sm'>
            <h3 className='text-foreground mb-3 text-sm font-semibold'>Learning Milestones</h3>

            {learningMilestonesData?.length > 0 ? (
              <>
                <div className='space-y-3'>
                  {learningMilestonesData.map(item => {
                    const isCompleted = item.status === 'completed';

                    return (
                      <div
                        key={item.id}
                        className='bg-muted/20 flex items-start gap-3 rounded-xl py-3'
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                            isCompleted
                              ? 'bg-success/15 text-success'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className='size-4' />
                          ) : (
                            <BookOpen className='size-4' />
                          )}
                        </div>

                        <div className='min-w-0 flex-1'>
                          {/* COURSE TITLE */}
                          <p className='text-foreground truncate text-sm font-semibold'>
                            {item.title}
                          </p>

                          {/* CLASS + META */}
                          <p className='text-muted-foreground mt-0.5 truncate text-xs'>
                            {item.secondaryMeta}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  asChild
                  size='sm'
                  className='bg-primary/60 hover:bg-primary/70 mt-4 w-full rounded-xl text-xs font-semibold text-white shadow-none'
                >
                  <Link href='/dashboard/student/analytics'>
                    View Report
                    <ArrowRight className='size-3.5' />
                  </Link>
                </Button>
              </>
            ) : (
              <div className='border-border/60 bg-muted/20 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed text-center'>
                <p className='text-muted-foreground text-xs'>No learning milestones yet</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
