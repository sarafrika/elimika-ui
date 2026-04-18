'use client';

import NotesModal from '@/components/custom-modals/notes-modal';
import { Button } from '@/components/ui/button';
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
import type { UserDomain } from '@/lib/types';
import { ApplicantTypeEnum } from '@/services/client';
import {
  getAllCategoriesOptions,
  getAllDifficultyLevelsOptions,
  getAllTrainingProgramsOptions,
  getCourseCreatorByUuidOptions,
  getCourseReviewsOptions,
  getProgramCoursesOptions,
  getPublishedCoursesOptions,
  searchProgramTrainingApplicationsOptions,
  searchProgramTrainingApplicationsQueryKey,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey,
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Category } from '@/services/client/types.gen';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Filter, SquareDashedMousePointer } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CoursesCatalogCard } from './CoursesCatalogCard';
import { CoursesCategoryFilters } from './CoursesCategoryFilters';
import { CoursesCategoryTile } from './CoursesCategoryTile';
import { CoursesHero } from './CoursesHero';
import { CoursesRecommendationCard } from './CoursesRecommendationCard';
import {
  catalogTabs,
  formatDurationFromParts,
  getApplyToTrainHref,
  getCardPresentation,
  getCategoryTilePresentation,
  getContentHref,
  getDurationBucket,
  getEnrollHref,
  getInstructorHref,
  heroActions,
  stripHtml,
  type CoursesCatalogCardData,
  type CoursesCatalogTab,
  type CoursesFilterSection,
  type CoursesRecommendationCardData,
} from './courses-data';

type SharedCoursesPageProps = {
  domain: UserDomain;
};

type UnifiedContentItem = {
  id: string;
  kind: 'course' | 'program';
  title: string;
  description: string;
  createdAt: number;
  durationMinutes: number;
  durationLabel: string;
  categoryLabels: string[];
  creatorUuid: string;
  creatorName: string;
  levelLabel?: string;
  price?: number;
  minimumRate?: number;
  imageUrl?: string;
  href: string;
  secondaryMeta: string;
  bundledCourseCount?: number;
};

type FilterValues = Record<CoursesFilterSection['key'], string>;

const defaultFilterValues: FilterValues = {
  category: 'all',
  contentType: 'all-courses',
  duration: 'all',
  level: 'all',
  price: 'all',
};

const getCatalogBatchSize = (width: number) => {
  if (width >= 1280) {
    return 9;
  }

  return 8;
};

const createCatalogCards = (
  items: UnifiedContentItem[],
  domain: UserDomain,
  creatorMap: Map<string, string>,
  instructorCourseApplicationMap: Map<string, { status?: string | null }>,
  instructorProgramApplicationMap: Map<string, { status?: string | null }>
): CoursesCatalogCardData[] =>
  items.map((item, index) => {
    const presentation = getCardPresentation(index);
    const isInstructorApplyCard = domain === 'instructor';
    const application =
      item.kind === 'program'
        ? instructorProgramApplicationMap.get(item.id)
        : instructorCourseApplicationMap.get(item.id);
    const applicationStatus = application?.status ?? null;
    const ctaLabel = !isInstructorApplyCard
      ? item.kind === 'program'
        ? 'Apply Now'
        : 'Enroll'
      : applicationStatus === 'approved'
        ? 'Approved'
        : applicationStatus === 'pending'
          ? 'Pending'
          : applicationStatus === 'revoked'
            ? 'Reapply to Train'
            : 'Apply to Train';

    return {
      id: item.id,
      title: item.title,
      provider: creatorMap.get(item.creatorUuid) ?? item.creatorName ?? 'Course Creator',
      duration: item.durationLabel,
      secondaryMeta:
        item.secondaryMeta ||
        item.levelLabel ||
        item.categoryLabels[0] ||
        (item.kind === 'program' ? 'Training Program' : 'Course'),
      ctaLabel,
      ctaDisabled: isInstructorApplyCard
        ? Boolean(applicationStatus && applicationStatus !== 'revoked')
        : false,
      ctaKind: isInstructorApplyCard
        ? item.kind === 'program'
          ? 'apply-program'
          : 'apply-course'
        : 'link',
      minimumRate: item.minimumRate,
      showInstructorCta: !isInstructorApplyCard,
      detailsHref: buildWorkspaceAliasPath(domain, item.href),
      enrollHref: isInstructorApplyCard
        ? getApplyToTrainHref(item.id)
        : buildWorkspaceAliasPath(domain, getEnrollHref(domain, item.kind, item.id)),
      instructorHref: buildWorkspaceAliasPath(domain, getInstructorHref(domain, item.id)),
      icon: presentation.icon,
      imageTone: presentation.imageTone,
      imageUrl: item.imageUrl,
    };
  });

const createRecommendationCards = (
  items: UnifiedContentItem[],
  domain: UserDomain,
  creatorMap: Map<string, string>,
  ratingsMap: Map<string, string>
): CoursesRecommendationCardData[] =>
  items.map((item, index) => {
    const presentation = getCardPresentation(index + 2);

    return {
      id: item.id,
      title: item.title,
      provider: creatorMap.get(item.creatorUuid) ?? item.creatorName ?? 'Course Creator',
      rating: ratingsMap.get(item.id) ?? 'New',
      weeks: item.durationLabel,
      secondaryMeta: item.categoryLabels[0] ?? item.secondaryMeta ?? 'Published Course',
      detailsHref: buildWorkspaceAliasPath(domain, item.href),
      enrollHref: buildWorkspaceAliasPath(domain, getEnrollHref(domain, item.kind, item.id)),
      icon: presentation.icon,
      imageTone: presentation.imageTone,
      imageUrl: item.imageUrl,
    };
  });

export function SharedCoursesPage({ domain }: SharedCoursesPageProps) {
  const qc = useQueryClient();
  const instructor = useInstructor();
  const [activeTab, setActiveTab] = useState<CoursesCatalogTab>('all-courses');
  const [filters, setFilters] = useState<FilterValues>(defaultFilterValues);
  const [visibleCoursesCount, setVisibleCoursesCount] = useState(8);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedApplicationCard, setSelectedApplicationCard] = useState<CoursesCatalogCardData | null>(null);

  useEffect(() => {
    const syncVisibleCountToViewport = () => {
      const batchSize = getCatalogBatchSize(window.innerWidth);
      setVisibleCoursesCount(current => {
        if (current <= batchSize) {
          return batchSize;
        }

        return Math.ceil(current / batchSize) * batchSize;
      });
    };

    syncVisibleCountToViewport();
    window.addEventListener('resize', syncVisibleCountToViewport);

    return () => {
      window.removeEventListener('resize', syncVisibleCountToViewport);
    };
  }, []);

  const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
    ...getPublishedCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: 18,
        },
      },
    }),
    refetchOnWindowFocus: false,
  });

  const { data: programsResponse, isLoading: programsLoading } = useQuery({
    ...getAllTrainingProgramsOptions({
      query: {
        pageable: {
          page: 0,
          size: 12,
        },
      },
    }),
    refetchOnWindowFocus: false,
  });

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    ...getAllCategoriesOptions({
      query: {
        pageable: {
          page: 0,
          size: 24,
        },
      },
    }),
    refetchOnWindowFocus: false,
  });

  const { data: difficultiesResponse, isLoading: difficultiesLoading } = useQuery({
    ...getAllDifficultyLevelsOptions(),
    refetchOnWindowFocus: false,
  });

  const courses = useMemo(() => coursesResponse?.data?.content ?? [], [coursesResponse]);
  const programs = useMemo(() => programsResponse?.data?.content ?? [], [programsResponse]);
  const categories = useMemo(() => categoriesResponse?.data?.content ?? [], [categoriesResponse]);

  const { data: instructorCourseApplications } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: domain === 'instructor' && Boolean(instructor?.uuid),
    refetchOnWindowFocus: false,
  });

  const { data: instructorProgramApplications } = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: domain === 'instructor' && Boolean(instructor?.uuid),
    refetchOnWindowFocus: false,
  });

  const categoryMap = useMemo(
    () => new Map(categories.map(category => [category.uuid ?? '', category.name])),
    [categories]
  );

  const difficultyMap = useMemo(
    () =>
      new Map((difficultiesResponse?.data ?? []).map(level => [level.uuid ?? '', level.name])),
    [difficultiesResponse]
  );

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

        return {
          id: program.uuid ?? '',
          kind: 'program',
          title: program.title,
          description: stripHtml(program.description),
          createdAt: program.created_date ? new Date(program.created_date).getTime() : 0,
          durationMinutes: program.total_duration_hours * 60 + program.total_duration_minutes,
          durationLabel,
          categoryLabels: categoryLabel ? [categoryLabel] : [],
          creatorUuid: program.course_creator_uuid,
          creatorName: '',
          price: program.price,
          minimumRate: program.price,
          imageUrl: undefined,
          href: getContentHref(domain, 'program', program.uuid ?? ''),
          secondaryMeta:
            categoryLabel ??
            program.program_type ??
            (program.price && program.price > 0 ? 'Paid Program' : 'Free Program'),
          bundledCourseCount: 0,
        };
      }),
    [categoryMap, domain, programs]
  );

  const mappedCourses = useMemo<UnifiedContentItem[]>(
    () =>
      courses.map(course => ({
        id: course.uuid ?? '',
        kind: 'course',
        title: course.name,
        description: stripHtml(course.description),
        createdAt: course.created_date ? new Date(course.created_date).getTime() : 0,
        durationMinutes: course.duration_hours * 60 + course.duration_minutes,
        durationLabel: formatDurationFromParts(
          course.duration_hours,
          course.duration_minutes,
          course.total_duration_display
        ),
        categoryLabels: course.category_names ?? [],
        creatorUuid: course.course_creator_uuid,
        creatorName: '',
        levelLabel: difficultyMap.get(course.difficulty_uuid ?? ''),
        price: course.price,
        minimumRate: course.minimum_training_fee ?? course.price,
        imageUrl: course.banner_url ?? course.thumbnail_url,
        href: getContentHref(domain, 'course', course.uuid ?? ''),
        secondaryMeta:
          difficultyMap.get(course.difficulty_uuid ?? '') ??
          course.category_names?.[0] ??
          (course.price && course.price > 0 ? 'Paid Course' : 'Free Course'),
      })),
    [courses, difficultyMap, domain]
  );

  const categoryTileData = useMemo(
    () => categories.slice(0, 4).map((category, index) => getCategoryTilePresentation(category.name, index)),
    [categories]
  );

  const compactCategoryTiles = useMemo(
    () =>
      categories.slice(4, 7).map((category, index) => getCategoryTilePresentation(category.name, index + 4)),
    [categories]
  );

  const filterSections = useMemo<CoursesFilterSection[]>(
    () => [
      {
        key: 'category',
        title: 'Categories',
        options: [
          { label: 'All Categories', value: 'all' },
          ...categories.map(category => ({
            label: category.name,
            value: category.uuid ?? category.name,
          })),
        ],
      },
      {
        key: 'contentType',
        title: 'Program Type',
        options: [
          { label: 'All Courses', value: 'all-courses' },
          { label: 'Program', value: 'programs' },
          { label: 'Short Course', value: 'short-courses' },
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
    [categories, difficultiesResponse]
  );

  const allCoursesFeed = useMemo(
    () => [...mappedPrograms, ...mappedCourses].sort((left, right) => right.createdAt - left.createdAt),
    [mappedCourses, mappedPrograms]
  );

  const baseTabItems = useMemo(() => {
    if (activeTab === 'programs') {
      return mappedPrograms;
    }

    if (activeTab === 'short-courses') {
      return mappedCourses;
    }

    return allCoursesFeed;
  }, [activeTab, allCoursesFeed, mappedCourses, mappedPrograms]);

  const programCourseQueries = useQueries({
    queries: mappedPrograms.map(program => ({
      ...getProgramCoursesOptions({ path: { programUuid: program.id } }),
      enabled: Boolean(program.id),
      refetchOnWindowFocus: false,
    })),
  });

  const bundledCoursesCountMap = useMemo(() => {
    const map = new Map<string, number>();

    programCourseQueries.forEach((query, index) => {
      const program = mappedPrograms[index];
      if (!program?.id) return;
      map.set(program.id, query.data?.data?.length ?? 0);
    });

    return map;
  }, [mappedPrograms, programCourseQueries]);

  const filteredItems = useMemo(
    () =>
      baseTabItems.filter(item => {
        const resolvedCategoryLabel = categoryMap.get(filters.category) ?? filters.category;
        const resolvedDifficultyLabel = difficultyMap.get(filters.level) ?? filters.level;

        const matchesCategory =
          filters.category === 'all' ||
          item.categoryLabels.some(
            label =>
              label === resolvedCategoryLabel ||
              label.toLowerCase() === filters.category.toLowerCase()
          );

        const matchesLevel =
          filters.level === 'all' || item.levelLabel?.toLowerCase() === resolvedDifficultyLabel.toLowerCase();

        const matchesDuration =
          filters.duration === 'all' || getDurationBucket(item.durationMinutes) === filters.duration;

        const matchesPrice =
          filters.price === 'all' ||
          (filters.price === 'free' ? !item.price || item.price <= 0 : (item.price ?? 0) > 0);

        const matchesContentType =
          filters.contentType === 'all-courses' ||
          (filters.contentType === 'programs' && item.kind === 'program') ||
          (filters.contentType === 'short-courses' && item.kind === 'course');

        return (
          matchesCategory &&
          matchesLevel &&
          matchesDuration &&
          matchesPrice &&
          matchesContentType
        );
      }),
    [baseTabItems, categoryMap, difficultyMap, filters]
  );

  const recommendedBase = useMemo(() => allCoursesFeed.slice(0, 6), [allCoursesFeed]);

  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set([...filteredItems, ...recommendedBase].map(item => item.creatorUuid).filter(Boolean))
      ),
    [filteredItems, recommendedBase]
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
      const name = query.data?.data?.full_name;

      if (uuid && name) {
        map.set(uuid, name);
      }
    });

    return map;
  }, [creatorIds, creatorQueries]);

  const instructorCourseApplicationMap = useMemo(() => {
    const map = new Map<string, { status?: string | null }>();
    instructorCourseApplications?.data?.content?.forEach(application => {
      if (application.course_uuid) {
        map.set(application.course_uuid, { status: application.status });
      }
    });
    return map;
  }, [instructorCourseApplications]);

  const instructorProgramApplicationMap = useMemo(() => {
    const map = new Map<string, { status?: string | null }>();
    instructorProgramApplications?.data?.content?.forEach(application => {
      if (application.program_uuid) {
        map.set(application.program_uuid, { status: application.status });
      }
    });
    return map;
  }, [instructorProgramApplications]);

  const applyToTrainCourseMut = useMutation(submitTrainingApplicationMutation());
  const applyToTrainProgramMut = useMutation(submitProgramTrainingApplicationMutation());

  const recommendationReviewQueries = useQueries({
    queries: recommendedBase.map(item => ({
      ...getCourseReviewsOptions({ path: { courseUuid: item.id } }),
      enabled: Boolean(item.id) && item.kind === 'course',
      refetchOnWindowFocus: false,
    })),
  });

  const ratingsMap = useMemo(() => {
    const map = new Map<string, string>();

    recommendationReviewQueries.forEach((query, index) => {
      const item = recommendedBase[index];
      const ratings =
        query.data?.data
          ?.map(review => review.rating)
          .filter((rating): rating is number => typeof rating === 'number') ?? [];

      if (!item) {
        return;
      }

      if (ratings.length === 0) {
        map.set(item.id, 'New');
        return;
      }

      const average = ratings.reduce((total, value) => total + value, 0) / ratings.length;
      map.set(item.id, average.toFixed(1));
    });

    return map;
  }, [recommendationReviewQueries, recommendedBase]);

  const catalogCards = useMemo(
    () =>
      createCatalogCards(
        filteredItems.slice(0, visibleCoursesCount).map(item =>
          item.kind === 'program'
            ? {
              ...item,
              secondaryMeta: `${bundledCoursesCountMap.get(item.id) ?? 0} Courses`,
            }
            : item
        ),
        domain,
        creatorMap,
        instructorCourseApplicationMap,
        instructorProgramApplicationMap
      ),
    [
      bundledCoursesCountMap,
      creatorMap,
      domain,
      filteredItems,
      instructorCourseApplicationMap,
      instructorProgramApplicationMap,
      visibleCoursesCount,
    ]
  );

  const recommendationCards = useMemo(
    () => createRecommendationCards(recommendedBase, domain, creatorMap, ratingsMap),
    [creatorMap, domain, ratingsMap, recommendedBase]
  );

  const hasMoreCatalogItems = filteredItems.length > visibleCoursesCount;

  const isLoading =
    coursesLoading || programsLoading || categoriesLoading || difficultiesLoading;

  const setFilterValue = (key: CoursesFilterSection['key'], value: string) => {
    setFilters(current => ({
      ...current,
      [key]: value,
    }));
    setVisibleCoursesCount(getCatalogBatchSize(window.innerWidth));

    if (
      key === 'contentType' &&
      (value === 'programs' || value === 'short-courses' || value === 'all-courses')
    ) {
      setActiveTab(value);
    }
  };

  const clearFilters = () => {
    setFilters({
      ...defaultFilterValues,
      contentType: activeTab,
    });
    setVisibleCoursesCount(getCatalogBatchSize(window.innerWidth));
  };

  const handleTabChange = (tab: CoursesCatalogTab) => {
    setActiveTab(tab);
    setFilters(current => ({
      ...current,
      contentType: tab,
    }));
    setVisibleCoursesCount(getCatalogBatchSize(window.innerWidth));
  };

  const handleCategoryTileClick = (category: Category) => {
    setFilters(current => ({
      ...current,
      category: category.uuid ?? category.name,
    }));
    setVisibleCoursesCount(getCatalogBatchSize(window.innerWidth));
  };

  const handleCatalogCardAction = (card: CoursesCatalogCardData) => {
    if (card.ctaKind !== 'apply-course' && card.ctaKind !== 'apply-program') {
      return;
    }

    setSelectedApplicationCard(card);
    setApplyModalOpen(true);
  };

  const handleApplyToTrain = (data: {
    notes: string;
    private_online_rate: number;
    private_inperson_rate: number;
    group_online_rate: number;
    group_inperson_rate: number;
    rate_currency: string;
  }) => {
    if (!selectedApplicationCard || !instructor?.uuid) return;

    const body = {
      applicant_type: ApplicantTypeEnum.INSTRUCTOR,
      applicant_uuid: instructor.uuid,
      rate_card: {
        currency: data.rate_currency,
        private_online_rate: data.private_online_rate,
        private_inperson_rate: data.private_inperson_rate,
        group_online_rate: data.group_online_rate,
        group_inperson_rate: data.group_inperson_rate,
      },
      application_notes: data.notes,
    };

    if (selectedApplicationCard.ctaKind === 'apply-program') {
      applyToTrainProgramMut.mutate(
        {
          body,
          path: { programUuid: selectedApplicationCard.id },
        },
        {
          onSuccess: response => {
            qc.invalidateQueries({
              queryKey: searchProgramTrainingApplicationsQueryKey({
                query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor.uuid } },
              }),
            });
            toast.success(response?.message);
            setApplyModalOpen(false);
            setSelectedApplicationCard(null);
          },
          onError: error => {
            toast.error(error?.message ?? 'Unable to submit program application');
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
        onSuccess: response => {
          qc.invalidateQueries({
            queryKey: searchTrainingApplicationsQueryKey({
              query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor.uuid } },
            }),
          });
          toast.success(response?.message);
          setApplyModalOpen(false);
          setSelectedApplicationCard(null);
        },
        onError: error => {
          toast.error(error?.message ?? 'Unable to submit course application');
        },
      }
    );
  };

  return (
    <div className='mx-auto w-full max-w-[1680px] bg-background px-3 py-4 sm:px-4 lg:px-6 2xl:px-8'>
      <div className='space-y-7'>
        <CoursesHero actions={heroActions} domain={domain} />

        <section className='space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='text-foreground text-[clamp(1.1rem,1.5vw,1.35rem)] font-semibold tracking-[-0.02em]'>
              Browse by Category
            </h2>
            <div className='flex items-center gap-2'>
              <div className='min-[1460px]:hidden'>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant='outline' className='rounded-md text-sm shadow-none'>
                      <Filter className='size-4' />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side='left'
                    className='w-[86vw] max-w-sm overflow-y-auto rounded-r-md p-0'
                  >
                    <SheetHeader className='border-b border-border'>
                      <SheetTitle>Filter Courses</SheetTitle>
                      <SheetDescription>
                        Refine the catalogue by category, type, level, duration, or price.
                      </SheetDescription>
                    </SheetHeader>
                    <div className='p-4 pb-8'>
                      <CoursesCategoryFilters
                        sections={filterSections}
                        selectedValues={filters}
                        onSelect={setFilterValue}
                        onClear={clearFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <Link
                href={buildWorkspaceAliasPath(domain, '/dashboard/courses')}
                className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm'
              >
                View All
                <ArrowRight className='size-3.5' />
              </Link>
            </div>
          </div>

          <div className='grid gap-4 min-[1460px]:grid-cols-[260px_minmax(0,1fr)]'>
            <CoursesCategoryFilters
              sections={filterSections}
              selectedValues={filters}
              onSelect={setFilterValue}
              onClear={clearFilters}
              className='hidden min-[1460px]:block'
            />

            <div className='space-y-4'>
              {isLoading ? (
                <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className='h-16 rounded-2xl' />
                  ))}
                </div>
              ) : (
                <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                  {categoryTileData.map((tile, index) => (
                    <CoursesCategoryTile
                      key={tile.title}
                      tile={tile}
                      isActive={
                        filters.category ===
                        (categories[index]?.uuid ?? categories[index]?.name ?? '')
                      }
                      onClick={() => {
                        const category = categories[index];
                        if (category) {
                          handleCategoryTileClick(category);
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              <div className='border-border bg-card rounded-[16px] border'>
                <div className='border-border flex flex-col gap-3 border-b px-4 py-3.5 min-[1180px]:flex-row min-[1180px]:items-center min-[1180px]:justify-between'>
                  <div className='flex flex-wrap gap-1.5'>
                    {catalogTabs.map(tab => (
                      <button
                        key={tab.value}
                        type='button'
                        onClick={() => handleTabChange(tab.value)}
                        className={
                          activeTab === tab.value
                            ? 'bg-primary/10 text-primary rounded-xl px-3 py-1.5 text-sm font-semibold'
                            : 'text-muted-foreground hover:text-foreground rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors'
                        }
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className='flex items-center gap-3'>
                    <p className='text-muted-foreground text-xs font-medium sm:text-sm'>
                      {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}
                    </p>
                    <Button
                      type='button'
                      variant='ghost'
                      className='text-muted-foreground hover:text-foreground hidden h-8 rounded-xl text-sm font-semibold shadow-none min-[1460px]:inline-flex'
                    >
                      <Filter className='size-4' />
                      Filters
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className='grid gap-4 p-4 sm:grid-cols-2 min-[1400px]:grid-cols-3'>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className='h-[268px] rounded-2xl' />
                    ))}
                  </div>
                ) : catalogCards.length > 0 ? (
                  <div className='p-4'>
                    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                      {catalogCards.map(card => (
                        <CoursesCatalogCard
                          key={card.id}
                          card={card}
                          onPrimaryAction={handleCatalogCardAction}
                        />
                      ))}
                    </div>
                    {hasMoreCatalogItems ? (
                      <div className='mt-5 flex justify-center'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() =>
                            setVisibleCoursesCount(
                              current => current + getCatalogBatchSize(window.innerWidth)
                            )
                          }
                          className='rounded-xl px-5 shadow-none'
                        >
                          See More
                        </Button>
                      </div>
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

        <section className='space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='text-foreground text-[clamp(1.1rem,1.5vw,1.35rem)] font-semibold tracking-[-0.02em]'>
              Recommended for You
            </h2>
            <Link
              href={buildWorkspaceAliasPath(domain, '/dashboard/courses')}
              className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm'
            >
              View All
              <ArrowRight className='size-3.5' />
            </Link>
          </div>

          {isLoading ? (
            <div className='grid gap-4 md:grid-cols-2 min-[1420px]:grid-cols-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-[268px] rounded-2xl' />
              ))}
            </div>
          ) : recommendationCards.length > 0 ? (
            <div className='scrollbar-hidden flex gap-4 overflow-x-auto pb-2'>
              {recommendationCards.map(card => (
                <CoursesRecommendationCard key={card.id} card={card} />
              ))}
            </div>
          ) : null}
        </section>

        <section className='border-border bg-primary text-primary-foreground flex flex-col gap-4 rounded-[12px] border px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-start gap-3'>
            <span className='mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-background/15'>
              <SquareDashedMousePointer className='size-4' />
            </span>
            <div>
              <h2 className='text-[clamp(1rem,1.3vw,1.2rem)] font-semibold tracking-[-0.02em]'>
                Want a structured career path?
              </h2>
              <p className='mt-1 text-sm text-primary-foreground/85 sm:text-[0.95rem]'>
                Apply for a certified training program with funding opportunities.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant='warning'
            className='h-10 rounded-xl px-5 text-sm font-semibold shadow-none'
          >
            <Link href={buildWorkspaceAliasPath(domain, '/dashboard/skills-fund')}>Apply Now</Link>
          </Button>
        </section>
      </div>
      {selectedApplicationCard ? (
        <NotesModal
          open={applyModalOpen}
          setOpen={open => {
            setApplyModalOpen(open);
            if (!open) {
              setSelectedApplicationCard(null);
            }
          }}
          title={
            selectedApplicationCard.ctaKind === 'apply-program'
              ? 'Apply to Train a Program'
              : 'Apply to Train a Course'
          }
          description={
            <div className='space-y-2'>
              <p>
                You are applying to train the{' '}
                {selectedApplicationCard.ctaKind === 'apply-program' ? 'program' : 'course'} titled{' '}
                <span className='font-semibold'>&ldquo;{selectedApplicationCard.title}&rdquo;</span>.
              </p>
              <p>
                Provider: <span className='font-medium'>{selectedApplicationCard.provider}</span>
                {selectedApplicationCard.duration
                  ? ` · Duration: ${selectedApplicationCard.duration}`
                  : ''}
                {selectedApplicationCard.secondaryMeta
                  ? ` · Focus: ${selectedApplicationCard.secondaryMeta}`
                  : ''}
              </p>
              <p>
                Submit your application notes and set the amount you want to charge students per
                hour per head, while respecting the creator-set minimum shown below.
              </p>
            </div>
          }
          onSave={handleApplyToTrain}
          saveText='Submit application'
          cancelText='Cancel'
          placeholder='Enter your application notes here...'
          isLoading={applyToTrainCourseMut.isPending || applyToTrainProgramMut.isPending}
          minimum_rate={selectedApplicationCard.minimumRate ?? 0}
        />
      ) : null}
    </div>
  );
}
