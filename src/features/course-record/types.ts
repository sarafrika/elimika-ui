/**
 * Course record — the shared vocabulary.
 *
 * One component tree serves six dashboards and eight viewers. Everything that
 * differs between those viewers is described **once**, here, in
 * {@link COURSE_ACCESS_CAPABILITIES}. Blocks read the capability for the current
 * access level and render; a block that switches on `access` itself is a bug,
 * because the next viewer state added would have to be found in every file.
 *
 * The copy in this file is transcribed verbatim from the `Main.dc.html`
 * artboard's `profile()` method — the artboards are the spec. Where the design
 * embedded a live figure in a sentence (a date, a price, a count) the literal is
 * kept as a `{token}` and resolved at render with {@link fillCourseCopy}.
 */

import type {
  ClassDefinition,
  Course,
  CourseAssessment,
  CourseReview,
  CourseTrainingApplication,
  CourseTrainingRateCard,
  CourseTrainingRequirement,
  OrganisationCourseContent,
} from '@/services/client/types.gen';

/* ────────────────────────────────────────────────────────────────────────────
 * Access
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The eight viewer states. **The API decides which one applies** — it is read
 * off the course-content response and is never re-derived from the signed-in
 * user's domain. See `use-course-access.ts`.
 */
export const COURSE_ACCESS_LEVELS = [
  'creator',
  'admin',
  'organisation',
  'instructor',
  'applicant',
  'pending',
  'prospect',
  'student',
] as const;

export type CourseAccess = (typeof COURSE_ACCESS_LEVELS)[number];

/** Least-privilege default: what an unauthenticated browser of the catalogue sees. */
export const DEFAULT_COURSE_ACCESS: CourseAccess = 'prospect';

export function isCourseAccess(value: unknown): value is CourseAccess {
  return (
    typeof value === 'string' && (COURSE_ACCESS_LEVELS as readonly string[]).includes(value)
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Tabs and rail slots
 * ────────────────────────────────────────────────────────────────────────── */

export const COURSE_RECORD_TABS = [
  'overview',
  'curriculum',
  'delivery',
  'commercials',
  'classes',
  'reviews',
  'activity',
] as const;

export type CourseRecordTabId = (typeof COURSE_RECORD_TABS)[number];

/**
 * Base tab labels. The artboard appends a count to four of them
 * (`Curriculum · 12`, `Delivery · 4`, `Classes · 17`, `Reviews · 128`);
 * `CourseRecordView` does that from its `tabCounts` prop.
 */
export const COURSE_RECORD_TAB_LABELS: Record<CourseRecordTabId, string> = {
  overview: 'Overview',
  curriculum: 'Curriculum',
  delivery: 'Delivery',
  commercials: 'Commercials',
  classes: 'Classes',
  reviews: 'Reviews',
  activity: 'Activity',
};

/** The right-rail cards, in the order the artboard stacks them. */
export const COURSE_RAIL_CARDS = [
  /** "Owner — full access" + the grant list. Always present. */
  'access',
  /** "At a glance" key/value table. Always present. */
  'glance',
  /** Creator only — training applications waiting on a decision. */
  'ownerDecisions',
  /** Pending applicant only — the status timeline of their own application. */
  'applicationStatus',
  /** Content licence terms. */
  'licence',
  /** Prospect only — price, enrol CTA, what is included. */
  'enrol',
  /** Applicant only — "What you would work under" (fee floor, split, demand). */
  'opportunity',
  /** The per-viewer action list. Always last. */
  'actions',
] as const;

export type CourseRailCardId = (typeof COURSE_RAIL_CARDS)[number];

/**
 * Icon slugs used by the capability map. Blocks map these to `lucide-react`
 * components — keeping the map free of JSX is what lets it live in a `.ts` file
 * that server code can import.
 */
export type CourseRecordIconName =
  | 'calendar'
  | 'check'
  | 'document'
  | 'download'
  | 'flag'
  | 'pen'
  | 'send'
  | 'users'
  | 'video';

/* ────────────────────────────────────────────────────────────────────────────
 * Stats — GET /courses/{uuid}/stats  (not live yet, see use-course-metrics.ts)
 * ────────────────────────────────────────────────────────────────────────── */

/** Figures every viewer of the record may see, whatever their access. */
export interface CourseStatsPublic {
  learners_trained: number;
  classes_running: number;
  /** Mean seat fill across running classes, as a percentage (0–100). */
  average_class_fill: number;
  /** As a percentage (0–100). */
  completion_rate: number;
  /** 1–5. */
  average_rating: number;
  total_reviews: number;
  approved_trainer_count: number;
}

/**
 * The viewer's *own* delivery of this course. Present only for an approved
 * organisation or instructor, and it is theirs alone — never another trainer's.
 */
export interface CourseStatsScoped {
  your_learners: number;
  your_classes: number;
  your_earnings: number;
}

/** Commercial totals. Present only for the course creator and platform admins. */
export interface CourseStatsOwner {
  total_enrollments: number;
  gross_sales: number;
  platform_fee: number;
  paid_orders: number;
  refunded_orders: number;
}

/**
 * `scoped` and `owner` are optional **by design**: a viewer who may not see a
 * block gets it absent from the response. Never backfill an absent block from
 * another call, and never substitute a zero — an absent figure is the correct
 * answer, and the KPI card for it simply does not render.
 */
export interface CourseStats {
  /**
   * Optional because the contract says so (`CourseStats.public?` in the generated
   * client). Declaring it required here made the compiler vouch for a field the
   * server may omit, so fourteen call sites dereferenced it unguarded and tsc
   * stayed silent. An absent block means "not yours to see" — never a zero.
   */
  public?: CourseStatsPublic;
  scoped?: CourseStatsScoped;
  owner?: CourseStatsOwner;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Trainers — GET /courses/{uuid}/trainers  (not live yet)
 * ────────────────────────────────────────────────────────────────────────── */

export type CourseTrainerApplicantType = 'instructor' | 'organisation';

/**
 * One approved (or pending) trainer on the delivery list.
 *
 * `rate_card` is present **only for the creator and platform admins**. An
 * organisation or instructor reading this list sees who else delivers the course
 * and where, never what they charge — so the field is absent, not empty. Render
 * the "Delivering" column instead of the "Rate card (from)" column from
 * {@link CourseAccessCapability.deliveryColumnHeading}; do not pick a rate at
 * render time from a fuller object.
 */
export interface CourseTrainerSummary {
  applicant_type: CourseTrainerApplicantType;
  applicant_uuid: string;
  display_name: string;
  /** Free text, e.g. "Westlands · 3 branches" or "Kisumu · verified instructor". */
  location?: string;
  /** ISO date the training application was approved; absent while pending. */
  approved_at?: string;
  active_class_count: number;
  rate_card?: CourseTrainingRateCard;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Content
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The approval-gated course content, plus the `access` discriminator the API
 * serves alongside it. The generated client predates that field, so it is added
 * here rather than hand-edited into `types.gen.ts` (which is regenerated).
 */
export type CourseRecordContent = OrganisationCourseContent & {
  /** Authoritative viewer state. Absent on older responses → treated as `prospect`. */
  access?: CourseAccess;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Per-section async state
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * What `useCourseRecord` hands back for each region of the page. Feed it
 * straight into `<AsyncSection>` so one slow or failing call degrades its own
 * card and nothing else.
 */
export interface CourseRecordSection<T> {
  data: T | undefined;
  /** Already `isLoading && !data`, so a refetch keeps stale content on screen. */
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

/** The three props every block accepts so it can own its `<AsyncSection>`. */
export interface CourseBlockAsyncProps {
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Capability map
 * ────────────────────────────────────────────────────────────────────────── */

/** Which KPI band the viewer gets, or `none` for the learner progress strip. */
export type CourseKpiSetId = 'course' | 'scoped' | 'trainer-case' | 'learner-case';

/** How deep into the curriculum the viewer is allowed to read. */
export type CourseContentLevel =
  /** Every lesson and every content item. */
  | 'full'
  /** Lesson titles, objectives and item counts. Items are never transmitted. */
  | 'outline'
  /** Outline plus durations and the free intro video. */
  | 'syllabus';

/** Named copy sets the rail and overview blocks own; the map only names them. */
export type CourseGrantSetId = 'owner' | 'full' | 'locked' | 'applicant' | 'prospect' | 'learner';
export type CourseGlanceSetId = 'full' | 'applicant' | 'prospect' | 'learner';
export type CourseLicenceSetId = 'admin' | 'trainer' | 'learner';
export type CourseFitSetId = 'trainer' | 'learner';

export interface CourseKpiCopy {
  set: CourseKpiSetId;
  title: string;
  /**
   * The scope line to the right of the title. `organisation` reads
   * "Scoped to your organisation" until the org's name is known — pass it to
   * `<KpiBand scopeLabel="Scoped to Nairobi Skills Institute">`.
   */
  scope: string;
  /** Label of the first (people) card. */
  learnersLabel: string;
  /** Label of the second (money / fill) card. */
  moneyLabel: string;
  /** The second card's icon: money for most, a bar chart for the two applicant states. */
  moneyIcon: 'credit-card' | 'bar-chart';
  /**
   * Only the `course` set needs this: the creator's money card counts orders,
   * the admin's names the platform fee. Every other set's hint follows from
   * {@link CourseKpiCopy.set} alone.
   */
  moneyHint?: 'orders' | 'platform-fee';
  /** Label of the third (classes) card. */
  classesLabel: string;
}

export interface CourseGateCopy {
  /** `warning` for the pending applicant's amber banner, `primary` for the brand-hued ones. */
  tone: 'warning' | 'primary';
  title: string;
  /** May contain `{lessons}`, `{duration}` or `{contentItems}` — see {@link fillCourseCopy}. */
  body: string;
  /** May contain `{introDuration}`. */
  cta: string;
}

export interface CourseRailAction {
  /** May contain a `{token}` — see {@link fillCourseCopy}. */
  label: string;
  icon: CourseRecordIconName;
}

export interface CourseContentCapability {
  level: CourseContentLevel;
  /** Chip on the curriculum tab: "Full content", "Outline only", … */
  badge: string;
  /** The line under it explaining why editing is not offered here. */
  readonlyNote: string;
  /**
   * Parenthetical appended to the content-item count in the hero stat strip —
   * "68 (locked)". Absent when the viewer may open the items.
   */
  countNote?: string;
}

export interface CourseAccessCapability {
  access: CourseAccess;

  /* — chrome — */
  /** First crumb; the course name is appended after " · ". */
  breadcrumbRoot: string;
  /** The pill beside the crumb: "Owner — full access". */
  accessLabel: string;
  /**
   * Why the viewer has this access. Two states finish the sentence with live
   * data and carry a `{token}` for it: `organisation`/`instructor` need
   * `{date}`, `student` needs `{className}`.
   */
  accessSource: string;
  accessBlurb: string;
  /** Label of the single filled button in the top bar. May carry `{price}`. */
  primaryAction: string;

  /* — layout — */
  tabs: readonly CourseRecordTabId[];
  rail: readonly CourseRailCardId[];
  railActionsTitle: string;
  railActions: readonly CourseRailAction[];

  /* — bands — */
  /** `null` for the enrolled learner, who gets the progress strip instead. */
  kpi: CourseKpiCopy | null;
  showProgressStrip: boolean;
  /** `null` when the viewer sees the whole record and nothing is gated. */
  gate: CourseGateCopy | null;

  /* — content — */
  content: CourseContentCapability;
  /** Only the creator edits; everyone else reads. */
  canEdit: boolean;

  /* — commercials and delivery — */
  /** Course-wide sales figures. Creator and admin only. */
  showSales: boolean;
  /** Other trainers' rate cards. Creator and admin only. */
  showRates: boolean;
  /** Fourth column of the delivery table — rates for those who may see them. */
  deliveryColumnHeading: string;
  deliveryBlurb: string;
  classesTitle: string;
  classesSub: string;

  /* — named copy sets — */
  grantSet: CourseGrantSetId;
  glanceSet: CourseGlanceSetId;
  licenceSet: CourseLicenceSetId | null;
  /** Blurb above the licence bullet list; `null` when there is no licence card. */
  licenceBlurb: string | null;
  /** The two "how it is delivered / what you receive" cards on the overview tab. */
  fitSet: CourseFitSetId | null;
}

const COURSE_KPI_TRAINER_CASE: CourseKpiCopy = {
  set: 'trainer-case',
  title: 'The case for delivering this course',
  scope: 'Public performance — the same figures every trainer sees',
  learnersLabel: 'Learners trained',
  moneyLabel: 'Average class fill',
  moneyIcon: 'bar-chart',
  classesLabel: 'Classes running now',
};

const EXPORT_ACTION: CourseRailAction = { label: 'Export course record (PDF)', icon: 'download' };

/**
 * The eight viewer states, described once.
 *
 * Read it with {@link courseCapability}. Adding a ninth state means adding a row
 * here and nothing else; a `switch (access)` anywhere in a block means this map
 * is missing a field.
 */
export const COURSE_ACCESS_CAPABILITIES: Record<CourseAccess, CourseAccessCapability> = {
  creator: {
    access: 'creator',
    breadcrumbRoot: 'Course management',
    accessLabel: 'Owner — full access',
    accessSource: 'course.course_creator_uuid matches you',
    accessBlurb:
      'You own this record. You see every lesson, every content item, the commercial terms and every trainer delivering it — and you are the only party who can edit it or decide applications.',
    primaryAction: 'Edit course',
    tabs: ['overview', 'curriculum', 'delivery', 'commercials', 'reviews', 'activity'],
    rail: ['access', 'glance', 'ownerDecisions', 'actions'],
    railActionsTitle: 'Creator actions',
    railActions: [
      { label: 'Open course builder', icon: 'pen' },
      { label: 'Review training applications ({pendingApplications})', icon: 'users' },
      EXPORT_ACTION,
    ],
    kpi: {
      set: 'course',
      title: 'Course performance',
      scope: 'Course-wide · all trainers and classes',
      learnersLabel: 'Enrollments',
      moneyLabel: 'Purchases',
      moneyIcon: 'credit-card',
      moneyHint: 'orders',
      classesLabel: 'Active classes',
    },
    showProgressStrip: false,
    gate: null,
    content: {
      level: 'full',
      badge: 'Full content',
      readonlyNote:
        'Content is read-only here — open the builder to edit; edits re-enter review.',
    },
    canEdit: true,
    showSales: true,
    showRates: true,
    deliveryColumnHeading: 'Rate card (from)',
    deliveryBlurb:
      'Instructors and organisations approved to train this course, and what they charge.',
    classesTitle: 'Classes running this course',
    classesSub: 'Every class an approved trainer is running.',
    grantSet: 'owner',
    glanceSet: 'full',
    licenceSet: null,
    licenceBlurb: null,
    fitSet: null,
  },

  admin: {
    access: 'admin',
    breadcrumbRoot: 'Moderation',
    accessLabel: 'Platform admin — full access',
    accessSource: 'admin domain · moderation scope',
    accessBlurb:
      'Admins read the complete record for moderation: all content, commercial terms, every trainer, and the full version and decision history. Edits stay with the creator.',
    primaryAction: 'Moderate',
    tabs: ['overview', 'curriculum', 'delivery', 'commercials', 'reviews', 'activity'],
    rail: ['access', 'glance', 'licence', 'actions'],
    railActionsTitle: 'Moderation actions',
    railActions: [
      { label: 'Open moderation decision', icon: 'flag' },
      { label: 'View edit diff vs {previousVersion}', icon: 'document' },
      EXPORT_ACTION,
    ],
    kpi: {
      set: 'course',
      title: 'Course performance',
      scope: 'Course-wide · platform view',
      learnersLabel: 'Enrollments',
      moneyLabel: 'Gross sales',
      moneyIcon: 'credit-card',
      moneyHint: 'platform-fee',
      classesLabel: 'Active classes',
    },
    showProgressStrip: false,
    gate: null,
    content: {
      level: 'full',
      badge: 'Full content',
      readonlyNote: 'Read-only — admins moderate the record; only the creator can edit it.',
    },
    canEdit: false,
    showSales: true,
    showRates: true,
    deliveryColumnHeading: 'Rate card (from)',
    deliveryBlurb: 'Every trainer approved on this course, with decision dates and rate cards.',
    classesTitle: 'Classes running this course',
    classesSub: 'Every class an approved trainer is running.',
    grantSet: 'full',
    glanceSet: 'full',
    licenceSet: 'admin',
    licenceBlurb:
      'You read the full record to moderate it. Source files are not downloadable from here and every open is written to the audit log against your admin account.',
    fitSet: null,
  },

  organisation: {
    access: 'organisation',
    breadcrumbRoot: 'Courses',
    accessLabel: 'Approved to train — full read',
    accessSource: 'training application approved {date}',
    accessBlurb:
      'You are approved to deliver this course, so every lesson and content item is readable. Every figure here is your own — what other trainers charge and what the course earns overall stay with the creator.',
    primaryAction: 'Create a class',
    tabs: ['overview', 'curriculum', 'delivery', 'reviews'],
    rail: ['access', 'glance', 'licence', 'actions'],
    railActionsTitle: 'Delivery actions',
    railActions: [
      { label: 'Create a class for this course', icon: 'calendar' },
      { label: 'Assign an instructor', icon: 'users' },
      EXPORT_ACTION,
    ],
    kpi: {
      set: 'scoped',
      title: 'Your delivery of this course',
      scope: 'Scoped to your organisation',
      learnersLabel: 'Your learners',
      moneyLabel: 'Your earnings',
      moneyIcon: 'credit-card',
      classesLabel: 'Your classes',
    },
    showProgressStrip: false,
    gate: null,
    content: {
      level: 'full',
      badge: 'Full read access',
      readonlyNote: 'Read-only — only the course creator can edit this content.',
    },
    canEdit: false,
    showSales: false,
    showRates: false,
    deliveryColumnHeading: 'Delivering',
    deliveryBlurb:
      'Who else is approved to deliver this course. Their rates are their own — the creator does not share them.',
    classesTitle: 'Classes running this course',
    classesSub: 'Yours and other providers’.',
    grantSet: 'full',
    glanceSet: 'full',
    licenceSet: 'trainer',
    licenceBlurb:
      'Released to your organisation under the creator’s training licence while your approval stands. Read in place, teach from it — do not download, copy or redistribute it.',
    fitSet: null,
  },

  instructor: {
    access: 'instructor',
    breadcrumbRoot: 'My courses',
    accessLabel: 'Approved to train — full read',
    accessSource: 'training application approved {date}',
    accessBlurb:
      'You are approved to deliver this course, so every lesson and content item is readable. Every figure here is your own — what other trainers charge and what the course earns overall stay with the creator.',
    primaryAction: 'Create a class',
    tabs: ['overview', 'curriculum', 'delivery', 'reviews'],
    rail: ['access', 'glance', 'licence', 'actions'],
    railActionsTitle: 'Delivery actions',
    railActions: [
      { label: 'Create a class for this course', icon: 'calendar' },
      { label: 'Update my rate card', icon: 'pen' },
      EXPORT_ACTION,
    ],
    kpi: {
      set: 'scoped',
      title: 'Your delivery of this course',
      scope: 'Scoped to your classes',
      learnersLabel: 'Your learners',
      moneyLabel: 'Your earnings',
      moneyIcon: 'credit-card',
      classesLabel: 'Your classes',
    },
    showProgressStrip: false,
    gate: null,
    content: {
      level: 'full',
      badge: 'Full read access',
      readonlyNote: 'Read-only — only the course creator can edit this content.',
    },
    canEdit: false,
    showSales: false,
    showRates: false,
    deliveryColumnHeading: 'Delivering',
    deliveryBlurb:
      'Who else is approved to deliver this course. Their rates are their own — the creator does not share them.',
    classesTitle: 'Classes running this course',
    classesSub: 'Yours and other providers’.',
    grantSet: 'full',
    glanceSet: 'full',
    licenceSet: 'trainer',
    licenceBlurb:
      'Released to you under the creator’s training licence while your approval stands. It is yours to teach from, not to keep: no downloads, no redistribution.',
    fitSet: null,
  },

  applicant: {
    access: 'applicant',
    breadcrumbRoot: 'Training opportunities',
    accessLabel: 'Not applied — evaluating',
    accessSource: 'public listing · no application on file',
    accessBlurb:
      'You are deciding whether to deliver this course. You get everything needed for that decision — syllabus shape, effort, commercial terms, what the venue must provide — and none of the teaching material itself.',
    primaryAction: 'Apply to train',
    tabs: ['overview', 'curriculum', 'reviews'],
    rail: ['access', 'glance', 'opportunity', 'actions'],
    railActionsTitle: 'Before you apply',
    railActions: [
      { label: 'Start a training application', icon: 'send' },
      { label: 'Check my venue against the requirements', icon: 'check' },
      { label: 'Message the course creator', icon: 'send' },
    ],
    kpi: COURSE_KPI_TRAINER_CASE,
    showProgressStrip: false,
    gate: {
      tone: 'primary',
      title: 'Enough to decide, nothing to copy',
      body: 'Everything a trainer needs to price and plan delivery is open: {lessons} lessons, {duration}, the fee floor, the revenue split and the equipment the venue must supply. The lesson material stays with the creator until an application is approved.',
      cta: 'Apply to train',
    },
    content: {
      level: 'outline',
      badge: 'Outline only',
      readonlyNote:
        'Outline only — teaching content is released to approved trainers, under licence.',
      countNote: 'sealed',
    },
    canEdit: false,
    showSales: false,
    showRates: false,
    deliveryColumnHeading: 'Delivering',
    deliveryBlurb: '',
    classesTitle: 'Classes running this course',
    classesSub: 'What is already being delivered.',
    grantSet: 'applicant',
    glanceSet: 'applicant',
    licenceSet: null,
    licenceBlurb: null,
    fitSet: 'trainer',
  },

  pending: {
    access: 'pending',
    breadcrumbRoot: 'Catalogue',
    accessLabel: 'Preview — application pending',
    accessSource: 'training application status: pending',
    accessBlurb:
      'You can read the outline — lesson titles, objectives and item counts — so you can judge whether to deliver this course. Content items and course performance unlock when the creator approves you.',
    primaryAction: 'Apply to train',
    tabs: ['overview', 'curriculum', 'reviews'],
    rail: ['access', 'glance', 'applicationStatus', 'actions'],
    railActionsTitle: 'Available now',
    railActions: [
      { label: 'Submit training application', icon: 'send' },
      { label: 'Message the course creator', icon: 'send' },
      { label: 'Save to shortlist', icon: 'check' },
    ],
    kpi: COURSE_KPI_TRAINER_CASE,
    showProgressStrip: false,
    gate: {
      tone: 'warning',
      title: 'Outline only — the creator’s content stays sealed until they approve you',
      body: 'Your training application is pending. Lesson titles, objectives and item counts are shared so you can judge fit; the content items themselves are the creator’s intellectual property and are not transmitted to your browser at all until approval.',
      cta: 'View application',
    },
    content: {
      level: 'outline',
      badge: 'Outline only',
      readonlyNote: 'Outline only — content items unlock once your application is approved.',
      countNote: 'locked',
    },
    canEdit: false,
    showSales: false,
    showRates: false,
    deliveryColumnHeading: 'Delivering',
    deliveryBlurb: '',
    classesTitle: 'Classes running this course',
    classesSub: 'What is already being delivered.',
    grantSet: 'locked',
    // The artboard falls through to the full "at a glance" set for this state.
    glanceSet: 'full',
    licenceSet: null,
    licenceBlurb: null,
    fitSet: 'trainer',
  },

  prospect: {
    access: 'prospect',
    breadcrumbRoot: 'Catalogue',
    accessLabel: 'Not enrolled — public listing',
    accessSource: 'public catalogue · no enrollment on file',
    accessBlurb:
      'You are browsing before enrolling. The syllabus, the intro video, the price and every class running this course are open. Lesson material opens the moment your enrolment is paid and confirmed.',
    primaryAction: 'Enroll — {price}',
    tabs: ['overview', 'curriculum', 'classes', 'reviews'],
    rail: ['access', 'glance', 'enrol', 'actions'],
    railActionsTitle: 'Before you enroll',
    railActions: [
      { label: 'Watch the intro video', icon: 'video' },
      { label: 'Compare the {openClasses} open classes', icon: 'calendar' },
      { label: 'Save to my shortlist', icon: 'check' },
    ],
    kpi: {
      set: 'learner-case',
      title: 'What learners get out of it',
      scope: 'Public performance across every provider',
      learnersLabel: 'Learners trained',
      moneyLabel: 'From',
      moneyIcon: 'credit-card',
      classesLabel: 'Classes open now',
    },
    showProgressStrip: false,
    gate: {
      tone: 'primary',
      title: 'Watch the intro, read the syllabus — lessons open when you enroll',
      body: 'Every lesson title, objective and duration is listed so you know exactly what you are buying, and the intro video is free to watch. The {contentItems} lesson items are the creator’s work and unlock on your first paid enrolment.',
      cta: 'Watch intro ({introDuration})',
    },
    content: {
      level: 'syllabus',
      badge: 'Syllabus only',
      readonlyNote: 'Syllabus only — lessons open when your enrolment is confirmed.',
      countNote: 'after enrolment',
    },
    canEdit: false,
    showSales: false,
    showRates: false,
    deliveryColumnHeading: 'Delivering',
    deliveryBlurb: '',
    classesTitle: 'Classes you can join',
    classesSub:
      'The same course and certificate from different approved providers — pick the format, place and price that suit you.',
    grantSet: 'prospect',
    glanceSet: 'prospect',
    licenceSet: null,
    licenceBlurb: null,
    fitSet: 'learner',
  },

  student: {
    access: 'student',
    breadcrumbRoot: 'My learning',
    accessLabel: 'Enrolled — reading access',
    accessSource: 'active enrollment · {className}',
    accessBlurb:
      'You are enrolled, so every lesson is open to read at your own pace. Commercial terms and other providers stay with the creator and trainers.',
    primaryAction: 'Continue learning',
    tabs: ['overview', 'curriculum', 'classes', 'reviews'],
    rail: ['access', 'glance', 'licence', 'actions'],
    railActionsTitle: 'Learner actions',
    railActions: [
      { label: 'Continue where I left off', icon: 'video' },
      { label: 'Download my certificate', icon: 'download' },
      { label: 'Leave a review', icon: 'pen' },
    ],
    kpi: null,
    showProgressStrip: true,
    gate: null,
    content: {
      level: 'full',
      badge: 'Open to you',
      readonlyNote: 'Read-only — your progress is saved as you complete each item.',
    },
    canEdit: false,
    showSales: false,
    showRates: false,
    deliveryColumnHeading: 'Delivering',
    deliveryBlurb: '',
    classesTitle: 'Your class, and others you can join',
    classesSub:
      'Your enrolment is marked below. The other classes run the same course — useful if you need a different format or want to repeat the practical block.',
    grantSet: 'learner',
    glanceSet: 'learner',
    licenceSet: 'learner',
    licenceBlurb:
      'Your enrolment licenses this material to you personally for the length of the course. Pages carry your name as a watermark and cannot be downloaded or shared.',
    fitSet: null,
  },
};

/** The one way to read the map. */
export function courseCapability(access: CourseAccess): CourseAccessCapability {
  return COURSE_ACCESS_CAPABILITIES[access];
}

/** True when this viewer's rail includes the named card. */
export function hasRailCard(access: CourseAccess, card: CourseRailCardId): boolean {
  return COURSE_ACCESS_CAPABILITIES[access].rail.includes(card);
}

/** True when this viewer's tab row includes the named tab. */
export function hasTab(access: CourseAccess, tab: CourseRecordTabId): boolean {
  return COURSE_ACCESS_CAPABILITIES[access].tabs.includes(tab);
}

/**
 * Resolve the `{token}`s the capability map leaves for live data.
 *
 *   fillCourseCopy(cap.primaryAction, { price: 'KES 18,500' })  // "Enroll — KES 18,500"
 *
 * An unresolved token is dropped and the surrounding whitespace collapsed, so a
 * missing value degrades to a shorter sentence rather than a literal `{price}`.
 * Every token in this file is backed by a field that is always present on the
 * course or content response — pass it.
 */
export function fillCourseCopy(
  template: string,
  vars: Record<string, string | number | null | undefined>
): string {
  return template
    .replace(/\{(\w+)\}/g, (_match, key: string) => {
      const value = vars[key];
      return value === undefined || value === null ? '' : String(value);
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* Re-exported so consumers of this feature import one module, not four. */
export type {
  ClassDefinition,
  Course,
  CourseAssessment,
  CourseReview,
  CourseTrainingApplication,
  CourseTrainingRateCard,
  CourseTrainingRequirement,
};
