'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { getCourseCreatorByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useQueries } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
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
import { CoursesCatalogCard } from './CoursesCatalogCard';
import {
  formatDurationFromParts,
  getCardPresentation,
  type CoursesCatalogCardData,
} from './courses-data';


type CourseStatus = 'in_progress' | 'completed' | 'not_started';

type EnrolledCourseCard = CoursesCatalogCardData & {
  sortTitle: string;
  status: CourseStatus;
};

type FilterTab = 'all' | 'in_progress' | 'completed';

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
      <div className='h-2 overflow-hidden rounded-full bg-muted'>
        <div
          className='h-full rounded-full bg-success/50 transition-all'
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
      <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10'>
        <Star className='size-5 text-primary/60' />
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

/** Mocked milestone item */
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
          <Award className='size-5 text-accent-foreground' />
        ) : (
          <Trophy className='size-5 text-primary' />
        )}
      </div>

      <div className='min-w-0 flex-1'>
        <p className='text-foreground text-sm font-semibold'>{title}</p>

        {rating !== undefined && (
          <div className='mt-0.5 flex items-center gap-0.5'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${i < rating
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground'
                  }`}
              />
            ))}
          </div>
        )}

        {subtitle && (
          <p className='text-muted-foreground mt-0.5 text-[11px]'>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function StudentMyCoursesPage() {
  const student = useStudent();
  const { classDefinitions, loading } = useStudentClassDefinitions(student ?? undefined);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Auto-Suggested');

  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitions
            .map(item => item.course?.course_creator_uuid)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [classDefinitions]
  );

  const creatorQueries = useQueries({
    queries: creatorIds.map(uuid => ({
      ...getCourseCreatorByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      refetchOnWindowFocus: false,
    })),
  });

  const creatorMap = useMemo(() => {
    const map = new Map<string, string>();
    creatorQueries.forEach((query, index) => {
      const uuid = creatorIds[index];
      const name = query.data?.full_name;
      if (uuid && name) map.set(uuid, name);
    });
    return map;
  }, [creatorIds, creatorQueries]);

  const enrolledCourseCards = useMemo<EnrolledCourseCard[]>(() => {
    const cards = new Map<string, EnrolledCourseCard>();

    classDefinitions.forEach((item, index) => {
      const course = item.course;
      const classDetails = item.classDetails;
      const classId = item.uuid;
      const activeEnrollment = item.enrollments.find(
        enrollment => enrollment.enrollment_status !== 'CANCELLED'
      );

      if (!course?.uuid || !activeEnrollment) return;

      const presentation = getCardPresentation(index);
      if (cards.has(course.uuid)) return;

      const scheduleCount = item.schedules?.length ?? item.enrollments.length;

      // Derive status from enrollment data
      const enrollmentStatus = activeEnrollment.enrollment_status ?? '';
      const isCompleted =
        enrollmentStatus === 'COMPLETED' || enrollmentStatus === 'GRADUATED';
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
          (scheduleCount === 1 ? '1 enrolled class' : `${scheduleCount} enrolled classes`),
        ctaLabel: isCompleted ? 'View Certificate' : 'Continue',
        ctaKind: 'link',
        showInstructorCta: false,
        detailsHref: buildWorkspaceAliasPath('student', `/dashboard/courses/${course.uuid}`),
        enrollHref: buildWorkspaceAliasPath('student', `/dashboard/learning-hub/classes/${classId}`),
        instructorHref: buildWorkspaceAliasPath(
          'student',
          `/dashboard/courses/instructor?courseId=${course.uuid}`
        ),
        icon: presentation.icon,
        imageTone: presentation.imageTone,
        imageUrl: course.banner_url ?? course.thumbnail_url,
        sortTitle: course.name,
        status,
      });
    });

    return Array.from(cards.values()).sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
  }, [classDefinitions, creatorMap]);

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

  const isLoading =
    loading || creatorQueries.some(query => query.isLoading || query.isFetching);

  const studentName = (student as any)?.full_name ?? (student as any)?.name ?? 'Student';

  const recommendedData = []
  const learningMilestonesData = completedCards || []

  return (
    <div className='mx-auto w-full max-w-[1680px] bg-background px-3 py-4 sm:px-4 lg:px-6 2xl:px-8'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-foreground text-[clamp(1.4rem,2vw,2rem)] font-bold tracking-[-0.03em]'>
            My Courses
          </h1>

        </div>
        <Button
          asChild
          className='h-9 gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-none hover:bg-primary/80'
        >
          <Link href='/dashboard/workspace/student/courses'>
            <Plus className='size-4' />
            Enroll in New Course
          </Link>
        </Button>
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

              <div className='ml-auto flex items-center gap-1.5 text-sm text-muted-foreground'>
                <span className='font-medium'>Sort by</span>
                <div className='relative'>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className='border-border bg-card text-foreground appearance-none rounded-md border py-1.5 pl-3 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50'
                  >
                    {['Auto-Suggested', 'A-Z', 'Z-A', 'Recently Accessed', 'Progress'].map(opt => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
                </div>
              </div>
            </div>

            {/* Search + category filter */}
            <div className='flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  type='text'
                  placeholder='Search'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='border-border bg-card text-foreground placeholder:text-muted-foreground w-full rounded-md border py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50'
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
              <span className='mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <BookOpenCheck className='size-6' />
              </span>
              <p className='text-foreground mt-4 text-base font-semibold'>No enrolled courses yet</p>
              <p className='text-muted-foreground mx-auto mt-2 max-w-md text-sm'>
                Courses you enroll in will appear here with quick links back to your active classes.
              </p>
              <Button asChild className='mt-5 rounded-xl shadow-none'>
                <Link href='/dashboard/workspace/student/courses'>
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
                      In Progress ({inProgressCards.filter(c =>
                        !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length})
                    </h2>
                    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                      {inProgressCards
                        .filter(
                          c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(({ sortTitle: _sortTitle, status: _status, ...card }) => (
                          <CoursesCatalogCard key={card.id} card={card} />
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
                      Completed ({completedCards.filter(c =>
                        !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length})
                    </h2>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      {completedCards
                        .filter(
                          c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(({ sortTitle: _sortTitle, status: _status, ...card }) => (
                          <CoursesCatalogCard key={card.id} card={card} />
                        ))}
                    </div>
                  </section>
                )}
            </div>
          )}
        </div>

        <aside className='w-full shrink-0 space-y-4 lg:w-[260px] xl:w-[280px]'>
          <CourseProgressWidget
            total={enrolledCourseCards.length}
            inProgress={inProgressCards.length}
            completed={completedCards.length}
          />

          {/* Recommended for You */}
          <div className='border-border bg-card rounded-2xl border p-4 shadow-sm'>
            <h3 className='text-foreground mb-3 text-sm font-semibold'>
              Recommended for You
            </h3>

            {recommendedData.length > 0 ? (
              <>
                <div className='space-y-3'>
                  <RecommendedItem title='SEO Essentials' level='Beginner' duration='6 h' />
                  <RecommendedItem title='Advanced Excel Analysis' level='Intermediate' duration='5 h' />
                </div>

                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  className='mt-3 w-full rounded-xl text-xs font-semibold shadow-none'
                >
                  <Link href='/dashboard/workspace/student/courses'>
                    See All 29
                    <ArrowRight className='size-3.5' />
                  </Link>
                </Button>
              </>
            ) : (
              <div className='flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-center'>
                <p className='text-muted-foreground text-xs'>
                  No recommendations yet
                </p>
              </div>
            )}
          </div>

          {/* Learning Milestones */}
          <div className='border-border bg-card rounded-2xl border p-4 shadow-sm'>
            <h3 className='text-foreground mb-3 text-sm font-semibold'>
              Learning Milestones
            </h3>

            {learningMilestonesData.length > 0 ? (
              <>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <MilestoneItem
                      icon='award'
                      title='Illustrator & Photoshop Skills'
                      subtitle='✅ Certificate Earned · Frustrstor Level 1 · Photoshop Level 1'
                    />
                  </div>

                  <div className='space-y-2'>
                    <MilestoneItem
                      icon='trophy'
                      title='Public Speaking Basics'
                      rating={4}
                      subtitle='Edit 4 2068'
                    />
                  </div>

                  <div className='space-y-2'>
                    <MilestoneItem
                      icon='trophy'
                      title='Graphic Design Basics'
                      rating={4}
                      subtitle='Completed on Feb 10 2024'
                    />
                  </div>
                </div>

                <Button
                  asChild
                  size='sm'
                  className='mt-4 w-full rounded-xl bg-primary/60 text-xs font-semibold text-white shadow-none hover:bg-primary/70'
                >
                  <Link href='/dashboard/workspace/student/report'>
                    View Report
                    <ArrowRight className='size-3.5' />
                  </Link>
                </Button>
              </>
            ) : (
              <div className='flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-center'>
                <p className='text-muted-foreground text-xs'>
                  No learning milestones yet
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}