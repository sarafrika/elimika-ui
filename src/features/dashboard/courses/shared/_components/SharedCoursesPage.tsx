'use client';

import {
  keepPreviousData,
  type QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { GraduationCap, Layers, type LucideIcon, SlidersHorizontal, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ALL_CATEGORIES, CategoryTabs } from '@/components/category-tabs';
import NotesModal from '@/components/custom-modals/notes-modal';
import { surfaceTheme } from '@/components/data-display';
import { FacetChips, FacetChipsSkeleton } from '@/components/search/facet-chips';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import {
  useCourseClasses,
  useCourseCreatorsByIds,
  useCoursesByIds,
} from '@/hooks/use-batched-lookups';
import { useCourseEnrollmentsMap } from '@/hooks/use-enrollment-map';
import { averageRating, useCourseReviewsMap } from '@/hooks/use-reviews-map';
import { useSearchErrors } from '@/hooks/use-search-query';
import { useSearchState, useSearchStatePatch } from '@/hooks/use-search-state';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { useUrlSearchQuery } from '@/hooks/use-url-search-query';
import { categoryWithDescendants, matchesCategoryFilter } from '@/lib/category-filters';
import { STALE_TIMES } from '@/lib/query-client';
import type { RateCard } from '@/lib/rate-card';
import { catalogItemPrefetchQuery } from '@/lib/route-prefetch';
import { classifySearchError } from '@/lib/search/query';
import { enumParam, numberParam, stringParam } from '@/lib/search-state';
import type { UserDomain } from '@/lib/types';
import { ApplicantTypeEnum } from '@/services/client';
import {
  getAllCategoriesOptions,
  getAllDifficultyLevelsOptions,
  getAllTrainingProgramsOptions,
  getClassDefinitionsForCourseQueryKey,
  getClassDefinitionsForProgramOptions,
  getClassDefinitionsForProgramQueryKey,
  getCourseLessonsOptions,
  getProgramEnrollmentsOptions,
  getPublishedCoursesOptions,
  searchCoursesAndProgrammesOptions,
  searchProgramCoursesOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  CatalogueItem,
  Course,
  CourseReview,
  GetClassDefinitionsForCourseResponse,
  GetClassDefinitionsForProgramResponse,
  SearchCoursesAndProgrammesData,
} from '@/services/client/types.gen';
import { CoursesCatalogCard } from '@/src/features/dashboard/courses/shared/_components/CoursesCatalogCard';
import { CoursesCategoryFilters } from '@/src/features/dashboard/courses/shared/_components/CoursesCategoryFilters';
import {
  type CatalogTrainingApplicationData,
  type CoursesCatalogCardData,
  type CoursesCatalogTab,
  type CoursesFilterSection,
  type CoursesRecommendationCardData,
  decisiveTrainingApplication,
  formatDurationFromParts,
  getApplyToTrainHref,
  getCardPresentation,
  getContentHref,
  getDurationBucket,
  getEnrollHref,
  getInstructorHref,
  stripHtml,
} from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { StudentCoursesCard } from '@/src/features/dashboard/courses/shared/_components/StudentCoursesCard';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { useTypeSearch } from '@/src/features/search/hooks/use-type-search';
import {
  catalogPriceOptions,
  catalogResultCount,
  matchesCatalogContentType,
  matchesCatalogPrice,
} from './catalog-filters';
import { SeenOnScreen, useSeenIds } from './seen-on-screen';

type SharedCoursesPageProps = {
  domain: UserDomain;
};

export type UnifiedContentItem = {
  id: string;
  kind: 'course' | 'program';
  title: string;
  is_published: boolean;
  description: string;
  createdAt: number;
  durationMinutes: number;
  durationLabel: string;
  categoryLabels: string[];
  categoryUuids?: string[];
  creatorUuid: string;
  creatorName: string;
  levelLabel?: string;
  price: string | number | undefined;
  minimumRate?: number;
  imageUrl?: string;
  href: string;
  secondaryMeta: string;
  enrolledClasses: number;
  bundledCourseCount?: number;
  rating?: number;
  reviewCount?: number;
  enrollmentCount?: number | undefined;
  imageTone?: string;
  icon?: LucideIcon | undefined;
  /** Vestigial: written as '' by every mapper, read by nothing. */
  category?: string;
  subject?: string;
  programType?: string;
  /**
   * Fields the mappers below have always written and the cards have always
   * read. They were invisible while this file carried `@ts-nocheck`; declaring
   * them is what makes an absent age limit or category list a `undefined` the
   * card can skip rather than a silent `any`.
   */
  videoUrl?: string;
  minAge?: number | undefined;
  maxAge?: number | undefined;
  categoryNames?: string[] | undefined;
  activeClasses?: number;
};

type FilterValues = Record<CoursesFilterSection['key'], string>;

const defaultFilterValues: FilterValues = {
  category: 'all',
  contentType: 'all-courses',
  duration: 'all',
  level: 'all',
  price: 'all',
};

const CATALOG_PAGE_SIZE = 18;

/**
 * The faceted catalogue keeps its search, facets, sort and page in the URL so a reload or
 * a shared link lands on the same results. Content type and duration stay local.
 * Duration and minimum training fee narrow the loaded page in the browser because
 * the search index does not expose either field.
 */
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most relevant', sort: undefined },
  { value: 'newest', label: 'Newest', sort: 'created_at,desc' },
  { value: 'price', label: 'Price: low to high', sort: 'price,asc' },
  { value: 'rating', label: 'Highest rated', sort: 'rating_avg,desc' },
  { value: 'enrolments', label: 'Most enrolled', sort: 'enrolment_count,desc' },
] as const;
type CatalogueSort = (typeof SORT_OPTIONS)[number]['value'];
const SORT_VALUES = SORT_OPTIONS.map(option => option.value) as CatalogueSort[];

const allParam = stringParam('all');
const priceParam = enumParam(['all', 'free', 'paid'] as const, 'all');
const sortParam = enumParam<CatalogueSort>(SORT_VALUES, 'relevance');
const catalogPageParam = numberParam(1);
const FACETS = 'category_uuids,difficulty_uuid';
const trainingApplicationStatusQueryOptions = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

/** Outcomes the backend lets an applicant submit against again (see ClassMarketplaceJobApplicationStatus). */
const REAPPLYABLE = new Set(['rejected', 'revoked']);
const REAPPLYABLE_OR_APPROVED = new Set(['rejected', 'revoked', 'approved']);

function normalizeApplicationStatus(status?: string | null) {
  return status?.toLowerCase() ?? null;
}

/** The generated error unions share no `message`; surface one when there is one. */
function errorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return undefined;
  }

  return typeof error.message === 'string' ? error.message : undefined;
}

/** Card counts, from the catalogue search or, for ids it missed, the per-item fallback. */
type CardCounts = {
  rating?: number;
  reviewCount?: number;
  learners?: number;
  lessons?: number;
  classes?: number;
  courseCount?: number;
  categoryNames?: string[];
  creatorName?: string;
};

type CatalogueApiSort = NonNullable<NonNullable<SearchCoursesAndProgrammesData['query']>['sort']>;
type CatalogueLevel = NonNullable<
  NonNullable<SearchCoursesAndProgrammesData['query']>['level']
>[number];
const CATALOGUE_LEVELS: readonly CatalogueLevel[] = ['beginner', 'intermediate', 'advanced'];

function toCount(value: bigint | number | undefined): number | undefined {
  if (value == null) return undefined;
  const count = Number(value);
  return Number.isFinite(count) ? count : undefined;
}

function catalogueCounts(item: CatalogueItem): CardCounts {
  return {
    rating: item.rating_avg ?? undefined,
    reviewCount: toCount(item.review_count),
    learners: toCount(item.learner_count),
    lessons: toCount(item.lesson_count),
    classes: toCount(item.class_count),
    courseCount: toCount(item.course_count),
    categoryNames: item.category_names?.length ? item.category_names : undefined,
    creatorName: item.creator_name || undefined,
  };
}

/** Instructor count only when the item's class list is already in the cache. */
function cachedInstructorCount(
  qc: QueryClient,
  kind: UnifiedContentItem['kind'],
  id: string
): number | undefined {
  // Partial key match: any cached class list for this id, whatever its query options.
  const cached =
    kind === 'course'
      ? qc.getQueriesData<GetClassDefinitionsForCourseResponse>({
          queryKey: getClassDefinitionsForCourseQueryKey({ path: { courseUuid: id } }),
        })
      : qc.getQueriesData<GetClassDefinitionsForProgramResponse>({
          queryKey: getClassDefinitionsForProgramQueryKey({ path: { programUuid: id } }),
        });
  const rows = cached.find(([, response]) => response?.data)?.[1]?.data;
  if (!rows) return undefined;

  const instructors = new Set(
    rows
      .map(row => row.class_definition?.default_instructor_uuid)
      .filter((uuid): uuid is string => Boolean(uuid))
  );
  return instructors.size;
}

const createCatalogCards = (
  items: UnifiedContentItem[],
  domain: UserDomain,
  creatorMap: Map<string, string>,
  canApplyToTrain: boolean,
  isOrganisationDomain: boolean,
  canOrganisationApply: boolean,
  applicationStateRefreshing: boolean,
  courseApplicationMap: Map<string, CatalogTrainingApplicationData>,
  programApplicationMap: Map<string, CatalogTrainingApplicationData>,
  countsById: Map<string, CardCounts>,
  programCoursesMap: Record<string, Course[]>,
  instructorCountFor: (kind: UnifiedContentItem['kind'], id: string) => number | undefined
): CoursesCatalogCardData[] =>
  items.map((item, index) => {
    const presentation = getCardPresentation(index);
    const isInstructorApplyCard = canApplyToTrain;

    const application =
      item.kind === 'program'
        ? programApplicationMap.get(item.id)
        : courseApplicationMap.get(item.id);

    const applicationStatus = normalizeApplicationStatus(application?.status);
    const applicationStatusRefreshing = isInstructorApplyCard && applicationStateRefreshing;

    const ctaLabel = applicationStatusRefreshing
      ? 'Checking'
      : !isInstructorApplyCard
        ? 'Enroll Classes'
        : isOrganisationDomain && !canOrganisationApply
          ? 'Verify Organisation'
          : isOrganisationDomain && applicationStatus === 'approved'
            ? 'Create Class Job'
            : applicationStatus === 'approved'
              ? 'Approved'
              : applicationStatus === 'pending'
                ? 'Pending'
                : applicationStatus === 'rejected' || applicationStatus === 'revoked'
                  ? 'Reapply to Train'
                  : 'Apply to Train';

    const counts = countsById.get(item.id);
    const classCount = counts?.classes ?? 0;

    const programAgeRange = (() => {
      if (item.kind !== 'program') {
        return { minAge: item.minAge ?? null, maxAge: item.maxAge ?? null };
      }

      const youngestCourse = (programCoursesMap[item.id] ?? [])
        .filter(course => course.age_lower_limit != null || course.age_upper_limit != null)
        .sort((left, right) => {
          const leftLower = left.age_lower_limit ?? Number.POSITIVE_INFINITY;
          const rightLower = right.age_lower_limit ?? Number.POSITIVE_INFINITY;
          if (leftLower !== rightLower) {
            return leftLower - rightLower;
          }

          const leftUpper = left.age_upper_limit ?? Number.POSITIVE_INFINITY;
          const rightUpper = right.age_upper_limit ?? Number.POSITIVE_INFINITY;
          return leftUpper - rightUpper;
        })[0];

      return {
        minAge: youngestCourse?.age_lower_limit ?? youngestCourse?.age_upper_limit ?? null,
        maxAge: youngestCourse?.age_upper_limit ?? youngestCourse?.age_lower_limit ?? null,
      };
    })();

    const programCategoryNames = (() => {
      if (item.kind !== 'program') {
        return item.categoryNames ?? [];
      }

      if (counts?.categoryNames) return counts.categoryNames;
      const courses = programCoursesMap[item.id] ?? [];
      const categories = courses.flatMap(course => course.category_names ?? []);
      return [...new Set(categories)];
    })();

    // The catalogue sums a programme's lessons across its member courses.
    const lessons = counts?.lessons;

    return {
      id: item.id,
      contentKind: item.kind,
      title: item.title,
      description: item.description,

      lessons,

      provider:
        creatorMap.get(item.creatorUuid) ??
        counts?.creatorName ??
        (item.creatorName || 'Course Creator'),

      duration: item.durationLabel,

      enrolledClasses: classCount,

      secondaryMeta:
        item.secondaryMeta ||
        item.levelLabel ||
        item.categoryLabels[0] ||
        (item.kind === 'program' ? 'Training Program' : 'Course'),

      applicationStatus,
      ctaLabel,

      ctaDisabled: applicationStatusRefreshing
        ? true
        : isInstructorApplyCard
          ? isOrganisationDomain
            ? !canOrganisationApply ||
            Boolean(applicationStatus && !REAPPLYABLE_OR_APPROVED.has(applicationStatus))
            : Boolean(applicationStatus && !REAPPLYABLE.has(applicationStatus))
          : false,

      ctaKind: isInstructorApplyCard
        ? item.kind === 'program'
          ? 'apply-program'
          : 'apply-course'
        : 'link',

      ctaTone: isInstructorApplyCard
        ? applicationStatusRefreshing
          ? 'pending'
          : applicationStatus === 'approved'
            ? 'approved'
            : applicationStatus === 'pending'
              ? 'pending'
              : applicationStatus === 'rejected' || applicationStatus === 'revoked'
                ? 'revoked'
                : 'default'
        : 'default',

      minimumRate: item.minimumRate,

      showInstructorCta: !isInstructorApplyCard,

      detailsHref: roleScopedDashboardPath(domain, item.href),
      detailsPrefetchQuery: catalogItemPrefetchQuery(item.kind, item.id),

      enrollHref: isInstructorApplyCard
        ? getApplyToTrainHref(item.kind, item.id)
        : roleScopedDashboardPath(domain, getEnrollHref(domain, item.kind, item.id)),

      instructorHref: roleScopedDashboardPath(domain, getInstructorHref(domain, item.id)),

      icon: presentation.icon,
      imageTone: presentation.imageTone,
      imageUrl: item.imageUrl,
      videoUrl: item.kind === 'program' ? item.videoUrl : item.videoUrl,

      rating: item.rating,
      reviewCount: item.reviewCount,
      enrollmentCount: item.enrollmentCount,

      certificateHref: '',
      category: '',
      subject: '',
      programType: '',
      minAge: programAgeRange.minAge ?? item.minAge ?? undefined,
      maxAge: programAgeRange.maxAge ?? item.maxAge ?? undefined,
      categoryNames: programCategoryNames ?? item.categoryLabels ?? undefined,

      activeClasses: classCount,
      instructorCount: instructorCountFor(item.kind, item.id),
      application,

      // Neither the published-courses nor the training-programs response carries
      // a skills-fund flag, so the card is told "unknown" and leaves the badge
      // off rather than asserting a course is not eligible.
      skillsFundEligible: null,
    };
  });

export function SharedCoursesPage({ domain }: SharedCoursesPageProps) {
  const qc = useQueryClient();
  const user = useUserProfile();
  const instructor = useInstructor();
  const organisation = useOrganisation();
  const student = user?.student;
  const [activeTab, setActiveTab] = useState<CoursesCatalogTab>('all-courses');
  // The enrolment fan-out (schedules, lessons, quizzes per class) only feeds My Courses.
  const { classDefinitions, loading: studentCoursesLoading } = useStudentClassDefinitions(
    domain === 'student' && activeTab === 'my-courses' ? (student ?? undefined) : undefined
  );

  const isInstructorDomain = domain === 'instructor';
  const isStudentDomain = domain === 'student';
  const isOrganisationDomain = domain === 'organisation_user' || domain === 'organisation';

  const canApplyToTrain = isInstructorDomain || isOrganisationDomain;
  const organisationUuid = organisation?.uuid;
  const canOrganisationApply = !isOrganisationDomain || organisation?.admin_verified === true;
  const applicantUuid = isInstructorDomain ? instructor?.uuid : organisationUuid;
  const applicantType = isInstructorDomain
    ? ApplicantTypeEnum.INSTRUCTOR
    : ApplicantTypeEnum.ORGANISATION;

  const [open, setOpen] = useState(false);
  const search = useUrlSearchQuery();
  const patchUrl = useSearchStatePatch();
  const [urlCategory] = useSearchState('category', allParam);
  const [urlLevel] = useSearchState('level', allParam);
  const [urlPrice] = useSearchState('price', priceParam);
  const [sortValue] = useSearchState('sort', sortParam);
  const [catalogPage, setCatalogPage] = useSearchState('page', catalogPageParam);
  const [localFilters, setLocalFilters] = useState<Pick<FilterValues, 'contentType' | 'duration'>>({
    contentType: defaultFilterValues.contentType,
    duration: defaultFilterValues.duration,
  });
  const filters = useMemo<FilterValues>(
    () => ({ ...localFilters, category: urlCategory, level: urlLevel, price: urlPrice }),
    [localFilters, urlCategory, urlLevel, urlPrice]
  );
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const currentCatalogPage = Math.max(1, catalogPage);
  const setCurrentCatalogPage = (next: number | ((current: number) => number)) =>
    setCatalogPage(typeof next === 'function' ? next(currentCatalogPage) : next);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedApplicationCard, setSelectedApplicationCard] = useState<
    CoursesCatalogCardData | CoursesRecommendationCardData | null
  >(null);
  const [selectedApplicationRecord, setSelectedApplicationRecord] =
    useState<CatalogTrainingApplicationData | null>(null);
  const [applicationSheetMode, setApplicationSheetMode] = useState<'apply' | 'review'>('apply');
  const [applicationSheetRevision, setApplicationSheetRevision] = useState(0);

  const { data: categoriesForFacets } = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page: 0, size: 200 } } }),
    staleTime: STALE_TIMES.reference,
    refetchOnWindowFocus: false,
  });
  const selectedCategoryUuid =
    filters.category === 'all' ? null : (subjectByCategory[filters.category] ?? filters.category);
  const categoryFilterUuids = useMemo(
    () =>
      selectedCategoryUuid
        ? categoryWithDescendants(selectedCategoryUuid, categoriesForFacets?.data?.content ?? [])
        : undefined,
    [selectedCategoryUuid, categoriesForFacets]
  );

  // The index filters course text, category and level, one page at a time. Price
  // uses the hydrated minimum training fee: the index's legacy is_free is unreliable.
  const serverCatalogue = filters.contentType !== 'programs';
  const typeSearch = useTypeSearch({
    type: 'courses',
    q: search.q,
    filters: {
      status: 'published',
      category_uuids_in: categoryFilterUuids,
      difficulty_uuid: filters.level === 'all' ? undefined : filters.level,
    },
    facets: FACETS,
    sort:
      SORT_OPTIONS.find(option => option.value === sortValue)?.sort ??
      (search.q ? undefined : 'created_at,desc'),
    page: currentCatalogPage - 1,
    size: CATALOG_PAGE_SIZE,
    enabled: serverCatalogue && !search.searchUnavailable,
  });
  // No database fallback: when the index is down the catalogue lists without the term and
  // the filters narrow the loaded page in the browser.
  const searchDown = search.searchUnavailable || typeSearch.searchUnavailable;
  const facetMode = serverCatalogue && !searchDown;
  const hitIds = useMemo(
    () => typeSearch.hits.flatMap(hit => (hit.uuid ? [hit.uuid] : [])),
    [typeSearch.hits]
  );
  // One batched lookup turns the page of hits into full courses for the cards.
  const hitLookup = useCoursesByIds(facetMode ? hitIds : []);
  // Programmes join only the first server page of courses, and never the courses-only view.
  const showCourses = filters.contentType !== 'programs';
  const showPrograms =
    filters.contentType !== 'short-courses' && (!facetMode || currentCatalogPage === 1);

  const { data: publishedResponse, isLoading: publishedLoading } = useQuery({
    ...getPublishedCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: 18,
        },
      },
    }),
    refetchOnWindowFocus: false,
    enabled: !facetMode && serverCatalogue,
  });
  const coursesLoading = facetMode
    ? (typeSearch.isLoading && !typeSearch.data) || hitLookup.isLoading
    : publishedLoading;

  const programsQuery = useQuery({
    ...getAllTrainingProgramsOptions({
      query: {
        pageable: {
          page: 0,
          size: 12,
        },
        ...(search.q ? { q: search.q } : {}),
      },
    }),
    enabled: showPrograms,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  const { data: programsResponse, isLoading: programsLoading } = programsQuery;
  useSearchErrors(search.q, programsQuery.error);
  const searchIssue = searchDown
    ? 'unavailable'
    : (classifySearchError(typeSearch.error, search.q ?? 'filters') ??
      classifySearchError(programsQuery.error, search.q));
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    ...getAllCategoriesOptions({
      query: {
        pageable: {
          page: 0,
          size: 200,
        },
      },
    }),
    staleTime: STALE_TIMES.reference,
    refetchOnWindowFocus: false,
  });

  const { data: difficultiesResponse, isLoading: difficultiesLoading } = useQuery({
    ...getAllDifficultyLevelsOptions(),
    refetchOnWindowFocus: false,
  });

  const courses = useMemo<Course[]>(
    () =>
      facetMode
        ? hitIds.flatMap(id => (hitLookup.courseMap[id] ? [hitLookup.courseMap[id]] : []))
        : (publishedResponse?.data?.content ?? []),
    [facetMode, hitIds, hitLookup.courseMap, publishedResponse]
  );
  const programs = useMemo(() => programsResponse?.data?.content ?? [], [programsResponse]);
  const categories = useMemo(() => categoriesResponse?.data?.content ?? [], [categoriesResponse]);

  const { data: instructorCourseApplications, isFetching: instructorCourseApplicationsFetching } =
    useQuery({
      ...searchTrainingApplicationsOptions({
        query: {
          pageable: {},
          searchParams: {
            applicant_uuid_eq: instructor?.uuid as string,
            applicant_type_eq: ApplicantTypeEnum.INSTRUCTOR,
          },
        },
      }),
      enabled: isInstructorDomain && Boolean(instructor?.uuid),
      ...trainingApplicationStatusQueryOptions,
    });

  const { data: instructorProgramApplications, isFetching: instructorProgramApplicationsFetching } =
    useQuery({
      ...searchProgramTrainingApplicationsOptions({
        query: {
          pageable: {},
          searchParams: {
            applicant_uuid_eq: instructor?.uuid as string,
            applicant_type_eq: ApplicantTypeEnum.INSTRUCTOR,
          },
        },
      }),
      enabled: isInstructorDomain && Boolean(instructor?.uuid),
      ...trainingApplicationStatusQueryOptions,
    });

  const {
    data: organisationCourseApplications,
    isFetching: organisationCourseApplicationsFetching,
  } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: {
          applicant_uuid_eq: organisationUuid as string,
          applicant_type_eq: ApplicantTypeEnum.ORGANISATION,
        },
      },
    }),
    enabled: isOrganisationDomain && Boolean(organisationUuid),
    ...trainingApplicationStatusQueryOptions,
  });

  const {
    data: organisationProgramApplications,
    isFetching: organisationProgramApplicationsFetching,
  } = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: {
          applicant_uuid_eq: organisationUuid as string,
          applicant_type_eq: ApplicantTypeEnum.ORGANISATION,
        },
      },
    }),
    enabled: isOrganisationDomain && Boolean(organisationUuid),
    ...trainingApplicationStatusQueryOptions,
  });

  const categoryMap = useMemo(
    () => new Map(categories.map(category => [category.uuid ?? '', category.name])),
    [categories]
  );

  const categoriesById = useMemo(
    () => new Map(categories.map(category => [category.uuid ?? category.name, category])),
    [categories]
  );
  const rootCategories = useMemo(
    () => categories.filter(category => !category.parent_uuid),
    [categories]
  );

  const difficultyMap = useMemo(
    () => new Map((difficultiesResponse?.data ?? []).map(level => [level.uuid ?? '', level.name])),
    [difficultiesResponse]
  );

  // Card counts come from the catalogue search, one call per kind mirroring the visible page.
  const catalogueLevel = CATALOGUE_LEVELS.find(
    level => level === difficultyMap.get(filters.level)?.toLowerCase()
  );
  const catalogueSort: CatalogueApiSort =
    sortValue === 'rating'
      ? 'rating'
      : sortValue === 'enrolments'
        ? 'popular'
        : search.q && facetMode && sortValue === 'relevance'
          ? 'relevance'
          : 'newest';
  const courseCatalogueQuery = useQuery({
    ...searchCoursesAndProgrammesOptions({
      query: {
        show: 'courses',
        sort: catalogueSort,
        page: String(facetMode ? currentCatalogPage - 1 : 0),
        size: String(CATALOG_PAGE_SIZE),
        ...(facetMode && search.q ? { q: search.q } : {}),
        ...(facetMode && categoryFilterUuids?.length ? { category_uuid: categoryFilterUuids } : {}),
        ...(facetMode && catalogueLevel ? { level: [catalogueLevel] } : {}),
      },
    }),
    enabled: showCourses,
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });
  const programCatalogueQuery = useQuery({
    ...searchCoursesAndProgrammesOptions({
      query: {
        show: 'programmes',
        sort: 'newest',
        page: '0',
        size: '48',
        ...(search.q ? { q: search.q } : {}),
      },
    }),
    enabled: showPrograms,
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });

  const catalogueCountMap = useMemo(() => {
    const map = new Map<string, CardCounts>();
    for (const response of [courseCatalogueQuery.data, programCatalogueQuery.data]) {
      for (const item of response?.data?.content ?? []) {
        if (item.uuid) map.set(item.uuid, catalogueCounts(item));
      }
    }
    return map;
  }, [courseCatalogueQuery.data, programCatalogueQuery.data]);

  // Per-item fallback, only for on-screen ids the catalogue did not return (normally none).
  const { seenIds, markSeen } = useSeenIds();
  const missingCourseIds = useMemo(() => {
    if (!showCourses || courseCatalogueQuery.isPending) return [];
    const visible =
      activeTab === 'my-courses' && isStudentDomain
        ? classDefinitions.map(definition => definition.course?.uuid)
        : courses.map(course => course.uuid);
    return [
      ...new Set(
        visible.filter(
          (uuid): uuid is string =>
            Boolean(uuid) && seenIds.has(uuid ?? '') && !catalogueCountMap.has(uuid ?? '')
        )
      ),
    ]
      .sort()
      .slice(0, CATALOG_PAGE_SIZE);
  }, [
    activeTab,
    catalogueCountMap,
    classDefinitions,
    courseCatalogueQuery.isPending,
    courses,
    isStudentDomain,
    seenIds,
    showCourses,
  ]);
  const missingProgramIds = useMemo(() => {
    if (!showPrograms || programCatalogueQuery.isPending) return [];
    return programs
      .map(program => program.uuid)
      .filter(
        (uuid): uuid is string =>
          Boolean(uuid) && seenIds.has(uuid ?? '') && !catalogueCountMap.has(uuid ?? '')
      )
      .sort()
      .slice(0, CATALOG_PAGE_SIZE);
  }, [catalogueCountMap, programCatalogueQuery.isPending, programs, seenIds, showPrograms]);

  const { reviewMap } = useCourseReviewsMap(missingCourseIds);
  const { courseEnrollmentMap } = useCourseEnrollmentsMap(missingCourseIds, { countOnly: true });
  const { courseClassesMap } = useCourseClasses(missingCourseIds);
  // Students get 403 on the lessons endpoint, so their fallback leaves lessons unset.
  const fallbackLessonQueries = useQueries({
    queries: missingCourseIds.slice(0, CATALOG_PAGE_SIZE).map(courseUuid => ({
      ...getCourseLessonsOptions({
        path: { courseUuid },
        query: { pageable: { page: 0, size: 1 } },
      }),
      enabled: Boolean(courseUuid) && !isStudentDomain,
      retry: false,
      staleTime: STALE_TIMES.entity,
    })),
  });
  const fallbackProgramClassQueries = useQueries({
    queries: missingProgramIds.slice(0, CATALOG_PAGE_SIZE).map(programUuid => ({
      ...getClassDefinitionsForProgramOptions({ path: { programUuid } }),
      enabled: Boolean(programUuid),
      staleTime: STALE_TIMES.entity,
      refetchOnWindowFocus: false,
    })),
  });
  const fallbackProgramEnrollmentQueries = useQueries({
    queries: missingProgramIds.slice(0, CATALOG_PAGE_SIZE).map(programUuid => ({
      ...getProgramEnrollmentsOptions({
        path: { programUuid },
        query: { pageable: { page: 0, size: 1 } },
      }),
      enabled: Boolean(programUuid),
      staleTime: STALE_TIMES.live,
      refetchOnWindowFocus: false,
    })),
  });

  const countsById = useMemo(() => {
    const map = new Map(catalogueCountMap);
    missingCourseIds.forEach((uuid, index) => {
      const reviews = reviewMap[uuid];
      const lessonTotal = fallbackLessonQueries[index]?.data?.data?.metadata?.totalElements;
      map.set(uuid, {
        rating: averageRating(reviews?.reviews as CourseReview[]),
        reviewCount: reviews?.count,
        learners: courseEnrollmentMap[uuid]?.count,
        lessons: toCount(lessonTotal),
        classes: courseClassesMap[uuid]?.length,
      });
    });
    missingProgramIds.forEach((uuid, index) => {
      map.set(uuid, {
        learners: toCount(fallbackProgramEnrollmentQueries[index]?.data?.data?.metadata?.totalElements),
        classes: fallbackProgramClassQueries[index]?.data?.data?.length,
      });
    });
    return map;
  }, [
    catalogueCountMap,
    courseClassesMap,
    courseEnrollmentMap,
    fallbackLessonQueries,
    fallbackProgramClassQueries,
    fallbackProgramEnrollmentQueries,
    missingCourseIds,
    missingProgramIds,
    reviewMap,
  ]);

  const mappedPrograms = useMemo<UnifiedContentItem[]>(
    () =>
      programs.map(program => {
        const durationLabel = formatDurationFromParts(
          program.total_duration_hours,
          program.total_duration_minutes,
          program.total_duration_display
        );
        const categoryLabel = program.category_uuid
          ? categoryMap.get(program.category_uuid)
          : undefined;

        const counts = countsById.get(program.uuid ?? '');

        return {
          id: program.uuid ?? '',
          kind: 'program',
          title: program.title,
          is_published: program.published,
          description: stripHtml(program.description),
          createdAt: program.created_date ? new Date(program.created_date).getTime() : 0,
          durationMinutes: program.total_duration_hours * 60 + program.total_duration_minutes,
          durationLabel,
          categoryLabels: categoryLabel ? [categoryLabel] : [],
          categoryUuids: program.category_uuid ? [program.category_uuid] : [],
          creatorUuid: program.course_creator_uuid,
          creatorName: '',
          price: program.price ?? undefined,
          minimumRate: program.price ?? undefined,
          imageUrl: program.thumbnail_url ?? undefined,
          videoUrl: program.intro_video_url ?? undefined,
          href: getContentHref(domain, 'program', program.uuid ?? ''),
          enrolledClasses: 1,
          secondaryMeta:
            categoryLabel ??
            program.program_type ??
            (program.price && program.price > 0 ? 'Paid Program' : 'Free Program'),
          bundledCourseCount: counts?.courseCount ?? 0,
          reviewCount: counts?.reviewCount ?? 0,
          rating: counts?.rating ?? 0,
          enrollmentCount: counts?.learners,
          category: program.category_uuid ? categoryMap.get(program.category_uuid) ?? '' : '',
          subject: '',
          programType: '',
          // A training program carries no age limits of its own — the range comes
          // from its youngest bundled course, resolved in `createCatalogCards`.
          minAge: undefined,
          maxAge: undefined,
        };
      }),
    [categoryMap, countsById, domain, programs]
  );

  const mappedCourses = useMemo<UnifiedContentItem[]>(
    () =>
      courses.map(course => {
        const counts = countsById.get(course.uuid ?? '');

        return {
          id: course.uuid ?? '',
          kind: 'course',
          title: course.name,
          is_published: course.is_published as boolean,
          description: stripHtml(course.description),
          createdAt: course.created_date ? new Date(course.created_date).getTime() : 0,
          durationMinutes: course.duration_hours! * 60 + course.duration_minutes!,
          durationLabel: formatDurationFromParts(
            course.duration_hours!,
            course.duration_minutes!,
            course.total_duration_display
          ),
          categoryLabels: course.category_names ?? [],
          categoryUuids: course.category_uuids,
          creatorUuid: course.course_creator_uuid,
          creatorName: '',
          levelLabel: difficultyMap.get(course.difficulty_uuid ?? ''),
          price: course.minimum_training_fee ?? course.price ?? undefined,
          minimumRate: course.minimum_training_fee ?? course.price ?? undefined,
          imageUrl: course.banner_url ?? course.thumbnail_url ?? undefined,
          videoUrl: course.intro_video_url ?? undefined,
          href: getContentHref(domain, 'course', course.uuid ?? ''),
          enrolledClasses: 1,
          secondaryMeta:
            difficultyMap.get(course.difficulty_uuid ?? '') ??
            course.category_names?.[0] ??
            ((course.minimum_training_fee ?? course.price ?? 0) > 0
              ? 'Paid Course'
              : 'Free Course'),
          reviewCount: counts?.reviewCount ?? 0,
          rating: counts?.rating ?? 0,
          enrollmentCount: counts?.learners,
          category: '',
          subject: '',
          programType: '',
          minAge: course.age_lower_limit ?? undefined,
          maxAge: course.age_upper_limit ?? undefined,
          categoryNames: course.category_names,
        };
      }),
    [countsById, courses, difficultyMap, domain]
  );

  const approvedInstructorCourseIds = useMemo(() => {
    const ids = new Set<string>();

    instructorCourseApplications?.data?.content?.forEach(application => {
      if (
        normalizeApplicationStatus(application.status) === 'approved' &&
        application.course_uuid
      ) {
        ids.add(application.course_uuid);
      }
    });

    return ids;
  }, [instructorCourseApplications]);

  const approvedInstructorProgramIds = useMemo(() => {
    const ids = new Set<string>();

    instructorProgramApplications?.data?.content?.forEach(application => {
      if (
        normalizeApplicationStatus(application.status) === 'approved' &&
        application.program_uuid
      ) {
        ids.add(application.program_uuid);
      }
    });

    return ids;
  }, [instructorProgramApplications]);

  const approvedOrganisationCourseIds = useMemo(() => {
    const ids = new Set<string>();

    organisationCourseApplications?.data?.content?.forEach(application => {
      if (
        normalizeApplicationStatus(application.status) === 'approved' &&
        application.course_uuid
      ) {
        ids.add(application.course_uuid);
      }
    });

    return ids;
  }, [organisationCourseApplications]);

  const approvedOrganisationProgramIds = useMemo(() => {
    const ids = new Set<string>();

    organisationProgramApplications?.data?.content?.forEach(application => {
      if (
        normalizeApplicationStatus(application.status) === 'approved' &&
        application.program_uuid
      ) {
        ids.add(application.program_uuid);
      }
    });

    return ids;
  }, [organisationProgramApplications]);

  const myCourseItems = useMemo<UnifiedContentItem[]>(() => {
    if (isStudentDomain) {
      const uniqueCourses = new Map<string, UnifiedContentItem>();

      classDefinitions.forEach((definition, index) => {
        const course = definition.course;
        if (!course?.uuid) {
          return;
        }

        const counts = countsById.get(course.uuid);

        const classCount = definition.classEnrollments.length || definition.schedules?.length || 0;
        const existing = uniqueCourses.get(course.uuid);
        const presentation = getCardPresentation(index);

        uniqueCourses.set(course.uuid, {
          id: course.uuid,
          kind: 'course',
          title: course.name,
          is_published: course.is_published as boolean,
          description: stripHtml(course.description),
          createdAt: course.created_date ? new Date(course.created_date).getTime() : 0,
          durationMinutes: course.duration_hours! * 60 + course.duration_minutes!,
          durationLabel: formatDurationFromParts(
            course.duration_hours!,
            course.duration_minutes!,
            course.total_duration_display
          ),
          categoryLabels: course.category_names ?? [],
          categoryUuids: course.category_uuids,
          creatorUuid: course.course_creator_uuid,
          creatorName: existing?.creatorName ?? '',
          levelLabel: difficultyMap.get(course.difficulty_uuid ?? ''),
          price: course.minimum_training_fee ?? course.price ?? undefined,
          minimumRate: course.minimum_training_fee ?? course.price ?? undefined,
          imageUrl: course.banner_url ?? course.thumbnail_url ?? undefined,
          href: getContentHref(domain, 'course', course.uuid),
          enrolledClasses: 2,
          secondaryMeta:
            definition.classDetails?.title ??
            course.category_names?.[0] ??
            (classCount === 1 ? '1 enrolled class' : `${classCount} enrolled classes`),
          bundledCourseCount: classCount,
          icon: existing?.icon ?? presentation.icon,
          imageTone: existing?.imageTone ?? presentation.imageTone,
          reviewCount: counts?.reviewCount ?? 0,
          rating: counts?.rating ?? 0,
          enrollmentCount: counts?.learners,
          activeClasses: classCount,
          category: '',
          subject: '',
          programType: '',
          minAge: course.age_lower_limit ?? undefined,
          maxAge: course.age_upper_limit ?? undefined,
          categoryNames: course.category_names,
        });
      });

      return Array.from(uniqueCourses.values()).sort(
        (left, right) => right.createdAt - left.createdAt
      );
    }

    if (isInstructorDomain) {
      return [
        ...mappedCourses.filter(course => approvedInstructorCourseIds.has(course.id)),
        ...mappedPrograms.filter(program => approvedInstructorProgramIds.has(program.id)),
      ].sort((left, right) => right.createdAt - left.createdAt);
    }

    if (isOrganisationDomain) {
      return [
        ...mappedCourses.filter(course => approvedOrganisationCourseIds.has(course.id)),
        ...mappedPrograms.filter(program => approvedOrganisationProgramIds.has(program.id)),
      ].sort((left, right) => right.createdAt - left.createdAt);
    }

    const courseCreatorUuid = user?.courseCreator?.uuid;
    if (courseCreatorUuid) {
      return mappedCourses.filter(course => course.creatorUuid === courseCreatorUuid);
    }

    return [];
  }, [
    approvedInstructorCourseIds,
    approvedInstructorProgramIds,
    approvedOrganisationCourseIds,
    approvedOrganisationProgramIds,
    classDefinitions,
    countsById,
    difficultyMap,
    domain,
    isInstructorDomain,
    isOrganisationDomain,
    isStudentDomain,
    mappedCourses,
    mappedPrograms,
    user?.courseCreator?.uuid,
  ]);

  const filterSections = useMemo<CoursesFilterSection[]>(
    () => [
      {
        key: 'contentType',
        title: 'Content Type',
        options: [
          { label: 'All Courses & Programs', value: 'all-courses' },
          { label: 'Program', value: 'programs' },
          { label: 'Short Course', value: 'short-courses' },
          // { label: 'My Courses', value: 'my-courses' },
        ],
      },
      {
        key: 'category',
        title: 'Categories',
        options: [
          { label: 'All Categories', value: 'all' },
          ...rootCategories.map(category => ({
            label: category.name,
            value: category.uuid ?? category.name,
          })),
        ],
      },
      {
        key: 'level',
        title: 'Level',
        options: [
          { label: 'All Levels', value: 'all' },
          ...(difficultiesResponse?.data ?? []).map(level => ({
            label: level.name,
            value: level.uuid ?? level.name,
          })),
        ],
      },
      {
        key: 'duration',
        title: 'Duration',
        options: [
          { label: 'Any Duration', value: 'all' },
          { label: '0 - 5 Hours', value: '0-5-hours' },
          { label: '6 - 20 Hours', value: '6-20-hours' },
          { label: '20+ Hours', value: '20-plus-hours' },
        ],
      },
      {
        key: 'price',
        title: 'Price',
        options: [
          { label: 'Any Price', value: 'all' },
          { label: 'Free', value: 'free' },
          { label: 'Paid', value: 'paid' },
        ],
      },
    ],
    [rootCategories, difficultiesResponse]
  );

  const allCoursesFeed = useMemo(() => {
    const items = [...mappedCourses, ...mappedPrograms];
    if (sortValue === 'price') {
      return items.sort((left, right) => (left.minimumRate ?? 0) - (right.minimumRate ?? 0));
    }
    if (sortValue === 'rating') {
      return items.sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0));
    }
    if (sortValue === 'enrolments') {
      return items.sort(
        (left, right) => (right.enrollmentCount ?? 0) - (left.enrollmentCount ?? 0)
      );
    }
    if (sortValue === 'newest' || !search.q) {
      return items.sort((left, right) => right.createdAt - left.createdAt);
    }
    return items;
  }, [mappedCourses, mappedPrograms, search.q, sortValue]);

  const baseTabItems = useMemo(() => {
    if (activeTab === 'my-courses') {
      return myCourseItems;
    }

    if (activeTab === 'programs') {
      return mappedPrograms;
    }

    if (activeTab === 'short-courses') {
      return mappedCourses;
    }

    return allCoursesFeed;
  }, [activeTab, allCoursesFeed, mappedCourses, mappedPrograms, myCourseItems]);

  const normalizedSearch = search.q ?? '';

  const itemsBeforePrice = useMemo(
    () =>
      baseTabItems.filter(item => {
        if (item.is_published !== true) return false;
        if (!matchesCatalogContentType(item, filters.contentType)) return false;

        const matchesDuration =
          filters.duration === 'all' ||
          getDurationBucket(item.durationMinutes) === filters.duration;

        // Text, category and level were applied to courses by the search index.
        if (facetMode && item.kind === 'course') return matchesDuration;

        const resolvedDifficultyLabel = difficultyMap.get(filters.level) ?? filters.level;

        const selectedCategory = subjectByCategory[filters.category] ?? filters.category;

        const matchesCategory =
          filters.category === 'all' ||
          matchesCategoryFilter(item, selectedCategory, categories, categoriesById);

        const matchesLevel =
          filters.level === 'all' ||
          item.levelLabel?.toLowerCase() === resolvedDifficultyLabel.toLowerCase();

        return matchesCategory && matchesLevel && matchesDuration;
      }),
    [baseTabItems, categories, categoriesById, difficultyMap, facetMode, filters, subjectByCategory]
  );
  const filteredItems = useMemo(
    () => itemsBeforePrice.filter(item => matchesCatalogPrice(item, filters.price)),
    [itemsBeforePrice, filters.price]
  );

  // URL filters reset paging as they are written; local ones (tab, duration, subject) do
  // it here, after the first render so a shared ?page= survives the load.
  const pageResetKey = `${activeTab}|${localFilters.contentType}|${localFilters.duration}|${JSON.stringify(subjectByCategory)}`;
  const lastPageResetKey = useRef(pageResetKey);
  useEffect(() => {
    if (lastPageResetKey.current === pageResetKey) return;
    lastPageResetKey.current = pageResetKey;
    if (catalogPage !== 1) setCatalogPage(1);
  }, [pageResetKey, catalogPage, setCatalogPage]);

  const serverTotalPages = Math.max(1, Number(typeSearch.metadata?.totalPages ?? 1));
  const courseResultCount = Number(typeSearch.metadata?.totalElements ?? mappedCourses.length);
  const hasLocalCatalogFilters = filters.price !== 'all' || filters.duration !== 'all';
  const totalCatalogPages = facetMode
    ? serverTotalPages
    : Math.max(1, Math.ceil(filteredItems.length / CATALOG_PAGE_SIZE));
  // Programs are loaded separately and appear once, alongside the first
  // server page of courses, rather than repeating on every course page.
  const paginatedItems = useMemo(
    () =>
      facetMode
        ? filteredItems.filter(item => item.kind === 'course' || currentCatalogPage === 1)
        : filteredItems.slice(
          (currentCatalogPage - 1) * CATALOG_PAGE_SIZE,
          currentCatalogPage * CATALOG_PAGE_SIZE
        ),
    [currentCatalogPage, facetMode, filteredItems]
  );
  const resultCount = catalogResultCount(
    facetMode && hasLocalCatalogFilters ? paginatedItems : filteredItems,
    facetMode && !hasLocalCatalogFilters ? courseResultCount : undefined
  );

  const instructorCourseApplicationMap = useMemo(() => {
    const grouped = new Map<string, CatalogTrainingApplicationData[]>();
    instructorCourseApplications?.data?.content?.forEach(application => {
      if (application.course_uuid) {
        const bucket = grouped.get(application.course_uuid) ?? [];
        bucket.push(application);
        grouped.set(application.course_uuid, bucket);
      }
    });
    const map = new Map<string, CatalogTrainingApplicationData>();
    grouped.forEach((applications, uuid) => {
      const decisive = decisiveTrainingApplication(applications);
      if (decisive) map.set(uuid, decisive);
    });
    return map;
  }, [instructorCourseApplications]);

  const instructorProgramApplicationMap = useMemo(() => {
    const grouped = new Map<string, CatalogTrainingApplicationData[]>();
    instructorProgramApplications?.data?.content?.forEach(application => {
      if (application.program_uuid) {
        const bucket = grouped.get(application.program_uuid) ?? [];
        bucket.push(application);
        grouped.set(application.program_uuid, bucket);
      }
    });
    const map = new Map<string, CatalogTrainingApplicationData>();
    grouped.forEach((applications, uuid) => {
      const decisive = decisiveTrainingApplication(applications);
      if (decisive) map.set(uuid, decisive);
    });
    return map;
  }, [instructorProgramApplications]);

  const organisationCourseApplicationMap = useMemo(() => {
    const grouped = new Map<string, CatalogTrainingApplicationData[]>();
    organisationCourseApplications?.data?.content?.forEach(application => {
      if (application.course_uuid) {
        const bucket = grouped.get(application.course_uuid) ?? [];
        bucket.push(application);
        grouped.set(application.course_uuid, bucket);
      }
    });
    const map = new Map<string, CatalogTrainingApplicationData>();
    grouped.forEach((applications, uuid) => {
      const decisive = decisiveTrainingApplication(applications);
      if (decisive) map.set(uuid, decisive);
    });
    return map;
  }, [organisationCourseApplications]);

  const organisationProgramApplicationMap = useMemo(() => {
    const grouped = new Map<string, CatalogTrainingApplicationData[]>();
    organisationProgramApplications?.data?.content?.forEach(application => {
      if (application.program_uuid) {
        const bucket = grouped.get(application.program_uuid) ?? [];
        bucket.push(application);
        grouped.set(application.program_uuid, bucket);
      }
    });
    const map = new Map<string, CatalogTrainingApplicationData>();
    grouped.forEach((applications, uuid) => {
      const decisive = decisiveTrainingApplication(applications);
      if (decisive) map.set(uuid, decisive);
    });
    return map;
  }, [organisationProgramApplications]);

  const activeCourseApplicationMap = isOrganisationDomain
    ? organisationCourseApplicationMap
    : instructorCourseApplicationMap;
  const activeProgramApplicationMap = isOrganisationDomain
    ? organisationProgramApplicationMap
    : instructorProgramApplicationMap;
  const applicationStateRefreshing = isInstructorDomain
    ? instructorCourseApplicationsFetching || instructorProgramApplicationsFetching
    : isOrganisationDomain
      ? organisationCourseApplicationsFetching || organisationProgramApplicationsFetching
      : false;

  // The catalogue names most creators; one batched lookup covers the rest on this page.
  const creatorIds = useMemo(
    () => [
      ...new Set(
        paginatedItems
          .filter(item => item.creatorUuid && !countsById.get(item.id)?.creatorName)
          .map(item => item.creatorUuid)
      ),
    ],
    [countsById, paginatedItems]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);
  const creatorMap = useMemo(
    () =>
      new Map(
        Object.entries(courseCreatorMap).map(([uuid, creator]) => [
          uuid,
          creator.full_name || 'Course Creator',
        ])
      ),
    [courseCreatorMap]
  );

  const applyToTrainCourseMut = useMutation(submitTrainingApplicationMutation());
  const applyToTrainProgramMut = useMutation(submitProgramTrainingApplicationMutation());

  const programUuids = useMemo(
    () =>
      paginatedItems
        .filter(item => item.kind === 'program')
        .map(item => item.id)
        .filter(Boolean)
        .sort(),
    [paginatedItems]
  );

  // Program age ranges and category fallbacks come from member courses: one batched
  // link search, then one batched course lookup, instead of a call per program.
  const programLinksQuery = useQuery({
    ...searchProgramCoursesOptions({
      query: {
        searchParams: { program_uuid_in: programUuids.join(',') },
        pageable: { page: 0, size: 200 },
      },
    }),
    enabled: programUuids.length > 0,
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });
  const programLinks = useMemo(
    () => (programLinksQuery.data?.error ? [] : (programLinksQuery.data?.data?.content ?? [])),
    [programLinksQuery.data]
  );
  const memberCourseIds = useMemo(
    () => [...new Set(programLinks.map(link => link.course_uuid).filter(Boolean))],
    [programLinks]
  );
  const memberCourses = useCoursesByIds(memberCourseIds);

  const programCoursesMap = useMemo<Record<string, Course[]>>(() => {
    const map: Record<string, Course[]> = {};
    for (const link of programLinks) {
      const course = memberCourses.courseMap[link.course_uuid];
      if (!course) continue;
      map[link.program_uuid] = [...(map[link.program_uuid] ?? []), course];
    }
    return map;
  }, [memberCourses.courseMap, programLinks]);

  const catalogCards = useMemo(
    () =>
      createCatalogCards(
        paginatedItems,
        domain,
        creatorMap,
        canApplyToTrain,
        isOrganisationDomain,
        canOrganisationApply,
        applicationStateRefreshing,
        activeCourseApplicationMap,
        activeProgramApplicationMap,
        countsById,
        programCoursesMap,
        (kind, id) => cachedInstructorCount(qc, kind, id)
      ),
    [
      paginatedItems,
      domain,
      creatorMap,
      canApplyToTrain,
      isOrganisationDomain,
      canOrganisationApply,
      applicationStateRefreshing,
      activeCourseApplicationMap,
      activeProgramApplicationMap,
      countsById,
      programCoursesMap,
      qc,
    ]
  );

  const isLoading =
    coursesLoading ||
    programsLoading ||
    categoriesLoading ||
    difficultiesLoading ||
    (isStudentDomain && studentCoursesLoading);

  const setFilterValue = (key: CoursesFilterSection['key'], value: string) => {
    if (key === 'category') setSubjectByCategory({});
    if (key === 'category' || key === 'level' || key === 'price') {
      patchUrl({ [key]: value === 'all' ? undefined : value });
    } else {
      setLocalFilters(current => ({ ...current, [key]: value }));
    }

    if (
      key === 'contentType' &&
      (value === 'programs' || value === 'short-courses' || value === 'all-courses')
    ) {
      setActiveTab(current => (current === 'my-courses' ? current : value));
    }
  };

  const clearFilters = () => {
    setSubjectByCategory({});
    setLocalFilters({
      duration: defaultFilterValues.duration,
      contentType: defaultFilterValues.contentType,
    });
    setActiveTab(current => (current === 'my-courses' ? current : 'all-courses'));
    patchUrl({ category: undefined, level: undefined, price: undefined });
  };

  // Facet counts from the search response. Meilisearch counts with every filter applied,
  // so a group's counts are shown only while nothing in it is selected (FacetChips).
  const levelFacet = typeSearch.facets.difficulty_uuid ?? {};
  const levelOptions = (difficultiesResponse?.data ?? []).flatMap(level =>
    level.uuid ? [{ value: level.uuid, label: level.name, count: levelFacet[level.uuid] ?? 0 }] : []
  );
  const priceOptions = catalogPriceOptions(
    facetMode
      ? itemsBeforePrice.filter(item => item.kind === 'course' || currentCatalogPage === 1)
      : itemsBeforePrice
  );

  const handleCatalogCardAction = (card: CoursesCatalogCardData) => {
    if (!canApplyToTrain) {
      return;
    }

    if (card.ctaKind !== 'apply-course' && card.ctaKind !== 'apply-program') {
      return;
    }

    if (isOrganisationDomain && !canOrganisationApply) {
      toast.error('Your organisation must be verified before applying to train.');
      return;
    }

    if (!applicantUuid) {
      toast.error('Please wait for your organisation profile to load.');
      return;
    }

    setSelectedApplicationCard(card);
    setSelectedApplicationRecord(card.application ?? null);
    setApplicationSheetMode(
      card.application?.status?.toLowerCase() === 'approved' ||
        card.application?.status?.toLowerCase() === 'pending' ||
        card.application?.status?.toLowerCase() === 'rejected' ||
        card.application?.status?.toLowerCase() === 'revoked'
        ? 'review'
        : 'apply'
    );
    setApplyModalOpen(true);
  };

  const handleApplyToTrain = (data: { notes: string; rate_card: RateCard }) => {
    if (!selectedApplicationCard || !applicantUuid) return;

    const body = {
      applicant_type: applicantType,
      applicant_uuid: applicantUuid,
      rate_card: data.rate_card,
      application_notes: data.notes,
    };

    if (selectedApplicationCard.ctaKind === 'apply-program') {
      applyToTrainProgramMut.mutate(
        {
          body,
          path: { programUuid: selectedApplicationCard.id },
        },
        {
          onSuccess: async response => {
            await invalidateTrainingApplicationWorkflowQueries(qc);
            toast.success(response?.message);
            setApplyModalOpen(false);
            setSelectedApplicationCard(null);
          },
          onError: error => {
            toast.error(errorMessage(error) ?? 'Unable to submit program application');
          },
        }
      );
      return;
    }

    applyToTrainCourseMut.mutate(
      {
        body,
        path: { courseUuid: selectedApplicationCard.id },
      },
      {
        onSuccess: async response => {
          await invalidateTrainingApplicationWorkflowQueries(qc);
          toast.success(response?.message);
          setApplyModalOpen(false);
          setSelectedApplicationCard(null);
        },
        onError: error => {
          toast.error(errorMessage(error) ?? 'Unable to submit course application');
        },
      }
    );
  };

  const providerCount = useMemo(
    () => new Set(allCoursesFeed.map(item => item.creatorUuid).filter(Boolean)).size,
    [allCoursesFeed]
  );

  const activeFilterCount = useMemo(
    () =>
      (Object.keys(filters) as Array<keyof FilterValues>).filter(
        key => filters[key] !== defaultFilterValues[key]
      ).length + (subjectByCategory[filters.category] ? 1 : 0),
    [filters, subjectByCategory]
  );

  const applicationCardDuration = !selectedApplicationCard
    ? undefined
    : 'duration' in selectedApplicationCard
      ? selectedApplicationCard.duration
      : selectedApplicationCard.weeks;

  const catalogueSubtitle = isOrganisationDomain
    ? 'Discover courses and programmes your organisation is approved to train.'
    : isInstructorDomain
      ? 'Browse the marketplace and apply to train the courses and programmes you know best.'
      : isStudentDomain
        ? 'Discover courses and programmes to enroll in and grow your skills.'
        : domain === 'course_creator'
          ? 'Explore the marketplace and see how your courses sit alongside the catalogue.'
          : 'Discover courses and programmes across the platform.';

  return (
    <div className={`bg-background ${surfaceTheme.pageWide} py-4`}>
      <div className='space-y-6'>
        <header className='bg-card'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            {isStudentDomain ? (
              <div className=''>
                <h1 className='text-2xl font-bold'>Start a Course</h1>
                <p className='text-muted-foreground/60 text-sm'>
                  Choose how you want to learn — join a class or find an instructor.
                </p>
              </div>
            ) : (
              <div className=''>
                <h1 className='text-2xl font-bold'>Course Catalogue</h1>
                <p className='text-muted-foreground/60 text-sm'>{catalogueSubtitle}</p>
              </div>
            )}

            <div className='flex flex-wrap gap-2'>
              {[
                {
                  icon: GraduationCap,
                  value: facetMode ? courseResultCount : mappedCourses.length,
                  label: 'Courses',
                },
                {
                  icon: Layers,
                  value: mappedPrograms.length,
                  label: 'Programmes',
                },
                {
                  icon: Users,
                  value: providerCount,
                  label: 'Providers',
                },
              ].map(({ icon: Icon, value, label }) => (
                <span
                  key={label}
                  className='border-border bg-background inline-flex items-center gap-1.5 rounded-lg border px-3 py-2'
                >
                  <Icon className='text-primary size-4' />

                  <span className='text-foreground text-sm font-semibold tabular-nums'>
                    {value}
                  </span>

                  <span className='text-muted-foreground text-sm'>{label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className='mt-4 space-y-2'>
            <SearchQueryInput
              search={search}
              placeholder='Search courses and programmes…'
              aria-label='Search the course catalogue'
              className='h-11'
            />
            <SearchNotice
              issue={searchIssue}
              onReset={() => {
                search.clear();
                clearFilters();
              }}
            />
          </div>
        </header>

        <CategoryTabs
          categories={categories}
          activeCategory={filters.category === 'all' ? ALL_CATEGORIES : filters.category}
          onCategoryChange={category => {
            setFilterValue('category', category === ALL_CATEGORIES ? 'all' : category);
          }}
          subjectByCategory={subjectByCategory}
          onSubjectChange={setSubjectByCategory}
          className='mx-0 px-0 sm:mx-0 sm:px-0'
        />

        {!searchDown ? (
          coursesLoading || programsLoading ? (
            <div className='flex flex-wrap gap-6'>
              <FacetChipsSkeleton chips={4} />
              <FacetChipsSkeleton chips={2} />
            </div>
          ) : (
            <div className='flex flex-wrap items-end gap-x-8 gap-y-3'>
              {serverCatalogue ? (
                <FacetChips
                  label='Level'
                  options={levelOptions}
                  selected={filters.level === 'all' ? [] : [filters.level]}
                  multiple={false}
                  hideEmpty
                  onChange={next => setFilterValue('level', next[0] ?? 'all')}
                />
              ) : null}
              <FacetChips
                label={facetMode && serverTotalPages > 1 ? 'Price (this page)' : 'Price'}
                options={priceOptions}
                selected={filters.price === 'all' ? [] : [filters.price]}
                multiple={false}
                onChange={next => setFilterValue('price', next[0] ?? 'all')}
              />
            </div>
          )
        ) : null}

        <section className='space-y-2'>
          <div className=''>
            <div className='space-y-2'>
              <div className='bg-card rounded-sm p-0'>
                <div className='border-border bg-card sticky top-0 z-10 flex flex-row items-center justify-between gap-3 py-2.5'>
                  <p className='text-muted-foreground text-xs font-medium sm:text-sm'>
                    <span className='text-foreground font-semibold tabular-nums' aria-live='polite'>
                      {resultCount}
                    </span>{' '}
                    result{resultCount === 1 ? '' : 's'}
                    {facetMode && hasLocalCatalogFilters && serverTotalPages > 1
                      ? ' on this page'
                      : null}
                    {normalizedSearch ? (
                      <span className='text-muted-foreground'> for “{normalizedSearch}”</span>
                    ) : null}
                  </p>

                  <div className='flex flex-wrap items-center gap-2'>
                    {facetMode ? (
                      <Select
                        value={sortValue}
                        onValueChange={value =>
                          patchUrl({ sort: value === 'relevance' ? undefined : value })
                        }
                      >
                        <SelectTrigger
                          className='h-9 w-auto min-w-[160px]'
                          aria-label='Sort courses'
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    {activeFilterCount > 0 || normalizedSearch ? (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          clearFilters();
                          search.clear();
                        }}
                        className='text-muted-foreground hover:text-foreground h-9 px-2 text-xs font-semibold'
                      >
                        Clear all
                      </Button>
                    ) : null}
                    <Sheet open={open} onOpenChange={setOpen}>
                      <SheetTrigger asChild>
                        <Button variant='outline' size='sm' className='h-9 gap-2'>
                          <SlidersHorizontal className='size-4' />
                          <span className='text-sm font-semibold'>Filters</span>
                          {activeFilterCount > 0 ? (
                            <span className='bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full text-[0.7rem] font-semibold tabular-nums'>
                              {activeFilterCount}
                            </span>
                          ) : null}
                        </Button>
                      </SheetTrigger>

                      <SheetContent className='flex h-full flex-col'>
                        <SheetHeader className='pb-0'>
                          <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>

                        <SheetDescription asChild>
                          <div className='hidden'>
                            Filter courses by category, level, and other criteria.
                          </div>
                        </SheetDescription>

                        <div className='mb-4 flex-1 overflow-y-auto pr-2'>
                          <CoursesCategoryFilters
                            sections={filterSections}
                            selectedValues={filters}
                            onSelect={(key, value) => {
                              setFilterValue(key, value);
                              setOpen(false);
                            }}
                            onClear={clearFilters}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {isLoading ? (
                  <div className={surfaceTheme.cardGrid}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className='space-y-4 rounded-2xl border p-4'>
                        <Skeleton className='h-40 w-full rounded-xl' />
                        <Skeleton className='h-6 w-3/4' />
                        <div className='space-y-2'>
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-4 w-5/6' />
                        </div>
                        <div className='flex items-center justify-between pt-2'>
                          <Skeleton className='h-5 w-20' />
                          <Skeleton className='h-10 w-28 rounded-lg' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : catalogCards.length > 0 ? (
                  <div className=''>
                    <div className={surfaceTheme.cardGrid}>
                      {!isStudentDomain &&
                        catalogCards.map(card => (
                          <SeenOnScreen
                            key={card.id}
                            id={card.id}
                            onSeen={markSeen}
                            className='min-w-0'
                          >
                            <CoursesCatalogCard
                              type='general'
                              card={card}
                              onPrimaryAction={handleCatalogCardAction}
                            />
                          </SeenOnScreen>
                        ))}

                      {isStudentDomain &&
                        catalogCards.map(card => (
                          <SeenOnScreen
                            key={card.id}
                            id={card.id}
                            onSeen={markSeen}
                            className='min-w-0'
                          >
                            <StudentCoursesCard type='general' card={card} />
                          </SeenOnScreen>
                        ))}
                    </div>

                    {totalCatalogPages > 1 ? (
                      <Pagination className='mt-5 justify-center'>
                        <PaginationContent className='flex-wrap justify-center'>
                          <PaginationItem>
                            <PaginationPrevious
                              href='#'
                              onClick={event => {
                                event.preventDefault();
                                setCurrentCatalogPage(current => Math.max(1, current - 1));
                              }}
                            />
                          </PaginationItem>

                          {Array.from({ length: totalCatalogPages }).map((_, index) => {
                            const page = index + 1;
                            const shouldShow =
                              totalCatalogPages <= 5 ||
                              page === 1 ||
                              page === totalCatalogPages ||
                              Math.abs(page - currentCatalogPage) <= 1;

                            if (!shouldShow) {
                              if (page === 2 || page === totalCatalogPages - 1) {
                                return (
                                  <PaginationItem key={`ellipsis-${page}`}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }

                              return null;
                            }

                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href='#'
                                  isActive={page === currentCatalogPage}
                                  onClick={event => {
                                    event.preventDefault();
                                    setCurrentCatalogPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}

                          <PaginationItem>
                            <PaginationNext
                              href='#'
                              onClick={event => {
                                event.preventDefault();
                                setCurrentCatalogPage(current =>
                                  Math.min(totalCatalogPages, current + 1)
                                );
                              }}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    ) : null}
                  </div>
                ) : (
                  <div className='px-4 py-12 text-center'>
                    <p className='text-foreground text-base font-semibold'>No courses found</p>
                    <p className='text-muted-foreground mt-2 text-sm'>
                      Try changing your filters or switching to another tab.
                    </p>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={clearFilters}
                      className='mt-4 rounded-xl'
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {selectedApplicationCard ? (
        <NotesModal
          open={applyModalOpen}
          setOpen={open => {
            setApplyModalOpen(open);
            if (!open) {
              setSelectedApplicationCard(null);
              setSelectedApplicationRecord(null);
              setApplicationSheetMode('apply');
            }
          }}
          title={
            applicationSheetMode === 'review'
              ? 'Application Details'
              : selectedApplicationCard.ctaKind === 'apply-program'
                ? 'Apply to Train a Program'
                : 'Apply to Train a Course'
          }
          description={
            <div className='space-y-2'>
              {applicationSheetMode === 'review' && selectedApplicationRecord ? (
                <>
                  <p>
                    This is your submitted application for{' '}
                    <span className='font-semibold'>
                      &ldquo;{selectedApplicationCard.title}&rdquo;
                    </span>
                    .
                  </p>
                  <p>
                    Status:{' '}
                    <span className='font-medium capitalize'>
                      {selectedApplicationRecord.status ?? 'unknown'}
                    </span>
                    {selectedApplicationRecord.reviewed_at
                      ? ` · Reviewed ${new Date(selectedApplicationRecord.reviewed_at).toLocaleDateString()}`
                      : ''}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    You are applying to train the{' '}
                    {selectedApplicationCard.ctaKind === 'apply-program' ? 'program' : 'course'}{' '}
                    titled{' '}
                    <span className='font-semibold'>
                      &ldquo;{selectedApplicationCard.title}&rdquo;
                    </span>
                    .
                  </p>
                  <p>
                    Provider:{' '}
                    <span className='font-medium'>{selectedApplicationCard.provider}</span>
                    {/* A recommendation card carries the same label under `weeks`. */}
                    {applicationCardDuration ? ` · Duration: ${applicationCardDuration}` : ''}
                    {selectedApplicationCard.secondaryMeta
                      ? ` · Focus: ${selectedApplicationCard.secondaryMeta}`
                      : ''}
                  </p>
                  <p>
                    Submit your application notes and price each training method you offer per hour
                    and per day, at or above the creator-set minimum.
                  </p>
                </>
              )}
            </div>
          }
          onSave={handleApplyToTrain}
          saveText='Submit application'
          cancelText='Cancel'
          placeholder='Enter your application notes here...'
          isLoading={applyToTrainCourseMut.isPending || applyToTrainProgramMut.isPending}
          minimum_rate={selectedApplicationCard.minimumRate ?? 0}
          selectedApplicationCard={selectedApplicationCard}
          applicantRole={isOrganisationDomain ? 'organisation_user' : 'instructor'}
          existingApplication={selectedApplicationRecord}
          readOnly={applicationSheetMode === 'review'}
          canReapply={
            applicationSheetMode === 'review' &&
            (selectedApplicationRecord?.status?.toLowerCase() === 'rejected' ||
              selectedApplicationRecord?.status?.toLowerCase() === 'revoked')
          }
          onReapply={() => {
            setApplicationSheetMode('apply');
            setSelectedApplicationRecord(null);
            setApplicationSheetRevision(value => value + 1);
          }}
          formRevision={applicationSheetRevision}
        />
      ) : null}
    </div>
  );
}
