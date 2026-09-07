'use client';

/**
 * The one hook the course record fans out from.
 *
 * ## Shape of the contract
 *
 * Every region of the page gets a {@link CourseRecordSection}: `data`, `loading`
 * (already `isLoading && !data`, so a background refetch keeps stale content on
 * screen), `error` and `refetch`. Feed one straight into an `<AsyncSection>` and
 * that region resolves itself — a slow trainers call never blocks the hero, and
 * a 403 on enrolments degrades one card instead of the page.
 *
 *     const record = useCourseRecord({ courseUuid });
 *     <KpiBand access={record.access} stats={record.stats.data} {...asyncProps(record.stats)} />
 *
 * Only `GET /courses/{uuid}` is blocking — `record.isLoading` tracks it alone,
 * because without the course there is no title, no hero and no page. Everything
 * else resolves independently and in parallel.
 *
 * ## Only hooks fetch
 *
 * Blocks take props and render. If you find yourself calling `useQuery` inside a
 * `blocks/*` component, the call belongs here instead.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForCourseOptions,
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getCourseCompletionRateOptions,
  getCourseContentOptions,
  getCourseEnrollmentsOptions,
  getCourseReviewsOptions,
  getCourseTrainingRequirementsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseEnrollment } from '@/services/client/types.gen';
import {
  type ClassDefinition,
  type Course,
  type CourseAccess,
  type CourseAccessCapability,
  type CourseAssessment,
  type CourseRecordContent,
  type CourseRecordSection,
  type CourseReview,
  type CourseStats,
  type CourseTrainerSummary,
  type CourseTrainingApplication,
  type CourseTrainingRequirement,
  courseCapability,
} from './types';
import { useCourseAccess } from './use-course-access';
import { useCourseStats, useCourseTrainers,
  CourseTrainersEnvelope,
} from './use-course-metrics';

/** How many rows of a paged collection the record ever needs on screen at once. */
const PAGE_SIZE = 100;

export const COURSE_RECORD_SECTIONS = [
  'course',
  'content',
  'stats',
  'trainers',
  'classes',
  'reviews',
  'assessments',
  'requirements',
  'completionRate',
  'enrollments',
  'applications',
] as const;

export type CourseRecordSectionId = (typeof COURSE_RECORD_SECTIONS)[number];

export interface CourseEnrollmentPage {
  items: CourseEnrollment[];
  /** Total across every page — the enrolment count, without fetching them all. */
  total: number | undefined;
}

export interface UseCourseRecordOptions {
  courseUuid: string | undefined;
  /** Set false to hold every query (e.g. while a route param is still resolving). */
  enabled?: boolean;
}

export interface CourseRecord {
  /** Blocking. Everything on the page hangs off the course itself. */
  course: CourseRecordSection<Course>;
  /** Carries the authoritative `access` string as well as the lessons. */
  content: CourseRecordSection<CourseRecordContent>;
  /** `GET /courses/{uuid}/stats` — dark until the endpoint ships. */
  stats: CourseRecordSection<CourseStats>;
  /** `GET /courses/{uuid}/trainers`. Carries `pending_count` for owner and admin. */
  trainers: CourseRecordSection<CourseTrainersEnvelope>;
  classes: CourseRecordSection<ClassDefinition[]>;
  reviews: CourseRecordSection<CourseReview[]>;
  assessments: CourseRecordSection<CourseAssessment[]>;
  requirements: CourseRecordSection<CourseTrainingRequirement[]>;
  /** Normalised to a 0–100 percentage whichever scale the API answers on. */
  completionRate: CourseRecordSection<number>;
  /** Creator, admin and approved trainers only. */
  enrollments: CourseRecordSection<CourseEnrollmentPage>;
  /** Training applications on this course. Creator and admin only. */
  applications: CourseRecordSection<CourseTrainingApplication[]>;

  /** From the API, never from the user's domain. */
  access: CourseAccess;
  /** The capability row for `access` — what this viewer's page is made of. */
  capability: CourseAccessCapability;
  /** True only while the blocking course query has never resolved. */
  isLoading: boolean;
  /** Every section that failed, keyed by section id. Empty when all is well. */
  errors: Partial<Record<CourseRecordSectionId, unknown>>;
}

export function useCourseRecord({
  courseUuid,
  enabled = true,
}: UseCourseRecordOptions): CourseRecord {
  const on = enabled && Boolean(courseUuid);

  /* ── blocking ───────────────────────────────────────────────────────── */

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid ?? '' } }),
    enabled: on,
    staleTime: STALE_TIMES.entity,
  });
  const course = courseQuery.data?.data;

  /* ── access ─────────────────────────────────────────────────────────── */

  const contentQuery = useQuery({
    ...getCourseContentOptions({ path: { courseUuid: courseUuid ?? '' } }),
    enabled: on,
    staleTime: STALE_TIMES.entity,
  });
  const content = contentQuery.data?.data as CourseRecordContent | undefined;

  const access = useCourseAccess(content);
  const capability = courseCapability(access);

  /*
   * Gate the privileged calls on the capability map rather than on a domain
   * check, so "who may ask for this" and "what this viewer's page shows" stay
   * the same statement. Before the content response lands, `access` is
   * `prospect` and these stay idle — which is the correct default.
   */
  const canReadContentItems = capability.content.level === 'full';
  const seesScopedFigures = capability.kpi?.set === 'scoped';
  const seesCommercials = capability.showSales;

  /* ── reference data · 5 min ─────────────────────────────────────────── */

  const reviewsQuery = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseUuid ?? '' } }),
    enabled: on,
    staleTime: STALE_TIMES.entity,
  });

  const assessmentsQuery = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: { pageable: { page: 0, size: PAGE_SIZE } },
    }),
    enabled: on && canReadContentItems,
    staleTime: STALE_TIMES.entity,
  });

  const requirementsQuery = useQuery({
    ...getCourseTrainingRequirementsOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: { pageable: { page: 0, size: PAGE_SIZE } },
    }),
    enabled: on,
    staleTime: STALE_TIMES.entity,
  });

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { course_uuid_eq: courseUuid ?? '' },
        pageable: { page: 0, size: PAGE_SIZE },
      },
    }),
    enabled: on && seesCommercials,
    staleTime: STALE_TIMES.entity,
  });

  /* ── live data · 60s ────────────────────────────────────────────────── */

  const classesQuery = useQuery({
    ...getClassDefinitionsForCourseOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: { activeOnly: true },
    }),
    enabled: on,
    staleTime: STALE_TIMES.live,
  });

  const completionQuery = useQuery({
    ...getCourseCompletionRateOptions({ path: { courseUuid: courseUuid ?? '' } }),
    enabled: on && capability.kpi !== null,
    staleTime: STALE_TIMES.live,
  });

  const enrollmentsQuery = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: { pageable: { page: 0, size: PAGE_SIZE } },
    }),
    enabled: on && (seesCommercials || seesScopedFigures),
    staleTime: STALE_TIMES.live,
  });

  const statsQuery = useCourseStats(courseUuid);
  const trainersQuery = useCourseTrainers(courseUuid);

  /* ── shaping ────────────────────────────────────────────────────────── */

  const reviews = reviewsQuery.data?.data;

  const assessments = assessmentsQuery.data?.data?.content;

  const requirements = requirementsQuery.data?.data?.content;

  const applications = applicationsQuery.data?.data?.content;

  const classDefinitions = useMemo(() => {
    const rows = classesQuery.data?.data;
    if (!rows) return undefined;
    return rows
      .map(row => row.class_definition)
      .filter((definition): definition is ClassDefinition => Boolean(definition));
  }, [classesQuery.data]);

  const completionRate = useMemo(() => {
    const raw = completionQuery.data?.data;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
    // The API has answered on both scales over its life; normalise to 0–100.
    return raw > 1 ? raw : raw * 100;
  }, [completionQuery.data]);

  const enrollments = useMemo<CourseEnrollmentPage | undefined>(() => {
    const page = enrollmentsQuery.data?.data;
    if (!page) return undefined;
    const total = page.metadata?.totalElements;
    return {
      items: page.content ?? [],
      total: total === undefined ? undefined : Number(total),
    };
  }, [enrollmentsQuery.data]);

  /* ── assembly ───────────────────────────────────────────────────────── */

  const sections = {
    course: toSection(courseQuery, course),
    content: toSection(contentQuery, content),
    stats: toSection(statsQuery, statsQuery.data),
    trainers: toSection(trainersQuery, trainersQuery.data),
    classes: toSection(classesQuery, classDefinitions),
    reviews: toSection(reviewsQuery, reviews),
    assessments: toSection(assessmentsQuery, assessments),
    requirements: toSection(requirementsQuery, requirements),
    completionRate: toSection(completionQuery, completionRate),
    enrollments: toSection(enrollmentsQuery, enrollments),
    applications: toSection(applicationsQuery, applications),
  } satisfies Record<CourseRecordSectionId, CourseRecordSection<unknown>>;

  const errors: Partial<Record<CourseRecordSectionId, unknown>> = {};
  for (const id of COURSE_RECORD_SECTIONS) {
    const error = sections[id].error;
    if (error) errors[id] = error;
  }

  return {
    ...sections,
    access,
    capability,
    isLoading: sections.course.loading,
    errors,
  };
}

/** Spread into any block that owns an `<AsyncSection>`. */
export function asyncProps<T>(section: CourseRecordSection<T>): {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
} {
  return { loading: section.loading, error: section.error, onRetry: section.refetch };
}

type QueryLike = { isLoading: boolean; error: unknown; refetch: () => unknown };

function toSection<T>(query: QueryLike, data: T | undefined): CourseRecordSection<T> {
  return {
    data,
    // `&& !data` so a background refetch keeps what is already on screen.
    loading: query.isLoading && data === undefined,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
