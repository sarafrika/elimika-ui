import {
  BarChart3,
  Calendar,
  Check,
  CircleAlert,
  CreditCard,
  Lock,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { KpiCard, KpiCardSkeleton, type KpiCardVariant } from '@/components/dashboard/kpi-card';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  COURSE_DEFAULT_CURRENCY,
  COURSE_PLACEHOLDER,
  type CourseClassRow,
  clampCoursePercent,
  courseInitials,
  formatCourseCount,
  formatCourseMoney,
} from './blocks/_shared';
import type { CourseCurriculumLesson } from './blocks/CurriculumTab';
import { KPI_BAND_GRID } from './blocks/KpiBand';
import { COURSE_FIT_CARDS, COURSE_REQUIREMENT_PROVIDER_LABELS, type CourseFitCard } from './blocks/OverviewTab';
import type { CourseBlockAsyncProps, CourseStats, CourseTrainingRequirement } from './types';
import { fillCourseCopy } from './types';

/**
 * The prospectus — the selling page for a course, for the two people who are
 * deciding about it before they have any access to it.
 *
 * One component, two audiences, exactly as the `Prospectus.dc.html` artboard's
 * `audience` prop draws it:
 *
 * - **`trainer`** — an instructor or organisation weighing whether to take the
 *   course on. They are shown the case for delivering it, where demand is
 *   unmet, what their venue must provide, and *their own* terms — marked
 *   **Private to you**, because the creator's offer to this applicant is not
 *   published and no other trainer's rate card appears anywhere on the page.
 *   The money breakdown is hidden from them outright: what learners pay is a
 *   provider-by-provider matter and is not the trainer's decision surface.
 * - **`learner`** — someone deciding whether to enrol. They get the prices, the
 *   providers to choose between, and what they walk away with.
 *
 * ## Why this branches on `audience` and not on `access`
 *
 * `access` answers *what may this viewer read of the record*, and lives in
 * `COURSE_ACCESS_CAPABILITIES`. `audience` answers a different question — *which
 * of two sales pitches is this page making* — and the artboard models it as its
 * own prop for that reason. A route serving the applicant states passes
 * `trainer`; one serving prospects passes `learner`. Everything that differs
 * between them is described once, in {@link PROSPECTUS_AUDIENCES}, and read
 * through {@link prospectusAudience} — the same discipline the capability map
 * enforces for `access`.
 *
 * ## House rules, unchanged
 *
 * Props in, markup out — nothing here fetches. Every query-backed region owns an
 * `<AsyncSection>` with a shape-matching skeleton, so a slow trainer list does
 * not blank the syllabus. Copy carries `{token}`s the caller fills through
 * `vars`; a line whose tokens are unsupplied is **dropped**, never shipped with
 * a hole in it.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Audience
 * ────────────────────────────────────────────────────────────────────────── */

/** The two pitches. Keys of {@link PROSPECTUS_AUDIENCES}. */
export type ProspectusAudience = 'trainer' | 'learner';

/**
 * Values the prospectus copy interpolates. Anything absent drops its line, so a
 * card shortens rather than shipping a sentence with a hole in it.
 *
 * Some of these the component derives from `stats` and the proof-band props and
 * you need not pass (see {@link ProspectusViewProps.vars}); the rest are the
 * caller's:
 *
 * | token | source |
 * |---|---|
 * | `summary` | `course.description`, one paragraph — opens the learner pitch |
 * | `lessons` | `content.total_lessons` |
 * | `contentItems` | total content items across the lessons |
 * | `duration` | `course.duration_hours` / `duration_minutes`, pre-formatted — "42h 30m" |
 * | `span` | typical calendar length of a cohort — "10–12 weeks" |
 * | `delivery` | how it runs, as a chip — "Blended delivery" |
 * | `level` | `course.difficulty` — "Intermediate" |
 * | `practical` | the practical block, in one chip — "Practical block on a live rig" |
 * | `ageRange` | `course.age_lower_limit`–`age_upper_limit` — "18–45" |
 * | `decisionDays` | the creator's typical application turnaround |
 * | `paidEnrolments` | paid enrolments to date |
 * | `activeTrainers` | approved trainers with a class running |
 * | `providers` | distinct providers a learner can pick between |
 * | `minimumFee` | the creator's fee floor, formatted with its currency |
 * | `creatorShare` / `trainerShare` | the revenue split, with signs — "40%" / "60%" |
 * | `platformFee` | the platform's cut — "10%" |
 * | `priceRange` | cheapest to dearest class price — "KES 16,650 – 19,200" |
 *
 * Derived for you when the matching prop is supplied: `learners`, `averageFill`,
 * `classesRunning`, `approvedTrainers`, `completionRate`, `rating`, `reviews`,
 * `platformCompletionRate`, `priceFrom`, `classesOpenNow`, `nextClassStarts`,
 * `publishedOn`. Passing one in `vars` overrides the derived value.
 */
export type ProspectusVars = Record<string, string | number | null | undefined>;

/** A line of copy that needs live values, and the values it needs. */
export interface ProspectusLine {
  /** A {@link fillCourseCopy} template. */
  v: string;
  /** Tokens the line depends on. A line missing one is dropped. */
  requires?: readonly string[];
}

/**
 * One of the three reason cards under "Why trainers take this one on".
 *
 * `requires` covers the whole card — stat, title and body together — because a
 * reason with half its figures is not a reason.
 */
export interface ProspectusReason {
  /** The big figure. A `{token}` template. */
  stat: string;
  title: string;
  body: string;
  requires?: readonly string[];
  /** Which of the three accents the figure takes, in artboard order. */
  tone: 'primary' | 'success' | 'warning';
}

/** A key/value line of the terms card. */
export interface ProspectusTerm {
  k: string;
  /** A `{token}` template. */
  v: string;
  requires?: readonly string[];
}

/** Everything that differs between the two pitches, described once. */
export interface ProspectusAudienceCopy {
  audience: ProspectusAudience;
  /** The pill above the title. */
  eyebrow: string;
  /** The paragraph under the title. */
  pitch: ProspectusLine;
  /** The lock chip beside the call to action. */
  gate: { tone: 'warning' | 'primary'; label: string };
  cta: string;
  /** The line under the call to action. */
  ctaNote: ProspectusLine;
  /** The chip row under the pitch. */
  chips: readonly ProspectusLine[];
  whyTitle: string;
  reasons: readonly ProspectusReason[];
  /** The locked footnote under the syllabus. */
  sealedNote: ProspectusLine;
  quotesTitle: string;
  /** Trainer quotes are branded; learner quotes are neutral. */
  quoteTone: 'primary' | 'muted';
  requirementsTitle: string;
  requirementsSub: string;
  termsTitle: string;
  terms: readonly ProspectusTerm[];
  /**
   * Marks the terms card **Private to you**. True for the trainer, whose terms
   * are the creator's offer to them alone — no other trainer's rates are on this
   * page, and theirs are not published either.
   */
  confidential: boolean;
  /**
   * The money card. `null` for the trainer: the artboard hides the price
   * breakdown from them, and so does this component.
   */
  money: { title: string; sub: string; note: string } | null;
  /** The unmet-demand card. Trainer only — it is an argument to apply. */
  showDemand: boolean;
}

/** Fixed across both audiences. */
const SYLLABUS_TITLE = 'What the course covers';
const SYLLABUS_SUB =
  'Every lesson, its objective and its weight — enough to judge fit, plan a timetable and price a cohort.';
const SYLLABUS_CHIP: ProspectusLine = {
  v: '{lessons} lessons · {contentItems} items · {duration}',
  requires: ['lessons', 'contentItems', 'duration'],
};
const DEMAND_TITLE = 'Where demand is unmet';
const DEMAND_SUB = 'Learners trained per region, and who is already covering it.';
const PRIVATE_CHIP = 'Private to you';

/** Transcribed field-by-field from the artboard's `renderVals()`. */
export const PROSPECTUS_AUDIENCES: Record<ProspectusAudience, ProspectusAudienceCopy> = {
  trainer: {
    audience: 'trainer',
    eyebrow: 'Training opportunity',
    pitch: {
      v: 'A finished, standards-led programme with proven demand — take it on and you teach from day one instead of writing a syllabus. Everything below is open before you apply; the teaching material itself opens when the creator approves you.',
    },
    gate: { tone: 'warning', label: 'Outline only until approved' },
    cta: 'Apply to train',
    ctaNote: { v: 'Decision in about {decisionDays} working days', requires: ['decisionDays'] },
    chips: [
      { v: '{lessons} lessons · {contentItems} items', requires: ['lessons', 'contentItems'] },
      { v: '{duration} contact time', requires: ['duration'] },
      { v: '{delivery}', requires: ['delivery'] },
      { v: '{level}', requires: ['level'] },
      { v: '{practical}', requires: ['practical'] },
    ],
    whyTitle: 'Why trainers take this one on',
    reasons: [
      {
        stat: '{paidEnrolments}',
        title: 'Paid enrolments already',
        body: 'Demand is proven — you are not testing whether anyone wants this.',
        requires: ['paidEnrolments'],
        tone: 'primary',
      },
      {
        stat: '{activeTrainers} of {approvedTrainers}',
        title: 'Trainers still running it',
        body: 'Nobody approved on this course has stopped delivering it.',
        requires: ['activeTrainers', 'approvedTrainers'],
        tone: 'success',
      },
      {
        stat: '{averageFill}',
        title: 'Average class fill',
        body: 'Classes fill; the practical block is what learners come for.',
        requires: ['averageFill'],
        tone: 'warning',
      },
    ],
    sealedNote: {
      v: 'Lesson titles, objectives and weights are open. The {contentItems} content items stay with the creator until your application is approved.',
      requires: ['contentItems'],
    },
    quotesTitle: 'What approved trainers say',
    quoteTone: 'primary',
    requirementsTitle: 'What your venue must provide',
    requirementsSub: 'Set by the creator — check these before you apply.',
    termsTitle: 'Your terms, up front',
    terms: [
      { k: 'Your rate', v: 'You set it on the application — nobody else’s rates are published' },
      {
        k: 'Fee floor',
        v: '{minimumFee} per hour, per head — rates below it are normally declined',
        requires: ['minimumFee'],
      },
      {
        k: 'Revenue split',
        v: 'Creator {creatorShare} / trainer {trainerShare}, before the {platformFee} platform fee',
        requires: ['creatorShare', 'trainerShare', 'platformFee'],
      },
      { k: 'Content licence', v: 'Read and teach only — no download, watermarked, revocable' },
      {
        k: 'Commitment',
        v: 'None. Run one cohort or twenty; approval does not expire on its own',
      },
    ],
    confidential: true,
    money: null,
    showDemand: true,
  },

  learner: {
    audience: 'learner',
    eyebrow: 'Course prospectus',
    pitch: {
      v: '{summary} Everything below is open before you enroll; the lessons open when your enrolment is paid.',
    },
    gate: { tone: 'primary', label: 'Lessons open on enrolment' },
    cta: 'Choose a class',
    ctaNote: {
      v: 'From {priceFrom} · next class {nextClassStarts}',
      requires: ['priceFrom', 'nextClassStarts'],
    },
    chips: [
      { v: '{lessons} lessons · {contentItems} items', requires: ['lessons', 'contentItems'] },
      { v: '{duration} over {span}', requires: ['duration', 'span'] },
      { v: '{delivery}', requires: ['delivery'] },
      { v: '{level}', requires: ['level'] },
      { v: 'Certificate on completion' },
      { v: 'Ages {ageRange}', requires: ['ageRange'] },
    ],
    whyTitle: 'Why learners choose it',
    reasons: [
      {
        stat: '{completionRate}',
        title: 'Actually finish it',
        body: 'Against a {platformCompletionRate} platform average — the practical block keeps people in.',
        requires: ['completionRate', 'platformCompletionRate'],
        tone: 'primary',
      },
      {
        stat: '{rating}',
        title: 'Out of 5, from {reviews}',
        body: 'Most reviews single out the commissioning and handover module.',
        requires: ['rating', 'reviews'],
        tone: 'success',
      },
      {
        stat: '{providers}',
        title: 'Providers to choose from',
        body: 'Same syllabus and certificate; pick the format and place that fit.',
        requires: ['providers'],
        tone: 'warning',
      },
    ],
    sealedNote: {
      v: 'Lesson titles, objectives and durations are open. The {contentItems} lesson items open as soon as your enrolment is confirmed.',
      requires: ['contentItems'],
    },
    quotesTitle: 'What learners say',
    quoteTone: 'muted',
    requirementsTitle: 'What you need to bring',
    requirementsSub: 'Your provider supplies everything else.',
    termsTitle: 'The essentials',
    terms: [
      {
        k: 'Price',
        v: '{priceRange} depending on provider and format',
        requires: ['priceRange'],
      },
      { k: 'Payment', v: 'M-Pesa or card — lessons open once the payment confirms' },
      { k: 'Access', v: 'Read at your own pace for the length of the course' },
      { k: 'Certificate', v: 'Issued on 100% completion, verifiable from your profile' },
    ],
    confidential: false,
    money: {
      title: 'What it costs',
      sub: 'per learner',
      note: 'Price varies by provider and format. Pay by M-Pesa or card; lessons open as soon as the payment confirms.',
    },
    showDemand: false,
  },
};

/** The one way to read the audience table. */
export function prospectusAudience(audience: ProspectusAudience): ProspectusAudienceCopy {
  return PROSPECTUS_AUDIENCES[audience];
}

/* ────────────────────────────────────────────────────────────────────────────
 * View models
 * ────────────────────────────────────────────────────────────────────────── */

/** A pull quote — a learner review, or an approved trainer's word on delivery. */
export interface ProspectusQuote {
  /** Stable key. The review or testimonial uuid. */
  id: string;
  text: string;
  name: string;
  /** The line under the name — "Approved March 2026 · 6 classes". */
  meta?: string;
  /** Falls back to the initials of {@link ProspectusQuote.name}. */
  initials?: string;
}

/** One region on the unmet-demand bar chart. */
export interface ProspectusDemandRow {
  id: string;
  /** "Nairobi metro", "North Eastern". */
  place: string;
  /** "318 learners · 6 classes", or "no approved provider". */
  meta: string;
  /** Bar length, 0–100. */
  percent: number;
  /** `unmet` is the amber bar — a region nobody is covering. */
  tone: 'covered' | 'unmet';
}

/** One line of the requirements card. */
export interface ProspectusRequirement {
  id: string;
  /** "Solar training rig · 2 units". */
  label: string;
  /** "Mandatory · provided by the training provider". */
  note: string;
  /** `required` takes the amber alert mark; `provided` the green check. */
  tone: 'required' | 'provided';
}

/** One line of the money card. */
export interface ProspectusMoneyRow {
  id: string;
  k: string;
  v: string;
  /** `included` is the emphasised last line — "Certificate and rig time · Included". */
  tone?: 'price' | 'included';
}

/**
 * `CourseTrainingRequirement` rows as the requirements card wants them.
 *
 * Mandatory rows carry the amber mark, optional ones the green check, and the
 * note names who has to bring it — the same provider vocabulary the overview
 * tab groups by, so the two surfaces never disagree.
 */
export function prospectusRequirements(
  rows: readonly CourseTrainingRequirement[]
): ProspectusRequirement[] {
  return rows.map((row, index) => {
    const mandatory = row.is_mandatory === true;
    const quantity =
      row.quantity === undefined ? undefined : [row.quantity, row.unit].filter(Boolean).join(' ');
    const provider = row.provided_by
      ? COURSE_REQUIREMENT_PROVIDER_LABELS[row.provided_by]
      : undefined;

    return {
      id: row.uuid ?? `${row.name}-${index}`,
      label: [row.name, quantity].filter(Boolean).join(' · '),
      note: [mandatory ? 'Mandatory' : 'Optional', provider && `provided by ${provider}`]
        .filter(Boolean)
        .join(' · '),
      tone: mandatory ? 'required' : 'provided',
    };
  });
}

/**
 * The classes running this course as money-card lines — "Weekend Online ·
 * J. Otieno" against its price.
 *
 * A class whose price the response did not carry is left out: an absent figure
 * is the right answer, and a zero in its place would be a lie about what the
 * learner pays.
 */
export function prospectusMoneyRows(
  rows: readonly CourseClassRow[],
  currency: string = COURSE_DEFAULT_CURRENCY
): ProspectusMoneyRow[] {
  return rows.flatMap(row => {
    const price = formatCourseMoney(row.price, row.currency ?? currency);
    if (price === undefined) return [];
    return [
      {
        id: row.uuid,
        k: [row.title, row.host].filter(Boolean).join(' · '),
        v: price,
        tone: 'price' as const,
      },
    ];
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface ProspectusViewProps extends CourseBlockAsyncProps {
  /** Which pitch this page is making. See {@link PROSPECTUS_AUDIENCES}. */
  audience: ProspectusAudience;
  /** The course name. */
  title?: string;
  /**
   * Values the copy interpolates. See {@link ProspectusVars} — figures the
   * component can derive from `stats` and the proof-band props are filled in for
   * you, and anything passed here wins.
   */
  vars?: ProspectusVars;

  /* — header — */
  /** Overrides the audience's chip row outright. */
  chips?: readonly string[];

  /* — proof band — */
  stats?: CourseStats;
  /** Async state of the stats query; it backs the proof band and the reasons. */
  statsAsync?: CourseBlockAsyncProps;
  /** ISO currency for the price tile and the money card. */
  currency?: string;
  /** Cheapest class price for this course. */
  priceFrom?: number;
  /** Classes accepting enrolment right now. */
  classesOpenNow?: number;
  /** When the next class starts, pre-formatted — "6 Oct". */
  nextClassStarts?: string;
  /** When the course was published, pre-formatted — "March 2026". */
  publishedOn?: string;
  /** Platform-wide completion rate, 0–100, for the "well above" comparison. */
  platformCompletionRate?: number;
  /** Share of reviews at 4★ or better, 0–100. */
  highlyRatedShare?: number;

  /* — the case — */
  /** Overrides the audience's reason cards. */
  reasons?: readonly ProspectusReason[];
  /** Overrides the fit cards the audience's set names. */
  fitCards?: readonly CourseFitCard[];

  /* — syllabus — */
  lessons?: readonly CourseCurriculumLesson[];
  lessonsAsync?: CourseBlockAsyncProps;

  /* — quotes — */
  quotes?: readonly ProspectusQuote[];
  quotesAsync?: CourseBlockAsyncProps;

  /* — rail — */
  /** Learner only. See {@link prospectusMoneyRows}. */
  moneyRows?: readonly ProspectusMoneyRow[];
  moneyAsync?: CourseBlockAsyncProps;
  /** Trainer only. */
  demand?: readonly ProspectusDemandRow[];
  demandAsync?: CourseBlockAsyncProps;
  /** See {@link prospectusRequirements}. */
  requirements?: readonly ProspectusRequirement[];
  requirementsAsync?: CourseBlockAsyncProps;
  /** Overrides the audience's terms. */
  terms?: readonly ProspectusTerm[];

  /* — call to action — */
  ctaHref?: string;
  onCta?: () => void;

  className?: string;
}

export function ProspectusView({
  audience,
  title,
  vars,
  chips,
  stats,
  statsAsync,
  currency = COURSE_DEFAULT_CURRENCY,
  priceFrom,
  classesOpenNow,
  nextClassStarts,
  publishedOn,
  platformCompletionRate,
  highlyRatedShare,
  reasons,
  fitCards,
  lessons,
  lessonsAsync,
  quotes,
  quotesAsync,
  moneyRows,
  moneyAsync,
  demand,
  demandAsync,
  requirements,
  requirementsAsync,
  terms,
  ctaHref,
  onCta,
  loading,
  error,
  onRetry,
  className,
}: ProspectusViewProps) {
  const copy = prospectusAudience(audience);

  // Figures the page already holds, offered to the copy as tokens. The caller's
  // own `vars` win, so a route with a better-formatted value can always say so.
  const filled: ProspectusVars = {
    ...derivedVars({
      stats,
      currency,
      priceFrom,
      classesOpenNow,
      nextClassStarts,
      publishedOn,
      platformCompletionRate,
      highlyRatedShare,
    }),
    ...vars,
  };

  const chipRow = chips ?? resolveLines(copy.chips, filled);
  const pitch = resolveLine(copy.pitch, filled);
  const ctaNote = resolveLine(copy.ctaNote, filled);
  const syllabusChip = resolveLine(SYLLABUS_CHIP, filled);
  const sealedNote = resolveLine(copy.sealedNote, filled);

  const reasonCards = (reasons ?? copy.reasons)
    .filter(reason => hasAll(reason.requires, filled))
    .map(reason => ({
      ...reason,
      stat: fillCourseCopy(reason.stat, filled),
      title: fillCourseCopy(reason.title, filled),
      body: fillCourseCopy(reason.body, filled),
    }));

  // The fit sets are keyed by the same two names the audiences are.
  const fit = fitCards ?? COURSE_FIT_CARDS[audience];
  const termRows = (terms ?? copy.terms)
    .filter(term => hasAll(term.requires, filled))
    .map(term => ({ k: term.k, v: fillCourseCopy(term.v, filled) }));

  const tiles = proofTiles(copy.audience, {
    stats,
    currency,
    priceFrom,
    classesOpenNow,
    nextClassStarts,
    publishedOn,
    platformCompletionRate,
    highlyRatedShare,
  });

  const cta = (
    <ProspectusCta href={ctaHref} onClick={onCta}>
      {copy.cta}
    </ProspectusCta>
  );

  return (
    <div className={cn('min-w-0', className)}>
      {/* ── header ───────────────────────────────────────────────────── */}
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        skeleton={<ProspectusHeaderSkeleton />}
        errorTitle='Couldn’t load this course'
      >
        <header className='border-border mb-5 flex flex-col gap-5 border-b pb-[18px] md:flex-row md:items-end md:justify-between md:gap-6'>
          <div className='min-w-0'>
            <span className='bg-primary/10 text-primary inline-flex h-[22px] items-center rounded-lg px-[9px] text-[11px] font-bold tracking-[0.05em] uppercase'>
              {copy.eyebrow}
            </span>

            <h1 className='mt-[9px] text-2xl font-bold tracking-[-0.025em] sm:text-[28px]'>
              {title ?? COURSE_PLACEHOLDER}
            </h1>

            {pitch ? (
              <p className='text-foreground/80 mt-[7px] max-w-[800px] text-sm leading-[1.6]'>
                {pitch}
              </p>
            ) : null}

            {chipRow.length > 0 ? (
              <div className='mt-3 flex flex-wrap gap-[7px]'>
                {chipRow.map(chip => (
                  <span
                    key={chip}
                    className='border-border text-foreground/80 inline-flex h-[26px] items-center rounded-[9px] border px-2.5 text-xs'
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className='flex flex-none flex-col gap-2.5 md:items-end'>
            <span
              className={cn(
                'inline-flex h-[26px] w-fit items-center gap-1.5 rounded-[9px] border px-2.5 text-xs font-semibold',
                copy.gate.tone === 'warning'
                  ? 'border-warning/35 bg-warning/10 text-warning'
                  : 'border-primary/30 bg-primary/10 text-primary'
              )}
            >
              <Lock className='size-3 stroke-[2]' aria-hidden />
              {copy.gate.label}
            </span>

            <div className='w-fit'>{cta}</div>

            {ctaNote ? (
              <span className='text-muted-foreground text-[11.5px]'>{ctaNote}</span>
            ) : null}
          </div>
        </header>
      </AsyncSection>

      {/* ── proof band ───────────────────────────────────────────────── */}
      <AsyncSection
        loading={statsAsync?.loading}
        error={statsAsync?.error}
        onRetry={statsAsync?.onRetry}
        empty={tiles.length === 0}
        className='mb-5'
        skeleton={<ProspectusProofSkeleton className='mb-5' />}
        errorTitle='Couldn’t load this course’s track record'
        emptyTitle='No track record yet'
        emptyDescription='These figures appear once the course has classes, enrolments and reviews.'
      >
        <div className={cn(KPI_BAND_GRID, 'mb-5')}>
          {tiles.map(tile => (
            <KpiCard
              key={tile.key}
              title={tile.title}
              value={tile.value}
              icon={tile.icon}
              variant={tile.variant}
              hint={tile.hint}
              className={tile.className}
            />
          ))}
        </div>
      </AsyncSection>

      <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]'>
        {/* ── the case ───────────────────────────────────────────────── */}
        <div className='flex min-w-0 flex-col gap-4'>
          {/* Reasons. Backed by the same query as the proof band. */}
          <ProspectusCard>
            <h2 className='text-[15px] font-bold'>{copy.whyTitle}</h2>

            <AsyncSection
              loading={statsAsync?.loading}
              error={statsAsync?.error}
              onRetry={statsAsync?.onRetry}
              empty={reasonCards.length === 0}
              skeleton={<ProspectusReasonsSkeleton />}
              errorTitle='Couldn’t load the case for this course'
              emptyTitle='Nothing to show yet'
              emptyDescription='These appear once the course has been delivered a few times.'
            >
              <div className='mt-3.5 grid gap-3.5 sm:grid-cols-3'>
                {reasonCards.map(reason => (
                  <div
                    key={reason.title}
                    className='border-border rounded-[13px] border px-[15px] py-3.5'
                  >
                    <div
                      className={cn(
                        'text-xl font-extrabold tracking-[-0.02em]',
                        REASON_TONE[reason.tone]
                      )}
                    >
                      {reason.stat}
                    </div>
                    <div className='mt-[5px] text-[13px] font-bold'>{reason.title}</div>
                    <p className='text-muted-foreground mt-1 text-xs leading-[1.5]'>
                      {reason.body}
                    </p>
                  </div>
                ))}
              </div>
            </AsyncSection>
          </ProspectusCard>

          {/* Syllabus. */}
          <ProspectusCard>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='min-w-0'>
                <h2 className='text-[15px] font-bold'>{SYLLABUS_TITLE}</h2>
                <p className='text-muted-foreground mt-[3px] text-[12.5px]'>{SYLLABUS_SUB}</p>
              </div>
              {syllabusChip ? (
                <span className='bg-muted text-muted-foreground inline-flex h-[26px] flex-none items-center rounded-[9px] px-2.5 text-[11.5px] font-semibold'>
                  {syllabusChip}
                </span>
              ) : null}
            </div>

            <AsyncSection
              loading={lessonsAsync?.loading}
              error={lessonsAsync?.error}
              onRetry={lessonsAsync?.onRetry}
              empty={(lessons?.length ?? 0) === 0}
              skeleton={<ProspectusSyllabusSkeleton />}
              errorTitle='Couldn’t load the syllabus'
              emptyTitle='No lessons published yet'
              emptyDescription='The syllabus appears once the creator publishes the course outline.'
            >
              <div className='mt-3.5 grid gap-x-[22px] sm:grid-cols-2'>
                {lessons?.map(lesson => (
                  <div
                    key={lesson.number}
                    className='border-muted flex items-start gap-[11px] border-t py-[9px]'
                  >
                    <span className='bg-primary/10 text-primary inline-flex size-6 flex-none items-center justify-center rounded-lg text-[11px] font-bold'>
                      {lesson.number}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-[13px] leading-[1.3] font-semibold'>
                        {lesson.title}
                      </span>
                      {lesson.objective ? (
                        <span className='text-muted-foreground mt-0.5 block text-[11.5px] leading-[1.4]'>
                          {lesson.objective}
                        </span>
                      ) : null}
                    </span>
                    <span className='flex-none text-right'>
                      {lesson.duration ? (
                        <span className='text-foreground/80 block text-[11.5px] font-semibold'>
                          {lesson.duration}
                        </span>
                      ) : null}
                      {lesson.itemCount !== undefined ? (
                        <span className='text-muted-foreground/70 mt-px block text-[11px] whitespace-nowrap'>
                          {formatCourseCount(lesson.itemCount)} items
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            </AsyncSection>

            {sealedNote ? (
              <div className='border-muted text-muted-foreground mt-3.5 flex items-center gap-2.5 border-t pt-[13px] text-xs'>
                <Lock className='text-muted-foreground/70 size-[15px] flex-none' aria-hidden />
                {sealedNote}
              </div>
            ) : null}
          </ProspectusCard>

          {/* Fit cards. Static copy, no query — rows drop when a token is absent. */}
          {fit.length > 0 ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {fit.map(card => (
                <ProspectusFitCard key={card.title} card={card} vars={filled} />
              ))}
            </div>
          ) : null}

          {/* Quotes. */}
          <ProspectusCard>
            <h2 className='mb-[13px] text-[15px] font-bold'>{copy.quotesTitle}</h2>

            <AsyncSection
              loading={quotesAsync?.loading}
              error={quotesAsync?.error}
              onRetry={quotesAsync?.onRetry}
              empty={(quotes?.length ?? 0) === 0}
              skeleton={<ProspectusQuotesSkeleton />}
              errorTitle='Couldn’t load what people said'
              emptyTitle='Nothing said yet'
              emptyDescription='Quotes appear here as reviews come in.'
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                {quotes?.map(quote => (
                  <figure
                    key={quote.id}
                    className='border-l-primary bg-muted rounded-r-lg border-l-[3px] px-4 py-[13px]'
                  >
                    <blockquote className='text-foreground/90 text-[13px] leading-[1.6]'>
                      {quote.text}
                    </blockquote>
                    <figcaption className='mt-2.5 flex items-center gap-[9px]'>
                      <span
                        className={cn(
                          'inline-flex size-7 flex-none items-center justify-center rounded-[9px] text-[10.5px] font-bold',
                          copy.quoteTone === 'primary'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-card text-muted-foreground'
                        )}
                        aria-hidden
                      >
                        {quote.initials ?? courseInitials(quote.name)}
                      </span>
                      <span className='min-w-0'>
                        <span className='block text-[12.5px] font-semibold'>{quote.name}</span>
                        {quote.meta ? (
                          <span className='text-muted-foreground block text-[11px]'>
                            {quote.meta}
                          </span>
                        ) : null}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </AsyncSection>
          </ProspectusCard>
        </div>

        {/* ── rail ───────────────────────────────────────────────────── */}
        <aside className='flex min-w-0 flex-col gap-4'>
          {/*
            The money card. Absent for the trainer by design: what a learner pays
            is set provider by provider, and putting a price list in front of an
            applicant would publish the other trainers' positions.
          */}
          {copy.money ? (
            <Card className='border-primary bg-primary/10 gap-0 px-[19px] py-[17px] shadow-none'>
              <div className='flex items-baseline justify-between gap-2.5'>
                <h3 className='text-sm font-bold'>{copy.money.title}</h3>
                <span className='text-muted-foreground text-[11.5px]'>{copy.money.sub}</span>
              </div>

              <AsyncSection
                loading={moneyAsync?.loading}
                error={moneyAsync?.error}
                onRetry={moneyAsync?.onRetry}
                empty={(moneyRows?.length ?? 0) === 0}
                skeleton={<ProspectusMoneySkeleton />}
                errorTitle='Couldn’t load the prices'
                emptyTitle='No prices published yet'
                emptyDescription='Prices appear once a provider opens a class for enrolment.'
              >
                <dl className='mt-3 flex flex-col'>
                  {moneyRows?.map(row => (
                    <div
                      key={row.id}
                      className='border-border/70 flex items-baseline justify-between gap-2.5 border-b py-2 text-[12.5px]'
                    >
                      <dt
                        className={
                          row.tone === 'included'
                            ? 'font-bold'
                            : 'text-muted-foreground font-medium'
                        }
                      >
                        {row.k}
                      </dt>
                      <dd
                        className={cn(
                          'text-right',
                          row.tone === 'included'
                            ? 'text-success text-sm font-bold'
                            : 'font-medium'
                        )}
                      >
                        {row.v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </AsyncSection>

              <p className='text-muted-foreground mt-[11px] text-[11.5px] leading-[1.5]'>
                {copy.money.note}
              </p>
            </Card>
          ) : null}

          {/* Where demand is unmet — the trainer's reason to apply. */}
          {copy.showDemand ? (
            <Card className='gap-0 px-[19px] py-[17px]'>
              <h3 className='text-sm font-bold'>{DEMAND_TITLE}</h3>
              <p className='text-muted-foreground mt-[3px] text-xs'>{DEMAND_SUB}</p>

              <AsyncSection
                loading={demandAsync?.loading}
                error={demandAsync?.error}
                onRetry={demandAsync?.onRetry}
                empty={(demand?.length ?? 0) === 0}
                skeleton={<ProspectusDemandSkeleton />}
                errorTitle='Couldn’t load the demand picture'
                emptyTitle='No regional picture yet'
                emptyDescription='This fills in once classes have run in more than one region.'
              >
                <div className='mt-[13px] flex flex-col gap-[11px]'>
                  {demand?.map(row => (
                    <div key={row.id}>
                      <div className='flex items-baseline justify-between gap-2.5 text-[12.5px]'>
                        <span
                          className={
                            row.tone === 'unmet' ? 'font-bold' : 'text-foreground/80 font-medium'
                          }
                        >
                          {row.place}
                        </span>
                        <span
                          className={cn(
                            'text-[11.5px]',
                            row.tone === 'unmet' ? 'text-warning' : 'text-muted-foreground'
                          )}
                        >
                          {row.meta}
                        </span>
                      </div>
                      <Progress
                        value={clampCoursePercent(row.percent)}
                        className='bg-muted mt-[5px] h-[7px]'
                        indicatorClassName={row.tone === 'unmet' ? 'bg-warning' : 'bg-primary'}
                        aria-label={`${row.place} — ${row.meta}`}
                      />
                    </div>
                  ))}
                </div>
              </AsyncSection>
            </Card>
          ) : null}

          {/* Requirements. */}
          <Card className='gap-0 px-[19px] py-[17px]'>
            <h3 className='text-sm font-bold'>{copy.requirementsTitle}</h3>
            <p className='text-muted-foreground mt-[3px] text-xs'>{copy.requirementsSub}</p>

            <AsyncSection
              loading={requirementsAsync?.loading}
              error={requirementsAsync?.error}
              onRetry={requirementsAsync?.onRetry}
              empty={(requirements?.length ?? 0) === 0}
              skeleton={<ProspectusRequirementsSkeleton />}
              errorTitle='Couldn’t load the requirements'
              emptyTitle='Nothing listed'
              emptyDescription='The creator has not said what a delivery site must provide.'
            >
              <ul className='mt-3 flex flex-col gap-[9px]'>
                {requirements?.map(row => (
                  <li key={row.id} className='flex items-start gap-[9px]'>
                    {row.tone === 'required' ? (
                      <CircleAlert
                        className='text-warning mt-px size-[15px] flex-none stroke-[2.1]'
                        aria-hidden
                      />
                    ) : (
                      <Check
                        className='text-success mt-px size-[15px] flex-none stroke-[2.1]'
                        aria-hidden
                      />
                    )}
                    <span className='min-w-0'>
                      <span className='block text-[12.5px] font-semibold'>{row.label}</span>
                      <span className='text-muted-foreground mt-px block text-[11.5px] leading-[1.4]'>
                        {row.note}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </AsyncSection>
          </Card>

          {/* Terms — private to the trainer, plain essentials for the learner. */}
          <Card className='bg-muted gap-0 px-[19px] py-[17px] shadow-none'>
            <div className='mb-[11px] flex items-center justify-between gap-2.5'>
              <h3 className='text-sm font-bold'>{copy.termsTitle}</h3>
              {copy.confidential ? (
                <span className='bg-destructive/10 text-destructive inline-flex h-[26px] flex-none items-center gap-1.5 rounded-[10px] px-2.5 text-[11.5px] font-bold'>
                  <Lock className='size-3 stroke-[2]' aria-hidden />
                  {PRIVATE_CHIP}
                </span>
              ) : null}
            </div>

            {termRows.length > 0 ? (
              <dl className='flex flex-col'>
                {termRows.map(term => (
                  <div
                    key={term.k}
                    className='border-border flex items-start justify-between gap-3.5 border-t py-2 text-[12.5px]'
                  >
                    <dt className='text-muted-foreground w-[104px] flex-none font-semibold'>
                      {term.k}
                    </dt>
                    <dd className='text-foreground/80 flex-1 text-right leading-[1.45]'>
                      {term.v}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className='mt-3.5'>
              <ProspectusCta href={ctaHref} onClick={onCta} block>
                {copy.cta}
              </ProspectusCta>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pieces
 * ────────────────────────────────────────────────────────────────────────── */

const REASON_TONE: Record<ProspectusReason['tone'], string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
};

function ProspectusCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('bg-card rounded-xl border px-5 py-[18px] shadow-sm', className)}>
      {children}
    </section>
  );
}

function ProspectusCta({
  children,
  href,
  onClick,
  block,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  block?: boolean;
}) {
  const shape = block
    ? 'h-11 w-full rounded-xl text-[14.5px] font-bold'
    : 'h-[42px] rounded-xl px-[22px] text-[15px] font-bold';

  if (href) {
    return (
      <Button asChild className={shape}>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }
  return (
    <Button className={shape} onClick={onClick} disabled={!onClick}>
      {children}
    </Button>
  );
}

/**
 * A fit card, at the prospectus's slightly tighter measure.
 *
 * The copy is the overview tab's — one table, two surfaces, so the pitch and the
 * record can never describe the same course differently.
 */
function ProspectusFitCard({ card, vars }: { card: CourseFitCard; vars: ProspectusVars }) {
  const rows = card.rows.filter(row => hasAll(row.requires, vars));
  if (rows.length === 0) return null;

  const success = card.tone === 'success';
  const sub = hasAll(card.subRequires, vars) ? fillCourseCopy(card.sub, vars) : undefined;

  return (
    <section
      className={cn(
        'rounded-xl border px-[19px] py-[17px] shadow-sm',
        success ? 'border-success/30 bg-success/5' : 'bg-card'
      )}
    >
      <h3 className='flex items-center gap-2 text-[14.5px] font-bold'>
        <span className={success ? 'text-success' : 'text-primary'} aria-hidden>
          {success ? <Check className='size-4' /> : <Calendar className='size-4' />}
        </span>
        {card.title}
      </h3>
      {sub ? <p className='text-muted-foreground mt-1 text-xs'>{sub}</p> : null}

      <dl className='mt-3 flex flex-col'>
        {rows.map(row => (
          <div
            key={row.k}
            className='border-border/50 flex items-start justify-between gap-3.5 border-t py-2 text-[12.5px]'
          >
            <dt className='text-muted-foreground w-[86px] flex-none font-semibold'>{row.k}</dt>
            <dd className='text-foreground/80 flex-1 text-right leading-[1.45]'>
              {fillCourseCopy(row.v, vars)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Proof band
 * ────────────────────────────────────────────────────────────────────────── */

interface ProofTile {
  key: string;
  title: string;
  value: ReactNode;
  icon: ReactNode;
  variant: KpiCardVariant;
  hint?: string;
  className?: string;
}

interface ProofInputs {
  stats: CourseStats | undefined;
  currency: string;
  priceFrom: number | undefined;
  classesOpenNow: number | undefined;
  nextClassStarts: string | undefined;
  publishedOn: string | undefined;
  platformCompletionRate: number | undefined;
  highlyRatedShare: number | undefined;
}

/**
 * The five proof tiles.
 *
 * A tile whose figure the response did not carry is **not pushed** — the band
 * shortens rather than showing a zero the course has not earned. The accent
 * order matches the record's KPI band exactly, so the same course reads the same
 * on both pages.
 */
function proofTiles(audience: ProspectusAudience, input: ProofInputs): ProofTile[] {
  const { stats, currency, priceFrom, classesOpenNow, nextClassStarts, publishedOn } = input;
  const trainer = audience === 'trainer';
  const tiles: ProofTile[] = [];

  /* — 1 · learners trained ───────────────────────────────────────────── */
  const learners = stats?.public.learners_trained;
  if (learners !== undefined) {
    tiles.push({
      key: 'learners',
      title: 'Learners trained',
      value: formatCourseCount(learners),
      icon: <Users className='size-4' />,
      variant: 'primary',
      hint: publishedOn
        ? trainer
          ? `since the course was published in ${publishedOn}`
          : `since ${publishedOn}`
        : undefined,
    });
  }

  /* — 2 · class fill, or the price to a learner ──────────────────────── */
  if (trainer) {
    const fill = percent(stats?.public.average_class_fill);
    const running = stats?.public.classes_running;
    if (fill !== undefined) {
      tiles.push({
        key: 'fill',
        title: 'Average class fill',
        value: fill,
        icon: <BarChart3 className='size-4' />,
        variant: 'green',
        hint:
          running === undefined
            ? undefined
            : `across the ${formatCourseCount(running)} classes already running`,
      });
    }
  } else {
    const from = formatCourseMoney(priceFrom, currency);
    if (from !== undefined) {
      tiles.push({
        key: 'price',
        title: 'From',
        value: from,
        icon: <CreditCard className='size-4' />,
        variant: 'green',
        hint: 'depending on the class you choose',
      });
    }
  }

  /* — 3 · classes ────────────────────────────────────────────────────── */
  const running = stats?.public.classes_running;
  const trainers = stats?.public.approved_trainer_count;
  const classesValue = trainer ? running : classesOpenNow;
  if (classesValue !== undefined) {
    tiles.push({
      key: 'classes',
      title: trainer ? 'Classes running now' : 'Classes open now',
      value: formatCourseCount(classesValue),
      icon: <Calendar className='size-4' />,
      variant: 'coral',
      hint: trainer
        ? trainers === undefined
          ? undefined
          : `across ${formatCourseCount(trainers)} approved trainer${trainers === 1 ? '' : 's'}`
        : openClassesHint(running, nextClassStarts),
    });
  }

  /* — 4 · completion ─────────────────────────────────────────────────── */
  const completion = percent(stats?.public.completion_rate);
  if (completion !== undefined) {
    const platform = percent(input.platformCompletionRate);
    tiles.push({
      key: 'completion',
      title: 'Completion rate',
      value: completion,
      icon: <TrendingUp className='size-4' />,
      variant: 'primary',
      hint: trainer
        ? platform === undefined
          ? undefined
          : `well above the ${platform} platform average`
        : 'of learners who start, finish',
    });
  }

  /* — 5 · rating ─────────────────────────────────────────────────────── */
  const rating = stats?.public.average_rating;
  if (rating !== undefined) {
    tiles.push({
      key: 'rating',
      title: 'Learner rating',
      value: (
        <>
          {rating.toFixed(1)} <span className='text-muted-foreground text-sm font-medium'>/ 5</span>
        </>
      ),
      icon: <Star className='fill-chart-3 text-chart-3 size-4' />,
      variant: 'amber',
      // The gold star accent is `chart-3`; KpiCard's amber rail is the orange
      // warning step, so it is retinted here — as the record's band does.
      className: 'border-l-chart-3',
      hint: ratingHint(stats?.public.total_reviews, input.highlyRatedShare),
    });
  }

  return tiles;
}

function openClassesHint(running: number | undefined, next: string | undefined): string | undefined {
  const base = running === undefined ? undefined : `of ${formatCourseCount(running)} running`;
  if (!next) return base;
  return base ? `${base} · next starts ${next}` : `next starts ${next}`;
}

function ratingHint(reviews: number | undefined, share: number | undefined): string | undefined {
  const parts: string[] = [];
  if (reviews !== undefined) {
    parts.push(`${formatCourseCount(reviews)} review${reviews === 1 ? '' : 's'}`);
  }
  const rated = percent(share);
  if (rated !== undefined) parts.push(`${rated} rated it 4★ or better`);
  return parts.length === 0 ? undefined : parts.join(' · ');
}

/* ────────────────────────────────────────────────────────────────────────────
 * Copy resolution
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The figures the page already holds, offered to the copy as tokens so a route
 * that passes `stats` need not restate them in `vars`.
 */
function derivedVars(input: ProofInputs): ProspectusVars {
  const { stats } = input;
  return {
    learners: countOrUndefined(stats?.public.learners_trained),
    averageFill: percent(stats?.public.average_class_fill),
    classesRunning: countOrUndefined(stats?.public.classes_running),
    approvedTrainers: countOrUndefined(stats?.public.approved_trainer_count),
    completionRate: percent(stats?.public.completion_rate),
    rating: stats?.public.average_rating?.toFixed(1),
    reviews: countOrUndefined(stats?.public.total_reviews),
    platformCompletionRate: percent(input.platformCompletionRate),
    highlyRatedShare: percent(input.highlyRatedShare),
    priceFrom: formatCourseMoney(input.priceFrom, input.currency),
    classesOpenNow: countOrUndefined(input.classesOpenNow),
    nextClassStarts: input.nextClassStarts,
    publishedOn: input.publishedOn,
  };
}

/** Resolves a line, or `undefined` when a token it needs was not supplied. */
function resolveLine(line: ProspectusLine, vars: ProspectusVars): string | undefined {
  if (!hasAll(line.requires, vars)) return undefined;
  const filled = fillCourseCopy(line.v, vars);
  return filled === '' ? undefined : filled;
}

function resolveLines(lines: readonly ProspectusLine[], vars: ProspectusVars): string[] {
  return lines.flatMap(line => {
    const filled = resolveLine(line, vars);
    return filled === undefined ? [] : [filled];
  });
}

function hasAll(required: readonly string[] | undefined, vars: ProspectusVars | undefined): boolean {
  if (!required || required.length === 0) return true;
  if (!vars) return false;
  return required.every(name => {
    const value = vars[name];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

function percent(value: number | undefined): string | undefined {
  return value === undefined ? undefined : `${Math.round(value)}%`;
}

function countOrUndefined(value: number | undefined): string | undefined {
  return value === undefined ? undefined : formatCourseCount(value);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

/** Header, proof band and the first card — what the route shows on first paint. */
export function ProspectusViewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <ProspectusHeaderSkeleton />
      <ProspectusProofSkeleton className='mb-5' />
      <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]'>
        <div className='bg-card min-w-0 rounded-xl border px-5 py-[18px] shadow-sm'>
          <Skeleton className='h-4 w-56' />
          <ProspectusReasonsSkeleton />
        </div>
        <div className='bg-card rounded-xl border px-[19px] py-[17px] shadow-sm'>
          <Skeleton className='h-4 w-40' />
          <ProspectusRequirementsSkeleton />
        </div>
      </div>
    </div>
  );
}

function ProspectusHeaderSkeleton() {
  return (
    <div className='border-border mb-5 flex flex-col gap-5 border-b pb-[18px] md:flex-row md:items-end md:justify-between md:gap-6'>
      <div className='min-w-0 flex-1'>
        <Skeleton className='h-[22px] w-36 rounded-lg' />
        <Skeleton className='mt-[9px] h-7 w-[min(100%,26rem)]' />
        <Skeleton className='mt-[11px] h-3 w-full max-w-[800px]' />
        <Skeleton className='mt-1.5 h-3 w-4/5 max-w-[640px]' />
        <div className='mt-3 flex flex-wrap gap-[7px]'>
          {[0, 1, 2, 3, 4].map(chip => (
            <Skeleton key={chip} className='h-[26px] w-28 rounded-[9px]' />
          ))}
        </div>
      </div>
      <div className='flex flex-none flex-col gap-2.5 md:items-end'>
        <Skeleton className='h-[26px] w-48 rounded-[9px]' />
        <Skeleton className='h-[42px] w-40 rounded-xl' />
        <Skeleton className='h-3 w-44' />
      </div>
    </div>
  );
}

function ProspectusProofSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(KPI_BAND_GRID, className)}>
      {[0, 1, 2, 3, 4].map(tile => (
        <KpiCardSkeleton key={tile} />
      ))}
    </div>
  );
}

function ProspectusReasonsSkeleton() {
  return (
    <div className='mt-3.5 grid gap-3.5 sm:grid-cols-3'>
      {[0, 1, 2].map(card => (
        <div key={card} className='border-border rounded-[13px] border px-[15px] py-3.5'>
          <Skeleton className='h-6 w-16' />
          <Skeleton className='mt-2 h-3.5 w-28' />
          <Skeleton className='mt-2 h-3 w-full' />
          <Skeleton className='mt-1.5 h-3 w-3/4' />
        </div>
      ))}
    </div>
  );
}

/** Twelve rows in two columns — the height the syllabus settles at. */
function ProspectusSyllabusSkeleton() {
  return (
    <div className='mt-3.5 grid gap-x-[22px] sm:grid-cols-2'>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(row => (
        <div key={row} className='border-muted flex items-start gap-[11px] border-t py-[9px]'>
          <Skeleton className='size-6 flex-none rounded-lg' />
          <div className='min-w-0 flex-1 space-y-1.5'>
            <Skeleton className='h-3 w-4/5' />
            <Skeleton className='h-2.5 w-3/5' />
          </div>
          <div className='flex-none space-y-1.5 text-right'>
            <Skeleton className='ml-auto h-3 w-12' />
            <Skeleton className='ml-auto h-2.5 w-10' />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProspectusQuotesSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {[0, 1].map(quote => (
        <div key={quote} className='bg-muted border-l-border rounded-r-lg border-l-[3px] px-4 py-[13px]'>
          <Skeleton className='h-3 w-full' />
          <Skeleton className='mt-1.5 h-3 w-11/12' />
          <Skeleton className='mt-1.5 h-3 w-2/3' />
          <div className='mt-2.5 flex items-center gap-[9px]'>
            <Skeleton className='size-7 flex-none rounded-[9px]' />
            <div className='space-y-1'>
              <Skeleton className='h-3 w-32' />
              <Skeleton className='h-2.5 w-24' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProspectusMoneySkeleton() {
  return (
    <div className='mt-3 flex flex-col'>
      {[0, 1, 2, 3].map(row => (
        <div
          key={row}
          className='border-border/70 flex items-baseline justify-between gap-2.5 border-b py-2.5'
        >
          <Skeleton className='h-3 w-40' />
          <Skeleton className='h-3 w-20' />
        </div>
      ))}
    </div>
  );
}

function ProspectusDemandSkeleton() {
  return (
    <div className='mt-[13px] flex flex-col gap-[11px]'>
      {[0, 1, 2, 3, 4, 5].map(row => (
        <div key={row}>
          <div className='flex items-baseline justify-between gap-2.5'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-28' />
          </div>
          <Skeleton className='mt-[5px] h-[7px] w-full rounded-full' />
        </div>
      ))}
    </div>
  );
}

function ProspectusRequirementsSkeleton() {
  return (
    <div className='mt-3 flex flex-col gap-[9px]'>
      {[0, 1, 2, 3].map(row => (
        <div key={row} className='flex items-start gap-[9px]'>
          <Skeleton className='mt-px size-[15px] flex-none rounded-full' />
          <div className='min-w-0 flex-1 space-y-1'>
            <Skeleton className='h-3 w-2/3' />
            <Skeleton className='h-2.5 w-5/6' />
          </div>
        </div>
      ))}
    </div>
  );
}
