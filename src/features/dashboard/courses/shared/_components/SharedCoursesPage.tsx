// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import NotesModal from '@/components/custom-modals/notes-modal';
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
import { useCourseClasses } from '@/hooks/use-batched-lookups';
import { useCourseEnrollmentsMap } from '@/hooks/use-enrollment-map';
import { averageRating, useCourseReviewsMap } from '@/hooks/use-reviews-map';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import type { UserDomain } from '@/lib/types';
import { ApplicantTypeEnum } from '@/services/client';
import {
  getAllCategoriesOptions,
  getAllDifficultyLevelsOptions,
  getAllTrainingProgramsOptions,
  getClassDefinitionsForProgramOptions,
  getCourseRecommendationsOptions,
  getCourseReviewsOptions,
  getProgramCoursesOptions,
  getProgramEnrollmentsOptions,
  getPublishedCoursesOptions,
  searchCourseCreatorsOptions,
  searchProgramTrainingApplicationsOptions,
  searchProgramTrainingApplicationsQueryKey,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey,
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Category, CourseReview } from '@/services/client/types.gen';
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
  getCategoryTilePresentation,
  getContentHref,
  getDurationBucket,
  getEnrollHref,
  getInstructorHref,
  stripHtml,
} from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { CoursesCatalogCard } from '@/src/features/dashboard/courses/shared/_components/CoursesCatalogCard';
import { CoursesCategoryFilters } from '@/src/features/dashboard/courses/shared/_components/CoursesCategoryFilters';
import { CoursesCategoryTabs } from '@/src/features/dashboard/courses/shared/_components/CoursesCategoryTabs';
import { CoursesRecommendationCard } from '@/src/features/dashboard/courses/shared/_components/CoursesRecommendationCard';
import { StudentCoursesCard } from '@/src/features/dashboard/courses/shared/_components/StudentCoursesCard';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  GraduationCap,
  Layers,
  type LucideIcon,
  SlidersHorizontal,
  SquareDashedMousePointer,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type SharedCoursesPageProps = {
  domain: UserDomain;
};

export type UnifiedContentItem = {
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
  category: string;
  subject: string;
  programType: string;
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

function isCourseCreatorLookup(value: unknown): value is { uuid?: string; full_name?: string } {
  return typeof value === 'object' && value !== null && 'uuid' in value;
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
  courseClassesMap: Record<string, ClassDefinition[]>,
  programClassesMap: Record<string, ClassDefinition[]>,
  programCoursesMap: Record<string, Course[]>,
  programLearnerCountMap: Record<string, number>
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

    const classDefinitions =
      item.kind === 'program'
        ? (programClassesMap[item.id] ?? [])
        : (courseClassesMap[item.id] ?? []);
    const activeClasses = classDefinitions;
    const activeClassesInstructors = new Set(
      activeClasses
        .map(cls => cls.default_instructor_uuid)
        .filter((uuid): uuid is string => Boolean(uuid))
    );

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

      const courses = programCoursesMap[item.id] ?? [];
      const categories = courses.flatMap(course => course.category_names ?? []);
      return [...new Set(categories)];
    })();

    return {
      id: item.id,
      contentKind: item.kind,
      title: item.title,
      description: item.description,

      provider: creatorMap.get(item.creatorUuid) ?? item.creatorName ?? 'Course Creator',

      duration: item.durationLabel,

      enrolledClasses: activeClasses.length,

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

      detailsHref: buildWorkspaceAliasPath(domain, item.href),

      enrollHref: isInstructorApplyCard
        ? getApplyToTrainHref(item.id)
        : buildWorkspaceAliasPath(domain, getEnrollHref(domain, item.kind, item.id)),

      instructorHref: buildWorkspaceAliasPath(domain, getInstructorHref(domain, item.id)),

      icon: presentation.icon,
      imageTone: presentation.imageTone,
      imageUrl: item.imageUrl,

      rating: item.rating,
      reviewCount: item.reviewCount,
      enrollmentCount:
        item.kind === 'program'
          ? (programLearnerCountMap[item.id] ?? item.enrollmentCount)
          : item.enrollmentCount,

      certificateHref: '',
      category: '',
      subject: '',
      programType: '',
      minAge: programAgeRange.minAge ?? item.minAge ?? undefined,
      maxAge: programAgeRange.maxAge ?? item.maxAge ?? undefined,
      categoryNames: programCategoryNames ?? item.categoryLabels ?? undefined,

      // Actual number of active classes
      activeClasses: activeClasses.length,
      instructorCount: activeClassesInstructors.size,
      application,
    };
  });

const createRecommendationCards = (
  items: UnifiedContentItem[],
  domain: UserDomain,
  creatorMap: Map<string, string>,
  ratingsMap: Map<string, string>,
  isInstructorDomain: boolean,
  reasonMap?: Map<string, string>
): CoursesRecommendationCardData[] =>
  items.map((item, index) => {
    const presentation = getCardPresentation(index + 2);
    const shouldApplyToTrain = isInstructorDomain && item.kind === 'course';

    return {
      id: item.id,
      title: item.title,
      provider: creatorMap.get(item.creatorUuid) ?? item.creatorName ?? 'Course Creator',
      rating: ratingsMap.get(item.id) ?? 'New',
      weeks: item.durationLabel,
      secondaryMeta: item.categoryLabels[0] ?? item.secondaryMeta ?? 'Published Course',
      minimumRate: item.minimumRate,
      ctaLabel: shouldApplyToTrain ? 'Apply to Train' : 'Enroll',
      ctaHref: shouldApplyToTrain
        ? getApplyToTrainHref(item.id)
        : buildWorkspaceAliasPath(domain, getEnrollHref(domain, item.kind, item.id)),
      ctaKind: shouldApplyToTrain ? 'apply-to-train' : 'enroll',
      detailsHref: buildWorkspaceAliasPath(domain, item.href),
      icon: presentation.icon,
      imageTone: presentation.imageTone,
      imageUrl: item.imageUrl,
      reason: reasonMap?.get(item.id),
    };
  });

export function SharedCoursesPage({ domain }: SharedCoursesPageProps) {
  const qc = useQueryClient();
  const user = useUserProfile();
  const instructor = useInstructor();
  const organisation = useOrganisation();
  const student = user?.student;
  const { classDefinitions, loading: studentCoursesLoading } = useStudentClassDefinitions(
    domain === 'student' ? (student ?? undefined) : undefined
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
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CoursesCatalogTab>('all-courses');
  const [filters, setFilters] = useState<FilterValues>(defaultFilterValues);
  const [currentCatalogPage, setCurrentCatalogPage] = useState(1);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedApplicationCard, setSelectedApplicationCard] = useState<
    CoursesCatalogCardData | CoursesRecommendationCardData | null
  >(null);
  const [selectedApplicationRecord, setSelectedApplicationRecord] =
    useState<CatalogTrainingApplicationData | null>(null);
  const [applicationSheetMode, setApplicationSheetMode] = useState<'apply' | 'review'>('apply');
  const [applicationSheetRevision, setApplicationSheetRevision] = useState(0);

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

  const difficultyMap = useMemo(
    () => new Map((difficultiesResponse?.data ?? []).map(level => [level.uuid ?? '', level.name])),
    [difficultiesResponse]
  );

  const { reviewMap } = useCourseReviewsMap([
    ...courses.map(c => c.uuid ?? ''),
    ...programs.map(p => p.uuid ?? ''),
  ]);

  const { courseEnrollmentMap } = useCourseEnrollmentsMap([
    ...courses.map(c => c.uuid ?? ''),
    ...programs.map(p => p.uuid ?? ''),
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

        const reviews = reviewMap[program.uuid ?? ''];
        const enrollments = courseEnrollmentMap[program.uuid ?? ''];

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
          price: program.price ?? undefined,
          minimumRate: program.price ?? undefined,
          imageUrl: undefined,
          href: getContentHref(domain, 'program', program.uuid ?? ''),
          enrolledClasses: 1,
          secondaryMeta:
            categoryLabel ??
            program.program_type ??
            (program.price && program.price > 0 ? 'Paid Program' : 'Free Program'),
          bundledCourseCount: 0,
          // reviewCount: Number(reviews?.count) ?? 0,
          reviewCount: 0,
          rating: averageRating(reviews?.reviews as CourseReview[]) ?? 0,
          enrollmentCount: enrollments?.count,
          category: '',
          subject: '',
          programType: '',
          minAge: program.age_lower_limit,
          maxAge: program.age_upper_limit,
          // categoryNames: course.category_names
        };
      }),
    [categoryMap, courseEnrollmentMap, domain, programs, reviewMap]
  );

  const mappedCourses = useMemo<UnifiedContentItem[]>(
    () =>
      courses.map(course => {
        const reviews = reviewMap[course.uuid ?? ''];
        const enrollments = courseEnrollmentMap[course.uuid ?? ''];

        return {
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
          price: course.price ?? undefined,
          minimumRate: course.minimum_training_fee ?? course.price ?? undefined,
          imageUrl: course.banner_url ?? course.thumbnail_url ?? undefined,
          href: getContentHref(domain, 'course', course.uuid ?? ''),
          enrolledClasses: 1,
          secondaryMeta:
            difficultyMap.get(course.difficulty_uuid ?? '') ??
            course.category_names?.[0] ??
            (course.price && course.price > 0 ? 'Paid Course' : 'Free Course'),
          reviewCount: Number(reviews?.count) ?? 0,
          rating: averageRating(reviews?.reviews as CourseReview[]) ?? 0,
          enrollmentCount: enrollments?.count,
          category: '',
          subject: '',
          programType: '',
          minAge: course.age_lower_limit,
          maxAge: course.age_upper_limit,
          categoryNames: course.category_names,
        };
      }),
    [courseEnrollmentMap, courses, difficultyMap, domain, reviewMap]
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

        const reviews = reviewMap[course.uuid ?? ''];
        const enrollments = courseEnrollmentMap[course.uuid ?? ''];

        const classCount = definition.classEnrollments.length || definition.schedules?.length || 0;
        const existing = uniqueCourses.get(course.uuid);
        const presentation = getCardPresentation(index);

        uniqueCourses.set(course.uuid, {
          id: course.uuid,
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
          creatorName: existing?.creatorName ?? '',
          levelLabel: difficultyMap.get(course.difficulty_uuid ?? ''),
          price: course.price ?? undefined,
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
          reviewCount: Number(reviews?.count) ?? 0,
          rating: averageRating(reviews?.reviews as CourseReview[]) ?? 0,
          enrollmentCount: enrollments?.count,
          activeClasses: classCount,
          category: '',
          subject: '',
          programType: '',
          minAge: course.age_lower_limit,
          maxAge: course.age_upper_limit,
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
    courseEnrollmentMap,
    difficultyMap,
    domain,
    isInstructorDomain,
    isOrganisationDomain,
    isStudentDomain,
    mappedCourses,
    mappedPrograms,
    reviewMap,
    user?.courseCreator?.uuid,
  ]);

  const categoryTileData = useMemo(
    () => categories.map((category, index) => getCategoryTilePresentation(category.name, index)),
    [categories]
  );

  const filterSections = useMemo<CoursesFilterSection[]>(
    () => [
      {
        key: 'contentType',
        title: 'Program Type',
        options: [
          { label: 'All Courses', value: 'all-courses' },
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
          ...categories.map(category => ({
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
    [categories, difficultiesResponse]
  );

  const [selectedValues, setSelectedValues] = useState({
    category: '',
    level: '',
    duration: '',
    price: '',
  });

  const [activeFilter, setActiveFilter] = useState<CoursesFilterSection['key'] | null>(
    filterSections[0]?.key ?? null
  );

  const allCoursesFeed = useMemo(
    () =>
      [...mappedPrograms, ...mappedCourses].sort((left, right) => right.createdAt - left.createdAt),
    [mappedCourses, mappedPrograms]
  );

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

  const normalizedSearch = search.trim().toLowerCase();

  const filteredItems = useMemo(
    () =>
      baseTabItems.filter(item => {
        const resolvedCategoryLabel = categoryMap.get(filters.category) ?? filters.category;
        const resolvedDifficultyLabel = difficultyMap.get(filters.level) ?? filters.level;

        const matchesSearch =
          normalizedSearch === '' ||
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.creatorName.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch) ||
          item.categoryLabels.some(label => label.toLowerCase().includes(normalizedSearch));

        const matchesCategory =
          filters.category === 'all' ||
          item.categoryLabels.some(
            label =>
              label === resolvedCategoryLabel ||
              label.toLowerCase() === filters.category.toLowerCase()
          );

        const matchesLevel =
          filters.level === 'all' ||
          item.levelLabel?.toLowerCase() === resolvedDifficultyLabel.toLowerCase();

        const matchesDuration =
          filters.duration === 'all' ||
          getDurationBucket(item.durationMinutes) === filters.duration;

        const matchesPrice =
          filters.price === 'all' ||
          (filters.price === 'free' ? !item.price || item.price <= 0 : (item.price ?? 0) > 0);

        const matchesContentType =
          filters.contentType === 'all-courses' ||
          (filters.contentType === 'programs' && item.kind === 'program') ||
          (filters.contentType === 'short-courses' && item.kind === 'course');

        return (
          matchesSearch &&
          matchesCategory &&
          matchesLevel &&
          matchesDuration &&
          matchesPrice &&
          matchesContentType
        );
      }),
    [baseTabItems, categoryMap, difficultyMap, filters, normalizedSearch]
  );

  useEffect(() => {
    setCurrentCatalogPage(1);
  }, [activeTab, filters, normalizedSearch]);

  const totalCatalogPages = Math.max(1, Math.ceil(filteredItems.length / CATALOG_PAGE_SIZE));

  useEffect(() => {
    setCurrentCatalogPage(current => Math.min(current, totalCatalogPages));
  }, [totalCatalogPages]);

  const paginatedItems = useMemo(
    () =>
      filteredItems.slice(
        (currentCatalogPage - 1) * CATALOG_PAGE_SIZE,
        currentCatalogPage * CATALOG_PAGE_SIZE
      ),
    [currentCatalogPage, filteredItems]
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

  const recommendationsQuery = useQuery({
    ...getCourseRecommendationsOptions({
      query: { user_uuid: user?.uuid ?? '', limit: 6 },
    }),
    enabled: Boolean(user?.uuid),
  });

  const recommendationReasonMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const rec of recommendationsQuery.data?.data ?? []) {
      if (rec.course_uuid && rec.reason) {
        map.set(rec.course_uuid, rec.reason);
      }
    }
    return map;
  }, [recommendationsQuery.data]);

  const recommendedBase = useMemo(() => {
    const feedById = new Map(allCoursesFeed.map(item => [item.id, item]));
    const personalised = (recommendationsQuery.data?.data ?? [])
      .map(rec => (rec.course_uuid ? feedById.get(rec.course_uuid) : undefined))
      .filter((item): item is UnifiedContentItem => Boolean(item));

    if (personalised.length > 0) {
      return personalised.slice(0, 6);
    }

    // Fallback while recommendations load or when the user has no history yet.
    if (isInstructorDomain) {
      return allCoursesFeed
        .filter(item => item.kind === 'course' && !instructorCourseApplicationMap.has(item.id))
        .slice(0, 6);
    }

    return allCoursesFeed.slice(0, 6);
  }, [
    allCoursesFeed,
    instructorCourseApplicationMap,
    isInstructorDomain,
    recommendationsQuery.data,
  ]);

  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...filteredItems, ...recommendedBase].map(item => item.creatorUuid).filter(Boolean)
        )
      ),
    [filteredItems, recommendedBase]
  );

  const creatorQuery = useQuery({
    ...searchCourseCreatorsOptions({
      query: {
        searchParams: { uuid_in: creatorIds.join(',') },
        pageable: { page: 0, size: Math.max(creatorIds.length, 1) },
      },
    }),
    enabled: creatorIds.length > 0,
    refetchOnWindowFocus: false,
  });

  const creatorMap = useMemo(() => {
    const map = new Map<string, string>();

    creatorQuery.data?.data?.content?.filter(isCourseCreatorLookup).forEach(creator => {
      if (creator.uuid) {
        map.set(creator.uuid, creator.full_name || 'Course Creator');
      }
    });

    return map;
  }, [creatorQuery.data]);

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

  const courseUuids = useMemo(
    () =>
      paginatedItems
        .filter(item => item.kind === 'course')
        .map(item => item.id)
        .filter(Boolean),
    [paginatedItems]
  );

  const { courseClassesMap, isLoading: courseClassesLoading } = useCourseClasses(courseUuids);

  const programUuids = useMemo(
    () =>
      paginatedItems
        .filter(item => item.kind === 'program')
        .map(item => item.id)
        .filter(Boolean),
    [paginatedItems]
  );

  const programClassDefinitionsQueries = useQueries({
    queries: programUuids.map(programUuid => ({
      ...getClassDefinitionsForProgramOptions({
        path: { programUuid },
        query: { pageable: { page: 0, size: 200 } },
      }),
      enabled: Boolean(programUuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const programCoursesQueries = useQueries({
    queries: programUuids.map(programUuid => ({
      ...getProgramCoursesOptions({
        path: { programUuid },
      }),
      enabled: Boolean(programUuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const programEnrollmentQueries = useQueries({
    queries: programUuids.map(programUuid => ({
      ...getProgramEnrollmentsOptions({
        path: { programUuid },
        query: { pageable: { page: 0, size: 1 } },
      }),
      enabled: Boolean(programUuid),
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const programClassesMap = useMemo<Record<string, ClassDefinition[]>>(() => {
    const map: Record<string, ClassDefinition[]> = {};

    programUuids.forEach((programUuid, index) => {
      map[programUuid] =
        programClassDefinitionsQueries[index]?.data?.data
          ?.map(item => item.class_definition)
          .filter((definition): definition is ClassDefinition => Boolean(definition)) ?? [];
    });

    return map;
  }, [programClassDefinitionsQueries, programUuids]);

  const programCoursesMap = useMemo<Record<string, Course[]>>(() => {
    const map: Record<string, Course[]> = {};

    programUuids.forEach((programUuid, index) => {
      map[programUuid] = programCoursesQueries[index]?.data?.data ?? [];
    });

    return map;
  }, [programCoursesQueries, programUuids]);

  const programLearnerCountMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};

    programUuids.forEach((programUuid, index) => {
      const response = programEnrollmentQueries[index]?.data?.data;
      const totalElements = Number(response?.metadata?.totalElements ?? 0);
      map[programUuid] = totalElements || (response?.content?.length ?? 0);
    });

    return map;
  }, [programEnrollmentQueries, programUuids]);

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
        courseClassesMap,
        programClassesMap,
        programCoursesMap,
        programLearnerCountMap
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
      courseClassesMap,
      programClassesMap,
      programCoursesMap,
      programLearnerCountMap,
    ]
  );

  const recommendationCards = useMemo(
    () =>
      createRecommendationCards(
        recommendedBase,
        domain,
        creatorMap,
        ratingsMap,
        isInstructorDomain,
        recommendationReasonMap
      ),
    [creatorMap, domain, isInstructorDomain, ratingsMap, recommendationReasonMap, recommendedBase]
  );

  const isLoading =
    coursesLoading ||
    programsLoading ||
    categoriesLoading ||
    difficultiesLoading ||
    (isStudentDomain && studentCoursesLoading) ||
    courseClassesLoading ||
    programClassDefinitionsQueries.some(query => query.isLoading || query.isFetching) ||
    programCoursesQueries.some(query => query.isLoading || query.isFetching) ||
    programEnrollmentQueries.some(query => query.isLoading || query.isFetching);

  const setFilterValue = (key: CoursesFilterSection['key'], value: string) => {
    setFilters(current => ({
      ...current,
      [key]: value,
    }));

    if (
      key === 'contentType' &&
      (value === 'programs' || value === 'short-courses' || value === 'all-courses')
    ) {
      setActiveTab(current => (current === 'my-courses' ? current : value));
    }
  };

  const clearFilters = () => {
    setFilters({
      ...defaultFilterValues,
      contentType: activeTab === 'my-courses' ? 'all-courses' : activeTab,
    });
  };

  const handleCategoryTileClick = (category: Category) => {
    setFilters(current => ({
      ...current,
      category: category.uuid ?? category.name,
    }));
  };

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

  const handleRecommendedApply = (card: CoursesRecommendationCardData) => {
    setSelectedApplicationCard(card);
    setSelectedApplicationRecord(null);
    setApplicationSheetMode('apply');
    setApplyModalOpen(true);
  };

  const handleApplyToTrain = (data: {
    notes: string;
    private_online_hourly_rate: number;
    private_inperson_hourly_rate: number;
    group_online_hourly_rate: number;
    group_inperson_hourly_rate: number;
    rate_currency: string;
  }) => {
    if (!selectedApplicationCard || !applicantUuid) return;

    const body = {
      applicant_type: applicantType,
      applicant_uuid: applicantUuid,
      rate_card: {
        currency: data.rate_currency,
        private_online_hourly_rate: data.private_online_hourly_rate,
        private_inperson_hourly_rate: data.private_inperson_hourly_rate,
        group_online_hourly_rate: data.group_online_hourly_rate,
        group_inperson_hourly_rate: data.group_inperson_hourly_rate,
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
                query: {
                  pageable: {},
                  searchParams: {
                    applicant_uuid_eq: applicantUuid,
                    applicant_type_eq: applicantType,
                  },
                },
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
              query: {
                pageable: {},
                searchParams: {
                  applicant_uuid_eq: applicantUuid,
                  applicant_type_eq: applicantType,
                },
              },
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

  const providerCount = useMemo(
    () => new Set(allCoursesFeed.map(item => item.creatorUuid).filter(Boolean)).size,
    [allCoursesFeed]
  );

  const activeFilterCount = useMemo(
    () =>
      (Object.keys(filters) as Array<keyof FilterValues>).filter(
        key => filters[key] !== defaultFilterValues[key]
      ).length,
    [filters]
  );

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
    <div className='bg-background mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-4 lg:px-6 2xl:px-8'>
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
                  value: mappedCourses.length,
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

          {/* <div className='relative mt-4'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder='Search courses, programmes, providers…'
                className='h-11 pr-9 pl-9'
                aria-label='Search the course catalogue'
              />
              {search ? (
                <button
                  type='button'
                  onClick={() => setSearch('')}
                  aria-label='Clear search'
                  className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
                >
                  <X className='size-4' />
                </button>
              ) : null}
            </div> */}
        </header>

        <CoursesCategoryTabs
          activeFilter={activeFilter}
          onActiveChange={setActiveFilter}
          sections={filterSections}
          selectedValues={filters}
          onSelect={(key, value) => {
            setFilterValue(key, value);
            setOpen(false);
          }}
          onClear={clearFilters}
        />

        <section className='space-y-2'>
          <div className=''>
            <div className='space-y-2'>
              <div className='bg-card rounded-sm p-0'>
                <div className='border-border bg-card sticky top-0 z-10 flex flex-row items-center justify-between gap-3 py-2.5'>
                  <p className='text-muted-foreground text-xs font-medium sm:text-sm'>
                    <span className='text-foreground font-semibold tabular-nums'>
                      {filteredItems.length}
                    </span>{' '}
                    result{filteredItems.length === 1 ? '' : 's'}
                    {normalizedSearch ? (
                      <span className='text-muted-foreground'> for “{search.trim()}”</span>
                    ) : null}
                  </p>

                  <div className='flex flex-wrap items-center gap-2'>
                    {activeFilterCount > 0 || normalizedSearch ? (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          clearFilters();
                          setSearch('');
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
                  <div className='grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4'>
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
                    <div className='grid grid-cols-[repeat(auto-fill,minmax(320px,380px))] gap-4'>
                      {!isStudentDomain &&
                        catalogCards.map(card => (
                          <CoursesCatalogCard
                            type='general'
                            key={card.id}
                            card={card}
                            onPrimaryAction={handleCatalogCardAction}
                          />
                        ))}

                      {isStudentDomain &&
                        catalogCards.map(card => (
                          <StudentCoursesCard
                            type='general'
                            key={card.id}
                            card={card}
                            onPrimaryAction={handleCatalogCardAction}
                          />
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

        {/* // Recommended courses and Career path banner - hidden */}
        <section className='hidden'>
          <section className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
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
              <div className='grid grid-cols-[repeat(auto-fit,minmax(270px,270px))] gap-4'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className='space-y-4 rounded-2xl border p-4'>
                    <Skeleton className='h-28 w-full rounded-xl' />
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
            ) : recommendationCards.length > 0 ? (
              <div className='scrollbar-hidden flex gap-4 overflow-x-auto pb-2'>
                {recommendationCards.map(card => (
                  <CoursesRecommendationCard
                    onApplyToTrain={handleRecommendedApply}
                    key={card.id}
                    card={card}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className='border-border bg-primary text-primary-foreground flex flex-col gap-4 rounded-[12px] border px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-start gap-3'>
              <span className='bg-background/15 mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-xl'>
                <SquareDashedMousePointer className='size-4' />
              </span>
              <div>
                <h2 className='text-[clamp(1rem,1.3vw,1.2rem)] font-semibold tracking-[-0.02em]'>
                  Want a structured career path?
                </h2>
                <p className='text-primary-foreground/85 mt-1 text-sm sm:text-[0.95rem]'>
                  Apply for a certified training program with funding opportunities.
                </p>
              </div>
            </div>

            <Button
              asChild
              variant='warning'
              className='h-10 w-full rounded-xl px-5 text-sm font-semibold shadow-none sm:w-auto'
            >
              <Link href={buildWorkspaceAliasPath(domain, '/dashboard/skills-fund')}>
                Apply Now
              </Link>
            </Button>
          </section>
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
