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
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type {
  Course,
  CourseCreator,
  CourseReview,
  DifficultyLevel,
  TrainingProgram,
} from '@/services/client';
import {
  getAllCategoriesOptions,
  getAllCourseCreatorsOptions,
  getAllDifficultyLevelsOptions,
  getAllTrainingProgramsOptions,
  getCourseEnrollmentsOptions,
  getCourseLessonsOptions,
  getCourseReviewsOptions,
  getPublishedCoursesOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const stripHtml = (html?: string) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Lazily loads a course's real engagement stats (lessons, enrolments, ratings). */
function useCourseStats(courseUuid?: string) {
  const enabled = Boolean(courseUuid);
  const lessons = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled,
    retry: false,
  });
  const enrolments = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: { pageable: { page: 0, size: 1 } },
    }),
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
  const rating = reviewCount
    ? reviewList.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewCount
    : 0;

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
        loading='lazy'
        className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
      />
    );
  }
  return (
    <div className='from-primary/15 to-primary/5 flex h-full w-full items-center justify-center bg-gradient-to-br'>
      <BookOpen className='text-primary/60 h-8 w-8' />
    </div>
  );
}

function CourseStats({ courseUuid }: { courseUuid: string }) {
  const { loading, lessons, enrolled, rating, reviews } = useCourseStats(courseUuid);

  return (
    <>
      {/* Rating + level */}
      <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
        <span className='flex shrink-0 items-center gap-1'>
          {loading ? (
            <Skeleton className='h-3.5 w-16' />
          ) : reviews > 0 ? (
            <>
              <Star className='fill-warning text-warning h-3.5 w-3.5' />
              <span className='text-foreground font-semibold'>{rating.toFixed(1)}</span>
              <span className='text-muted-foreground'>({reviews})</span>
            </>
          ) : (
            <span className='text-muted-foreground font-medium'>No reviews yet</span>
          )}
        </span>
      </div>

      {/* Lessons + enrolled */}
      <div className='border-border/60 text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs'>
        <span className='flex shrink-0 items-center gap-1.5'>
          <BookOpen className='h-3.5 w-3.5' />
          {loading ? <Skeleton className='h-3 w-14' /> : `${lessons} Lessons`}
        </span>
        <span className='flex shrink-0 items-center gap-1.5'>
          <Users className='h-3.5 w-3.5' />
          {loading ? <Skeleton className='h-3 w-16' /> : `${enrolled.toLocaleString()} Enrolled`}
        </span>
      </div>
    </>
  );
}

const PAGE_SIZES = ['8', '12', '24', '48'];
const CATALOG_FETCH_SIZE = 200;

const PROGRAM_TYPES = [
  'Short courses',
  'Boot camps',
  'Professional Certificate',
  'TVET',
  'Diploma programs',
  'Postgraduate programs',
  'Degree programs',
];

type CatalogItem = {
  id: string;
  kind: 'course' | 'program';
  name: string;
  description: string;
  image: string | null;
  category: string;
  subject: string | null;
  programType: string | null;
  level: string | null;
  instructor: string;
  price?: number | null;
  durationLabel?: string;
  createdAt: number;
};

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
    ...getPublishedCoursesOptions({
      query: { pageable: { page: 0, size: CATALOG_FETCH_SIZE } },
    }),
  });
  const programsQuery = useQuery({
    ...getAllTrainingProgramsOptions({
      query: { pageable: { page: 0, size: CATALOG_FETCH_SIZE } },
    }),
  });
  const categoriesQuery = useQuery({
    ...getAllCategoriesOptions({
      query: { pageable: { page: 0, size: CATALOG_FETCH_SIZE } },
    }),
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
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const programApplicationsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const approvedCourseUuids = useMemo(() => {
    const set = new Set<string>();
    for (const app of applicationsQuery.data?.data?.content ?? []) {
      const s = (app.status ?? '').toLowerCase();
      if ((s === 'approved' || s === 'accepted') && app.course_uuid) set.add(app.course_uuid);
    }
    return set;
  }, [applicationsQuery.data]);
  const approvedProgramUuids = useMemo(() => {
    const set = new Set<string>();
    for (const app of programApplicationsQuery.data?.data?.content ?? []) {
      const s = (app.status ?? '').toLowerCase();
      if ((s === 'approved' || s === 'accepted') && app.program_uuid) set.add(app.program_uuid);
    }
    return set;
  }, [programApplicationsQuery.data]);

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

  const categoryByUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of extractPage(categoriesQuery.data).items) {
      if (category.uuid && category.name) map.set(category.uuid, category.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const courses = useMemo(() => extractPage<Course>(coursesQuery.data).items, [coursesQuery.data]);
  const programs = useMemo(
    () => extractPage<TrainingProgram>(programsQuery.data).items,
    [programsQuery.data]
  );

  const catalogItems = useMemo<CatalogItem[]>(
    () => [
      ...programs
        .filter(
          program =>
            program.admin_approved === true &&
            !(program.uuid && approvedProgramUuids.has(program.uuid))
        )
        .map(program => ({
          id: program.uuid as string,
          kind: 'program',
          name: program.title,
          description: stripHtml(program.description),
          image: null,
          category: program.category_uuid
            ? categoryByUuid.get(program.category_uuid) ?? 'General'
            : 'General',
          subject: null,
          programType: program.program_type ?? null,
          level: null,
          instructor:
            creatorsByUuid.get(program.course_creator_uuid ?? '')?.full_name ??
            'Course creator',
          price: program.price ?? null,
          durationLabel: program.total_duration_display ?? undefined,
          createdAt: program.created_date
            ? new Date(program.created_date).getTime()
            : 0,
        })),

      ...courses
        .filter(
          course =>
            course.admin_approved === true &&
            !(course.uuid && approvedCourseUuids.has(course.uuid))
        )
        .map(course => ({
          id: course.uuid as string,
          kind: 'course',
          name: course.name,
          description: stripHtml(course.description),
          image:
            toAuthenticatedMediaUrl(
              course.banner_url ?? course.thumbnail_url
            ) ?? null,
          category: course.category_names?.[0] ?? 'General',
          subject: course.category_names?.[1] ?? null,
          programType: null,
          level:
            (course.difficulty_uuid &&
              difficultyByUuid.get(course.difficulty_uuid)) ||
            'All Levels',
          instructor:
            creatorsByUuid.get(course.course_creator_uuid ?? '')?.full_name ??
            'Course creator',
          price: course.price ?? null,
          durationLabel: course.total_duration_display ?? undefined,
          createdAt: course.created_date
            ? new Date(course.created_date).getTime()
            : 0,
        })),
    ],
    [
      approvedCourseUuids,
      approvedProgramUuids,
      categoryByUuid,
      courses,
      creatorsByUuid,
      difficultyByUuid,
      programs,
    ]
  );

  const courseById = useMemo(
    () => Object.fromEntries(catalogItems.map(c => [c.id, c])),
    [catalogItems]
  );

  const filteredItems = useMemo(
    () => filterByCategoryTabs(catalogItems, activeCategory, subjectByCategory, activeProgramType),
    [activeCategory, activeProgramType, catalogItems, subjectByCategory]
  );

  const selectionSubject = selectedIds.length
    ? (courseById[selectedIds[0]]?.subject ?? null)
    : null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      const item = courseById[id];
      if (!item) return prev;
      if (selectionSubject && item.subject !== selectionSubject) {
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
    const firstId = selectedIds[0];
    const firstItem = courseById[firstId];
    if (!firstItem) return;
    try {
      sessionStorage.setItem(
        'elimika:multi-apply',
        JSON.stringify({
          items: selectedIds
            .map(id => courseById[id])
            .filter(Boolean)
            .map(item => ({ id: item.id, kind: item.kind })),
          subject: selectionSubject,
        })
      );
    } catch {
      // ignore storage errors
    }
    router.push(
      firstItem.kind === 'program'
        ? `/dashboard/apply-to-train/${firstItem.id}?kind=program`
        : `/dashboard/organisation/courses/apply/${firstItem.id}`
    );
  };

  const loading =
    coursesQuery.isLoading ||
    programsQuery.isLoading ||
    categoriesQuery.isLoading ||
    creatorsQuery.isLoading ||
    difficultyQuery.isLoading ||
    applicationsQuery.isLoading ||
    programApplicationsQuery.isLoading;
  const pageSizeNumber = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSizeNumber));
  const paginatedItems = filteredItems.slice(
    page * pageSizeNumber,
    page * pageSizeNumber + pageSizeNumber
  );

  useEffect(() => {
    setPage(current => Math.min(current, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory, activeProgramType, pageSize, subjectByCategory]);

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-5 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      {/* Header */}
      <div>
        <h1 className='text-foreground text-2xl font-semibold tracking-tight sm:text-3xl'>
          Training Catalogue
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Explore courses and programs across multiple categories and build skills for your future.
        </p>
      </div>

      <CategoryTabs
        items={catalogItems}
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
        <div className='grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4'>
          {[...Array(pageSizeNumber > 8 ? 8 : pageSizeNumber)].map((_, i) => (
            <Skeleton key={i} className='h-80 w-full rounded-2xl' />
          ))}
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4'>
          {paginatedItems.map(item => {
            const isFav = !!favorites[item.id];
            const isSelected = selectedIds.includes(item.id);
            const isDisabled =
              !isSelected && selectionSubject !== null && item.subject !== selectionSubject;
            return (
              <article
                key={item.id}
                aria-selected={isSelected}
                className={cn(
                  'group bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                  isSelected ? 'border-teal-600 ring-2 ring-teal-500/40' : 'border-border',
                  isDisabled && 'opacity-60'
                )}
              >
                {/* Image */}
                <div className='bg-muted relative aspect-[16/10] w-full overflow-hidden'>
                  <CourseImage src={item.image} alt={item.name} />
                  <button
                    type='button'
                    aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
                    onClick={() => setFavorites(f => ({ ...f, [item.id]: !f[item.id] }))}
                    className='bg-card text-foreground hover:bg-card/90 absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors'
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4',
                        isFav ? 'fill-destructive text-destructive' : 'text-muted-foreground'
                      )}
                    />
                  </button>
                  <div className='ring-card absolute -bottom-5 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-md ring-4'>
                    {item.kind === 'program' ? (
                      <GraduationCap className='h-5 w-5' />
                    ) : (
                      <BookOpen className='h-5 w-5' />
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className='flex flex-1 flex-col gap-3 p-3.5 pt-6 sm:p-4'>
                  <div className='min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <Link
                        href={
                          item.kind === 'program'
                            ? `/dashboard/organisation/courses/available-programs/${item.id}`
                            : `/dashboard/organisation/courses/catalog/${item.id}`
                        }
                        className='text-foreground line-clamp-2 text-base leading-snug font-semibold hover:text-teal-700 hover:underline'
                      >
                        {item.name}
                      </Link>
                      {item.kind === 'program' && (
                        <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide'>
                          Program
                        </span>
                      )}
                    </div>
                    <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                      {item.description}
                    </p>
                  </div>

                  {/* Instructor */}
                  <div className='flex min-w-0 items-center gap-2'>
                    <Avatar className='h-6 w-6 shrink-0'>
                      <AvatarFallback className='bg-primary/10 text-primary text-[10px]'>
                        {item.instructor.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-foreground min-w-0 truncate text-xs font-medium'>
                      {item.instructor}
                    </span>
                    <BadgeCheck className='h-3.5 w-3.5 shrink-0 fill-teal-600 text-white' />
                    <span className='text-muted-foreground ml-auto flex shrink-0 items-center gap-1 text-xs'>
                      <Star className='fill-warning text-warning h-3 w-3' />
                      {item.kind === 'program' ? item.programType ?? 'Program' : item.level}
                    </span>
                  </div>

                  {item.kind === 'course' ? (
                    <CourseStats courseUuid={item.id} />
                  ) : (
                    <div className='border-border/60 text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs'>
                      <span className='flex shrink-0 items-center gap-1.5'>
                        <GraduationCap className='h-3.5 w-3.5' />
                        {item.durationLabel ?? 'Program'}
                      </span>
                      <span className='flex shrink-0 items-center gap-1.5'>
                        <BookOpen className='h-3.5 w-3.5' />
                        {typeof item.price === 'number' && item.price > 0
                          ? `KES ${item.price.toLocaleString()}`
                          : 'Free'}
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={() => toggleSelect(item.id)}
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
                        <Check className='h-4 w-4' /> Selected
                      </>
                    ) : (
                      `Select ${item.kind === 'program' ? 'Program' : 'Course'}`
                    )}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <p className='text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm'>
          No courses or programs match this filter.
        </p>
      )}

      {/* Pagination */}
      <div className='flex flex-col items-center justify-between gap-4 pt-2 md:flex-row'>
        <p className='text-muted-foreground text-sm'>
          Showing {paginatedItems.length ? page * pageSizeNumber + 1 : 0}–
          {page * pageSizeNumber + paginatedItems.length} of {filteredItems.length.toLocaleString()}{' '}
          items
        </p>

        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='sm'
            className='h-9 rounded-lg'
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className='text-muted-foreground px-2 text-sm'>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type='button'
            aria-label='Next page'
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
            className='hover:bg-muted ml-1 flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-40'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <span>Show</span>
          <Select
            value={pageSize}
            onValueChange={v => {
              setPageSize(v);
              setPage(0);
            }}
          >
            <SelectTrigger className='h-9 w-20'>
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
        <div className='fixed right-4 bottom-4 z-50 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-teal-700/40 bg-teal-600 py-1 pr-1 pl-3 text-white shadow-xl sm:right-6 sm:bottom-6 sm:pl-4'>
          <GraduationCap className='h-5 w-5 shrink-0' />
          <div className='flex min-w-0 flex-col pr-1 leading-tight sm:pr-2'>
            <span className='truncate text-sm font-semibold'>
              Apply to Train ({selectedIds.length})
            </span>
            {selectionSubject && (
              <span className='truncate text-[11px] text-white/80'>
                Subject: {selectionSubject}
              </span>
            )}
          </div>
          <Button
            onClick={applySelected}
            size='sm'
            className='shrink-0 rounded-full bg-white text-teal-700 hover:bg-white/90'
          >
            Continue
          </Button>
          <Button
            onClick={clearSelection}
            size='icon'
            variant='ghost'
            aria-label='Clear selection'
            className='shrink-0 rounded-full text-white hover:bg-white/10'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
