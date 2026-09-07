'use client';

/**
 * The course record, wired.
 *
 * `CourseRecordView` is the shell and `blocks/*` are the pieces; this is the one
 * file that knows how to get from `useCourseRecord`'s sections to the props each
 * of those pieces takes. Drop it on a route with a course uuid and the whole
 * record renders:
 *
 *     <CourseRecordPage courseUuid={id} backHref='/dashboard/…/courses' />
 *
 * ## What decides what
 *
 * Nothing here asks who is looking. `record.capability` — the row the API's
 * `access` string selects out of `COURSE_ACCESS_CAPABILITIES` — names the tabs,
 * the rail cards and their order; this file only resolves each name to the block
 * that draws it. A rail card the map does not list is never constructed, and a
 * tab panel is built only for a tab the map allows.
 *
 * ## Composition, not fetching
 *
 * `useCourseRecord` is called once and is the only source of record data. Three
 * of the blocks want a shape the API does not serve directly — a class row, an
 * order line, a curriculum lesson — and the composing happens here, in the
 * container, exactly as those blocks' own docs ask ("the route composes the row
 * and the block renders it"). Two small entity lookups the record hook does not
 * cover ride alongside it: the difficulty label for the hero's Level cell, and
 * the creator's profile for the hero byline — both keyed off the course itself.
 *
 * A figure the response did not carry is left absent. Nothing here backfills a
 * privileged value from another call, and nothing substitutes a zero.
 */

import { useQuery } from '@tanstack/react-query';
import { Fragment, type ReactNode, useMemo } from 'react';

import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { STALE_TIMES } from '@/lib/query-client';
import { getCourseCreatorByUuidOptions } from '@/services/client/@tanstack/react-query.gen';

import { CourseRecordView } from './CourseRecordView';
import {
  AccessCard,
  ActionsCard,
  ActivityTab,
  ApplicationStatusPanel,
  ClassesTab,
  CommercialsTab,
  COURSE_DEFAULT_CURRENCY,
  courseBulletLines,
  courseContentKind,
  type CourseApplicationRow,
  type CourseClassFormatTone,
  type CourseClassRow,
  type CourseCurriculumLesson,
  type CourseOrderRow,
  CurriculumTab,
  DeliveryTab,
  EnrolPanel,
  formatCourseDate,
  formatCourseMoney,
  GateBanner,
  GlanceCard,
  KpiBand,
  LicenceCard,
  OpportunityPanel,
  OverviewTab,
  OwnerDecisionsPanel,
  ProgressStrip,
  ReviewsTab,
  summarise,
} from './blocks';
import type {
  ClassDefinition,
  Course,
  CourseRailCardId,
  CourseRecordTabId,
} from './types';
import { asyncProps, useCourseRecord } from './use-course-record';

/** Values a capability-map `{token}` is filled from. */
type CopyVars = Record<string, string | number | null | undefined>;

export interface CourseRecordPageProps {
  courseUuid: string;
  /**
   * The organisation whose approval gates the content call. Without it the
   * content query stays idle, `access` holds at `prospect` and the curriculum is
   * empty — which is the least-privileged default, and correct.
   */
  organisationUuid?: string;
  /** Where the shell's back link goes. Omitted, the link is not rendered. */
  backHref?: string;
  className?: string;
}

export function CourseRecordPage({
  courseUuid,
  organisationUuid,
  backHref,
  className,
}: CourseRecordPageProps) {
  const record = useCourseRecord({ courseUuid, organisationUuid });
  const { access, capability } = record;

  const course = record.course.data;
  const content = record.content.data;
  const stats = record.stats.data;

  /* ── two lookups the record hook does not cover ─────────────────────── */

  const { difficultyMap } = useDifficultyLevels();
  const level = course?.difficulty_uuid ? difficultyMap[course.difficulty_uuid] : undefined;

  const creatorQuery = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid ?? '' } }),
    enabled: Boolean(course?.course_creator_uuid),
    staleTime: STALE_TIMES.entity,
  });
  const creator = creatorQuery.data;

  /* ── shapes the blocks ask the route to compose ─────────────────────── */

  const lessons = useMemo<CourseCurriculumLesson[]>(
    () =>
      (content?.lessons ?? []).map((lesson, index) => {
        const number = lesson.lesson_number ?? index + 1;
        return {
          number,
          title: lesson.title ?? `Lesson ${number}`,
          objective:
            courseBulletLines(lesson.learning_objectives)[0] ??
            courseBulletLines(lesson.description)[0],
          itemCount: lesson.content_count ?? lesson.contents?.length,
          items: lesson.contents?.map(item => ({
            uuid: item.uuid,
            title: item.title,
            kind: courseContentKind(item.content_category ?? item.mime_type),
            required: item.is_required,
          })),
        };
      }),
    [content]
  );

  const classRows = useMemo<CourseClassRow[]>(
    () => (record.classes.data ?? []).flatMap(toClassRow),
    [record.classes.data]
  );

  const orders = useMemo<CourseOrderRow[]>(
    () =>
      (record.enrollments.data?.items ?? []).flatMap(enrollment =>
        enrollment.uuid
          ? [
              {
                uuid: enrollment.uuid,
                item: course?.name,
                date: toIsoDate(enrollment.enrollment_date),
              },
            ]
          : []
      ),
    [record.enrollments.data, course?.name]
  );

  const pendingApplications = useMemo<CourseApplicationRow[]>(
    () =>
      (record.applications.data ?? []).flatMap(application =>
        application.uuid && application.status === 'pending'
          ? [
              {
                uuid: application.uuid,
                // The application DTO carries no applicant name — only the uuid
                // it was filed under. A short reference is the honest stand-in
                // until the record hook can resolve the two applicant kinds.
                displayName: `Applicant ${(application.applicant_uuid ?? application.uuid).slice(0, 8)}`,
                applicantType:
                  application.applicant_type === 'organisation' ? 'organisation' : 'instructor',
                appliedAt: toIsoDate(application.created_date),
              },
            ]
          : []
      ),
    [record.applications.data]
  );

  /* ── figures the copy sets interpolate ──────────────────────────────── */

  const reviews = record.reviews.data;
  const ratings = useMemo(() => summarise(reviews ?? []), [reviews]);

  const lessonCount = content?.total_lessons ?? content?.lessons?.length;
  const contentItemCount = content?.lessons
    ? lessons.reduce((total, lesson) => total + (lesson.itemCount ?? 0), 0)
    : undefined;
  const duration = durationLabel(course);

  const assessments = record.assessments.data;
  const assessmentCount = assessments?.length;
  const majorAssessmentCount = assessments?.filter(row => row.is_major_assessment).length;

  const mandatoryRequirements = record.requirements.data?.filter(row => row.is_mandatory).length;

  const trainers = record.trainers.data;
  const approvedTrainerCount =
    stats?.public.approved_trainer_count ??
    trainers?.trainers.filter(row => row.approved_at).length;

  // Until the classes call resolves there is no class count — and a zero on a
  // "classes open now" tile is a claim, not a blank.
  const classesKnown = record.classes.data !== undefined;
  const openClasses = classRows.filter(row => row.openForEnrolment !== false);
  const openClassCount = classesKnown ? openClasses.length : undefined;
  const nextClassStarts = useMemo(
    () => nextStart(record.classes.data),
    [record.classes.data]
  );
  const formats = useMemo(
    () => [...new Set(classRows.map(row => row.format).filter(Boolean))].join(', ') || undefined,
    [classRows]
  );

  const priceLabel = formatCourseMoney(course?.price ?? undefined);
  const averageRating = content?.average_rating ?? ratings.average;
  const totalReviews = content?.total_reviews ?? ratings.total;
  const enrolledCount = record.enrollments.data?.total ?? stats?.public.learners_trained;

  /** Every `{token}` the capability map leaves for live data, resolved once. */
  const vars: CopyVars = {
    lifecycle: course?.lifecycle_stage ?? capitalise(course?.status),
    enrolment:
      course?.accepts_new_enrollments === undefined
        ? undefined
        : course.accepts_new_enrollments
          ? 'Open'
          : 'Closed',
    classLimit: course?.class_limit ?? undefined,
    classSize: course?.class_limit ?? undefined,
    ageRange: ageRangeLabel(course?.age_lower_limit, course?.age_upper_limit),
    assessments: assessmentCount,
    majorAssessments: majorAssessmentCount,
    lastUpdated: formatCourseDate(course?.updated_date),
    price: priceLabel,
    nextClassStarts,
    openClasses: openClassCount,
    totalClasses: classesKnown ? classRows.length : undefined,
    formats,
    lessons: lessonCount,
    contentItems: contentItemCount,
    duration,
    minimumFee: formatCourseMoney(course?.minimum_training_fee ?? undefined),
    creatorShare: course?.creator_share_percentage,
    trainerShare: course?.instructor_share_percentage,
    mandatoryRequirements,
    approvedTrainers: approvedTrainerCount,
    learners: stats?.public.learners_trained,
    averageFill: stats?.public.average_class_fill,
    rating: ratings.average?.toFixed(1),
    reviews: ratings.total || undefined,
    pendingApplications: pendingApplications.length || undefined,
  };

  /* ── bands ──────────────────────────────────────────────────────────── */

  const kpiBand =
    capability.kpi === null ? undefined : (
      <KpiBand
        access={access}
        stats={stats}
        priceFrom={course?.price ?? undefined}
        classesOpenNow={openClassCount}
        nextClassStarts={nextClassStarts}
        {...asyncProps(record.stats)}
      />
    );

  const progressStrip = capability.showProgressStrip ? (
    <ProgressStrip
      totalLessons={lessonCount}
      assessmentsTotal={assessmentCount}
      {...asyncProps(record.content)}
    />
  ) : undefined;

  const gateBanner = capability.gate ? <GateBanner access={access} vars={vars} /> : undefined;

  /* ── rail ───────────────────────────────────────────────────────────── */

  const railCard = (card: CourseRailCardId): ReactNode => {
    switch (card) {
      case 'access':
        return <AccessCard access={access} vars={vars} />;
      case 'glance':
        return <GlanceCard access={access} vars={vars} {...asyncProps(record.course)} />;
      case 'ownerDecisions':
        return (
          <OwnerDecisionsPanel
            applications={pendingApplications}
            {...asyncProps(record.applications)}
          />
        );
      case 'applicationStatus':
        return <ApplicationStatusPanel {...asyncProps(record.applications)} />;
      case 'licence':
        return <LicenceCard access={access} />;
      case 'enrol':
        return (
          <EnrolPanel
            price={course?.price ?? undefined}
            openClassCount={openClassCount}
            vars={vars}
            {...asyncProps(record.course)}
          />
        );
      case 'opportunity':
        return <OpportunityPanel vars={vars} {...asyncProps(record.course)} />;
      case 'actions':
        return <ActionsCard access={access} vars={vars} />;
      default:
        return null;
    }
  };

  // A `Fragment` rather than a wrapper element: a card that renders nothing must
  // not leave a gap behind it in the rail's flex column.
  const rail = capability.rail
    .map(card => {
      const node = railCard(card);
      return node === null ? null : <Fragment key={card}>{node}</Fragment>;
    })
    .filter(Boolean);

  /* ── tabs ───────────────────────────────────────────────────────────── */

  const tabPanel = (tab: CourseRecordTabId): ReactNode => {
    switch (tab) {
      case 'overview':
        return (
          <OverviewTab
            access={access}
            description={course?.description}
            objectives={courseBulletLines(course?.objectives)}
            prerequisites={courseBulletLines(course?.prerequisites)}
            fitVars={vars}
            requirements={record.requirements.data}
            requirementsAsync={asyncProps(record.requirements)}
            {...asyncProps(record.course)}
          />
        );
      case 'curriculum':
        return (
          <CurriculumTab
            access={access}
            lessons={lessons}
            lessonCount={lessonCount}
            contentItemCount={contentItemCount}
            {...asyncProps(record.content)}
          />
        );
      case 'delivery':
        return (
          <DeliveryTab
            access={access}
            trainers={trainers?.trainers}
            trainersAsync={asyncProps(record.trainers)}
            classes={classRows}
            classesAsync={asyncProps(record.classes)}
            classesAcceptingCount={openClassCount}
          />
        );
      case 'classes':
        return <ClassesTab access={access} classes={classRows} {...asyncProps(record.classes)} />;
      case 'commercials':
        // The block returns null once the response resolves without an `owner`
        // block. Leaving the panel out then keeps the tab row from advertising
        // a page with nothing on it.
        return stats?.owner || record.stats.loading || record.stats.error ? (
          <CommercialsTab
            access={access}
            course={course}
            stats={stats}
            statsAsync={asyncProps(record.stats)}
            trainers={trainers?.trainers}
            trainersAsync={asyncProps(record.trainers)}
            orders={orders}
            ordersAsync={asyncProps(record.enrollments)}
            currency={COURSE_DEFAULT_CURRENCY}
          />
        ) : null;
      case 'reviews':
        return <ReviewsTab reviews={reviews} {...asyncProps(record.reviews)} />;
      case 'activity':
        return <ActivityTab access={access} />;
      default:
        return null;
    }
  };

  const tabPanels: Partial<Record<CourseRecordTabId, ReactNode>> = {};
  for (const tab of capability.tabs) {
    const panel = tabPanel(tab);
    if (panel !== null) tabPanels[tab] = panel;
  }

  const tabCounts: Partial<Record<CourseRecordTabId, number>> = {
    curriculum: lessonCount,
    delivery: trainers?.trainers.filter(row => row.approved_at).length,
    classes: record.classes.data?.length,
    reviews: reviews?.length,
  };

  /* ── shell ──────────────────────────────────────────────────────────── */

  return (
    <CourseRecordView
      access={access}
      className={className}
      courseName={course?.name}
      backHref={backHref}
      priceLabel={priceLabel}
      hero={{
        title: course?.name,
        summary: courseBulletLines(course?.description).join(' ') || undefined,
        categories: course?.category_names,
        status: course?.status,
        creatorName: creator?.full_name,
        creatorRole: creator?.professional_headline ?? undefined,
        averageRating,
        totalReviews,
        enrolledCount,
        lessonCount,
        contentItemCount,
        contentCountNote: capability.content.countNote,
        duration,
        level,
        ...asyncProps(record.course),
      }}
      kpiBand={kpiBand}
      progressStrip={progressStrip}
      gateBanner={gateBanner}
      rail={rail.length > 0 ? rail : undefined}
      tabPanels={tabPanels}
      tabCounts={tabCounts}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Composing
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * A class definition as the two class surfaces need it.
 *
 * Host and seat take-up are not on the definition, so they are left out rather
 * than guessed; the row degrades to what the response actually carried.
 */
function toClassRow(definition: ClassDefinition): CourseClassRow[] {
  const uuid = definition.uuid;
  if (!uuid) return [];

  const format = classFormat(definition.location_type);

  return [
    {
      uuid,
      title: definition.title,
      place: definition.location_name ?? format.place,
      format: format.label,
      formatTone: format.tone,
      seatsTotal: definition.max_participants,
      dates: dateRange(
        definition.academic_period_start_date,
        definition.academic_period_end_date
      ),
      price: definition.sale_price ?? undefined,
      openForEnrolment: isOpenForEnrolment(definition),
    },
  ];
}

function classFormat(locationType: ClassDefinition['location_type']): {
  label: string;
  tone: CourseClassFormatTone;
  place?: string;
} {
  if (locationType === 'ONLINE') return { label: 'Online · live', tone: 'online', place: 'Live online' };
  if (locationType === 'HYBRID') return { label: 'Blended', tone: 'blended' };
  return { label: 'In-person', tone: 'in-person' };
}

/**
 * Open when today falls inside the registration window, inclusive of both ends —
 * the same window enrolment is refused outside of, so the badge and the checkout
 * agree. Compared as `YYYY-MM-DD`, which sorts chronologically, so a class that
 * opens or closes today counts as open for the whole of that day at whatever hour
 * the page is rendered and in whatever zone the viewer is sitting.
 *
 * Every class created through the forms now carries both dates. A legacy row may
 * carry one or neither, and each bound still answers what it can:
 *
 * - before a known opening day, or after a known closing day, is a definite `false`;
 * - inside both known bounds is a definite `true`;
 * - inside the one bound that exists, with the other missing, is genuinely unknown.
 *
 * `undefined` is that unknown. It is not `false` — nothing that was joinable
 * disappears from a list — and it is not `true` either, because "we were not told"
 * is not the same answer as "come on in".
 */
function isOpenForEnrolment(definition: ClassDefinition): boolean | undefined {
  if (definition.is_active === false) return false;

  const opens = apiDay(definition.registration_period_start_date);
  const closes = apiDay(definition.registration_period_end_date);
  if (opens === undefined && closes === undefined) return undefined;

  const today = localToday();
  if (opens !== undefined && today < opens) return false;
  if (closes !== undefined && today > closes) return false;
  return opens !== undefined && closes !== undefined ? true : undefined;
}

/** The start of the soonest class that has not begun, formatted. */
function nextStart(definitions: readonly ClassDefinition[] | undefined): string | undefined {
  const now = Date.now();
  let soonest: number | undefined;

  for (const definition of definitions ?? []) {
    const start = timeOf(definition.academic_period_start_date);
    if (start === undefined || start < now) continue;
    if (soonest === undefined || start < soonest) soonest = start;
  }

  return soonest === undefined ? undefined : formatCourseDate(new Date(soonest));
}

/* ────────────────────────────────────────────────────────────────────────────
 * Formatting
 * ────────────────────────────────────────────────────────────────────────── */

function durationLabel(course: Course | undefined): string | undefined {
  if (course?.total_duration_display) return course.total_duration_display;
  if (!course) return undefined;

  const hours = course.duration_hours || 0;
  const minutes = course.duration_minutes || 0;
  if (hours === 0 && minutes === 0) return undefined;

  return [hours > 0 ? `${hours}h` : undefined, minutes > 0 ? `${minutes}m` : undefined]
    .filter(Boolean)
    .join(' ');
}

function ageRangeLabel(
  lower: number | null | undefined,
  upper: number | null | undefined
): string | undefined {
  if (lower != null && upper != null) return `${lower} – ${upper}`;
  if (lower != null) return `${lower}+`;
  if (upper != null) return `Up to ${upper}`;
  return undefined;
}

function capitalise(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

/** Milliseconds, or `undefined` for anything absent or unparseable. */
function timeOf(value: Date | string | null | undefined): number | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

/**
 * The calendar day an API `format: date` field names, as `YYYY-MM-DD`.
 *
 * `registration_period_*` is `format: date` — a day with no time and no zone. The
 * generated response transformer parses it before this file ever sees it
 * (`classDefinitionSchemaResponseTransformer` does `new Date(data.…)`), and a
 * date-only string parses as **UTC** midnight. So the UTC half of that instant is
 * the day the backend stored, and it must be read back with UTC getters: local ones
 * return the previous day for every viewer west of Greenwich, which is how
 * `2026-09-30` became `2026-09-29` in Los Angeles.
 *
 * The string branch is not dead code — it covers a response read without the
 * transformer (a cached or hand-built payload) — but it is not the path the class
 * list takes.
 */
function apiDay(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : undefined;
  }
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
}

/**
 * Today as `YYYY-MM-DD` in the viewer's own zone — local getters, deliberately. The
 * window is a run of calendar days, and the day it is for a person in Nairobi is the
 * day their device says it is, not the day it is in UTC.
 */
function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** ISO 8601, for the blocks that format a date themselves. */
function toIsoDate(value: Date | string | null | undefined): string | undefined {
  const ms = timeOf(value);
  return ms === undefined ? undefined : new Date(ms).toISOString();
}

function dateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): string | undefined {
  const from = formatCourseDate(start);
  const to = formatCourseDate(end);
  if (from && to) return `${from} – ${to}`;
  return from ?? to;
}
