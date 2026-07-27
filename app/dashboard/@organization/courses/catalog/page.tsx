// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  GraduationCap,
  Heart,
  Star,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type { Course, CourseCreator, CourseReview, DifficultyLevel } from '@/services/client';
import {
  getAllCourseCreatorsOptions,
  getAllDifficultyLevelsOptions,
  getCourseEnrollmentsOptions,
  getCourseLessonsOptions,
  getCourseReviewsOptions,
  getPublishedCoursesOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const stripHtml = (html?: string) =>
  (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Lazily loads a course's real engagement stats (lessons, enrolments, ratings). */
function useCourseStats(courseUuid?: string) {
  const enabled = Boolean(courseUuid);
  const lessons = useQuery({
    ...getCourseLessonsOptions({ path: { courseUuid: courseUuid ?? '' }, query: { pageable: { page: 0, size: 1 } } }),
    enabled,
    retry: false,
  });
  const enrolments = useQuery({
    ...getCourseEnrollmentsOptions({ path: { courseUuid: courseUuid ?? '' }, query: { pageable: { page: 0, size: 1 } } }),
    enabled,
    retry: false,
  });
  const reviews = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseUuid ?? '' } }),
    enabled,
    retry: false,
  });

  const reviewList = extractList<CourseReview>(reviews.data);
  const reviewCount = reviewList.length;
  const rating = reviewCount ? reviewList.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewCount : 0;

  return {
    loading: lessons.isLoading || enrolments.isLoading || reviews.isLoading,
    lessons: getTotalFromMetadata(extractPage(lessons.data).metadata),
    enrolled: getTotalFromMetadata(extractPage(enrolments.data).metadata),
    rating,
    reviews: reviewCount,
  };
}

function CourseImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
      <BookOpen className="h-8 w-8 text-primary/60" />
    </div>
  );
}

function CourseStats({ courseUuid }: { courseUuid: string }) {
  const { loading, lessons, enrolled, rating, reviews } = useCourseStats(courseUuid);

  return (
    <>
      {/* Rating + level */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex shrink-0 items-center gap-1">
          {loading ? (
            <Skeleton className="h-3.5 w-16" />
          ) : reviews > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews})</span>
            </>
          ) : (
            <span className="font-medium text-muted-foreground">No reviews yet</span>
          )}
        </span>
      </div>

      {/* Lessons + enrolled */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span className="flex shrink-0 items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          {loading ? <Skeleton className="h-3 w-14" /> : `${lessons} Lessons`}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {loading ? <Skeleton className="h-3 w-16" /> : `${enrolled.toLocaleString()} Enrolled`}
        </span>
      </div>
    </>
  );
}

const PAGE_SIZES = ['8', '12', '24', '48'];

const PROGRAM_TYPES = [
  'Short courses',
  'Boot camps',
  'Professional Certificate',
  'TVET',
  'Diploma programs',
  'Postgraduate programs',
  'Degree programs',
];

export default function CatalogPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = useState('8');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const [activeProgramType, setActiveProgramType] = useState<string | null>(null);

  const coursesQuery = useQuery({
    ...getPublishedCoursesOptions({ query: { pageable: { page, size: Number(pageSize) } } }),
  });
  const creatorsQuery = useQuery({
    ...getAllCourseCreatorsOptions({ query: { pageable: { page: 0, size: 200 } } }),
  });
  const difficultyQuery = useQuery({ ...getAllDifficultyLevelsOptions() });

  // Courses the org is already approved to train are hidden — the catalogue is what it can still apply for.
  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });
  const approvedCourseUuids = useMemo(() => {
    const set = new Set<string>();
    for (const app of applicationsQuery.data?.data?.content ?? []) {
      const s = (app.status ?? '').toLowerCase();
      if ((s === 'approved' || s === 'accepted') && app.course_uuid) set.add(app.course_uuid);
    }
    return set;
  }, [applicationsQuery.data]);

  const creatorsByUuid = useMemo(() => {
    const map = new Map<string, CourseCreator>();
    for (const c of extractPage<CourseCreator>(creatorsQuery.data).items) {
      if (c.uuid) map.set(c.uuid, c);
    }
    return map;
  }, [creatorsQuery.data]);

  const difficultyByUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of extractList<DifficultyLevel>(difficultyQuery.data)) {
      if (d.uuid && d.name) map.set(d.uuid, d.name);
    }
    return map;
  }, [difficultyQuery.data]);

  const { items: courseItems, metadata } = extractPage<Course>(coursesQuery.data);
  const totalPages = Math.max(1, metadata.totalPages ?? 1);

  const catalogCourses = useMemo(
    () =>
      courseItems
        .filter(course => !(course.uuid && approvedCourseUuids.has(course.uuid)))
        .map(course => ({
          id: course.uuid as string,
          name: course.name,
          description: stripHtml(course.description),
          image: toAuthenticatedMediaUrl(course.banner_url ?? course.thumbnail_url) ?? null,
          category: course.category_names?.[0] ?? 'General',
          subject: course.category_names?.[1] ?? null,
          programType: null as string | null,
          level: (course.difficulty_uuid && difficultyByUuid.get(course.difficulty_uuid)) || 'All Levels',
          instructor: creatorsByUuid.get(course.course_creator_uuid ?? '')?.full_name ?? 'Course creator',
        })),
    [courseItems, creatorsByUuid, difficultyByUuid, approvedCourseUuids]
  );

  const courseById = useMemo(() => Object.fromEntries(catalogCourses.map(c => [c.id, c])), [catalogCourses]);

  const filteredCourses = useMemo(
    () => filterByCategoryTabs(catalogCourses, activeCategory, subjectByCategory, activeProgramType),
    [catalogCourses, activeCategory, subjectByCategory, activeProgramType]
  );

  const selectionSubject = selectedIds.length ? (courseById[selectedIds[0]]?.subject ?? null) : null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      const course = courseById[id];
      if (!course) return prev;
      if (selectionSubject && course.subject !== selectionSubject) {
        toast.error('Selection limited to one subject', {
          description: `You can only combine courses in ${selectionSubject}. Clear your selection to start over.`,
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const applySelected = () => {
    if (selectedIds.length === 0) return;
    const [first] = selectedIds;
    try {
      sessionStorage.setItem('elimika:multi-apply', JSON.stringify({ ids: selectedIds, subject: selectionSubject }));
    } catch {
      // ignore storage errors
    }
    router.push(`/dashboard/courses/apply/${first}`);
  };

  const loading = coursesQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Course Catalogue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore courses across multiple categories and build skills for your future.
        </p>
      </div>

      <CategoryTabs
        items={catalogCourses}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        subjectByCategory={subjectByCategory}
        onSubjectChange={setSubjectByCategory}
        allProgramTypes={PROGRAM_TYPES}
        activeProgramType={activeProgramType}
        onProgramTypeChange={setActiveProgramType}
      />

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(Number(pageSize) > 8 ? 8 : Number(pageSize))].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourses.map(course => {
            const isFav = !!favorites[course.id];
            const isSelected = selectedIds.includes(course.id);
            const isDisabled = !isSelected && selectionSubject !== null && course.subject !== selectionSubject;
            return (
              <article
                key={course.id}
                aria-selected={isSelected}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                  isSelected ? 'border-teal-600 ring-2 ring-teal-500/40' : 'border-border',
                  isDisabled && 'opacity-60'
                )}
              >
                {/* Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <CourseImage src={course.image} alt={course.name} />
                  <button
                    type="button"
                    aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
                    onClick={() => setFavorites(f => ({ ...f, [course.id]: !f[course.id] }))}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-colors hover:bg-card/90"
                  >
                    <Heart className={cn('h-4 w-4', isFav ? 'fill-destructive text-destructive' : 'text-muted-foreground')} />
                  </button>
                  <div className="absolute -bottom-5 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-md ring-4 ring-card">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-3.5 pt-6 sm:p-4">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/courses/catalog/${course.id}`}
                      className="line-clamp-2 text-base font-semibold leading-snug text-foreground hover:text-teal-700 hover:underline"
                    >
                      {course.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
                  </div>

                  {/* Instructor */}
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {course.instructor.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 truncate text-xs font-medium text-foreground">{course.instructor}</span>
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-teal-600 text-white" />
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {course.level}
                    </span>
                  </div>

                  <CourseStats courseUuid={course.id} />

                  <Button
                    onClick={() => toggleSelect(course.id)}
                    disabled={isDisabled}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'mt-1 w-full gap-2 rounded-lg',
                      isSelected
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'border-teal-600 text-teal-700 hover:bg-teal-50'
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4" /> Selected
                      </>
                    ) : (
                      'Select Course'
                    )}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && filteredCourses.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No courses match this filter.
        </p>
      )}

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 pt-2 md:flex-row">
        <p className="text-sm text-muted-foreground">
          Showing {filteredCourses.length ? page * Number(pageSize) + 1 : 0}–
          {page * Number(pageSize) + filteredCourses.length} of {getTotalFromMetadata(metadata).toLocaleString()} courses
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-lg"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select
            value={pageSize}
            onValueChange={v => {
              setPageSize(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map(n => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Floating Action Button — multi-course apply */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-teal-700/40 bg-teal-600 py-1 pl-3 pr-1 text-white shadow-xl sm:bottom-6 sm:right-6 sm:pl-4">
          <GraduationCap className="h-5 w-5 shrink-0" />
          <div className="flex min-w-0 flex-col pr-1 leading-tight sm:pr-2">
            <span className="truncate text-sm font-semibold">Apply to Train ({selectedIds.length})</span>
            {selectionSubject && <span className="truncate text-[11px] text-white/80">Subject: {selectionSubject}</span>}
          </div>
          <Button onClick={applySelected} size="sm" className="shrink-0 rounded-full bg-white text-teal-700 hover:bg-white/90">
            Continue
          </Button>
          <Button
            onClick={clearSelection}
            size="icon"
            variant="ghost"
            aria-label="Clear selection"
            className="shrink-0 rounded-full text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
