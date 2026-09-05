import { Briefcase, Calendar, Check, FileText, Sparkles, Target } from 'lucide-react';
import type { ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ProvidedByEnum, RequirementTypeEnum2 } from '@/services/client/types.gen';

import {
  type CourseAccess,
  type CourseBlockAsyncProps,
  type CourseFitSetId,
  type CourseTrainingRequirement,
  courseCapability,
  fillCourseCopy,
} from '../types';

/**
 * The overview tab.
 *
 * Four regions, in the order the artboard stacks them: **About this course**,
 * the two **fit** cards (only for the viewers whose capability row names a
 * `fitSet` — the two applicant states and the prospect), the **What you'll
 * learn / Prerequisites** pair, and **Training requirements** grouped by who has
 * to provide them.
 *
 * A block: props in, markup out. Which cards appear is read off the capability
 * map — there is no `switch (access)` here, and none belongs here.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Fit cards
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * One key/value row of a fit card. `requires` names the {@link fillCourseCopy}
 * tokens the row's value depends on; a row whose tokens are not all supplied is
 * **dropped**, because a half-filled sentence is worse than a shorter card.
 */
export interface CourseFitRow {
  k: string;
  v: string;
  requires?: readonly string[];
}

export interface CourseFitCard {
  title: string;
  sub: string;
  /** Tokens the subtitle needs; the subtitle is dropped when one is missing. */
  subRequires?: readonly string[];
  icon: 'calendar' | 'check';
  /** `success` is the green "what you receive" card; `plain` the white one. */
  tone: 'plain' | 'success';
  rows: readonly CourseFitRow[];
}

/**
 * Values the fit copy interpolates. Anything absent drops its row, so a card
 * shortens rather than shipping a sentence with a hole in it.
 *
 * The tokens {@link COURSE_FIT_CARDS} uses, and where they come from:
 *
 * | token | source |
 * |---|---|
 * | `shape` | how the course is delivered, e.g. "Blended — recorded theory, live tutorials, one in-person practical block" |
 * | `duration` | `course.duration_hours` / `duration_minutes`, pre-formatted |
 * | `span` | typical calendar length of a cohort, e.g. "10–12 weeks" |
 * | `classSize` | `course.class_limit`, as a range where one is known |
 * | `averageFill` | `stats.public.average_class_fill`, pre-formatted |
 * | `practical` | the practical block, in one line |
 * | `prep` | preparation a trainer should expect |
 * | `lessons` | `content.total_lessons` |
 * | `contentItems` | total content items across the lessons |
 * | `assessments` | count of `CourseAssessment` rows |
 * | `decisionDays` | the creator's typical decision turnaround |
 * | `learners` | `stats.public.learners_trained` |
 * | `skills`, `evidence`, `standards` | `course.objectives`, summarised by the caller |
 * | `rating`, `reviews` | `stats.public.average_rating` / `total_reviews` |
 */
export type CourseFitVars = Record<string, string | number | null | undefined>;

/**
 * The two fit cards per audience, transcribed from `Main.dc.html`'s `FIT` table.
 * The capability map names the set (`fitSet`); the copy lives here, with the
 * artboard's live figures kept as `{token}`s.
 */
export const COURSE_FIT_CARDS: Record<CourseFitSetId, readonly CourseFitCard[]> = {
  trainer: [
    {
      title: 'How it is delivered',
      sub: 'What running one cohort actually asks of you.',
      icon: 'calendar',
      tone: 'plain',
      rows: [
        { k: 'Shape', v: '{shape}', requires: ['shape'] },
        {
          k: 'Effort',
          v: '{duration} of contact time, typically over {span}',
          requires: ['duration', 'span'],
        },
        {
          k: 'Class size',
          v: '{classSize} learners; existing classes average {averageFill} full',
          requires: ['classSize', 'averageFill'],
        },
        { k: 'Practical', v: '{practical}', requires: ['practical'] },
        { k: 'Prep', v: '{prep}', requires: ['prep'] },
      ],
    },
    {
      title: 'What you receive on approval',
      sub: 'Ready to teach — you build none of it yourself.',
      icon: 'check',
      tone: 'success',
      rows: [
        {
          k: 'Curriculum',
          v: '{lessons} lessons, {contentItems} items, sequenced and ready to teach',
          requires: ['lessons', 'contentItems'],
        },
        {
          k: 'Assessment',
          v: '{assessments} assessments with rubrics, weights and pass marks',
          requires: ['assessments'],
        },
        { k: 'Certificate', v: 'Issued by the platform on completion — no admin for you' },
        { k: 'Class setup', v: 'Session templates to clone into your own schedule' },
        {
          k: 'Decisions',
          v: 'The creator answers applications in about {decisionDays} working days',
          requires: ['decisionDays'],
        },
      ],
    },
  ],

  learner: [
    {
      title: 'How you will learn',
      sub: 'The same course whichever provider you pick.',
      icon: 'calendar',
      tone: 'plain',
      rows: [
        { k: 'Format', v: '{shape}', requires: ['shape'] },
        {
          k: 'Effort',
          v: '{duration} of contact time, typically over {span}',
          requires: ['duration', 'span'],
        },
        {
          k: 'Class size',
          v: '{classSize} learners with one lead instructor',
          requires: ['classSize'],
        },
        { k: 'Practical', v: '{practical}', requires: ['practical'] },
        { k: 'Assessment', v: '{assessments} assessments', requires: ['assessments'] },
      ],
    },
    {
      title: 'What you walk away with',
      sub: 'Why {learners} learners have taken it.',
      subRequires: ['learners'],
      icon: 'check',
      tone: 'success',
      rows: [
        { k: 'Certificate', v: 'Issued on completion and verifiable from your profile' },
        { k: 'Skills', v: '{skills}', requires: ['skills'] },
        { k: 'Evidence', v: '{evidence}', requires: ['evidence'] },
        { k: 'Standards', v: '{standards}', requires: ['standards'] },
        {
          k: 'Rating',
          v: '{rating} out of 5 from {reviews} learners who finished it',
          requires: ['rating', 'reviews'],
        },
      ],
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
 * Requirements
 * ────────────────────────────────────────────────────────────────────────── */

/** Who has to bring a training requirement, in the order the tab groups them. */
export const COURSE_REQUIREMENT_PROVIDER_ORDER: readonly ProvidedByEnum[] = [
  'organisation',
  'instructor',
  'course_creator',
  'student',
];

/** Reads into "Provided by …", as the artboard's meta line does. */
export const COURSE_REQUIREMENT_PROVIDER_LABELS: Record<ProvidedByEnum, string> = {
  organisation: 'the training provider',
  instructor: 'the instructor',
  course_creator: 'the course creator',
  student: 'the learner',
};

export const COURSE_REQUIREMENT_TYPE_LABELS: Record<RequirementTypeEnum2, string> = {
  material: 'Material',
  equipment: 'Equipment',
  facility: 'Facility',
  other: 'Other',
};

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface OverviewTabProps extends CourseBlockAsyncProps {
  /** From the API. Decides whether the fit cards appear, via the capability map. */
  access: CourseAccess;

  /* — about — */
  /** Course description. Rendered as rich text; plain text is fine too. */
  description?: string;
  /** Bullets under "What you'll learn". See {@link courseBulletLines}. */
  objectives?: readonly string[];
  /** Bullets under "Prerequisites". */
  prerequisites?: readonly string[];

  /* — fit — */
  /** Values the fit copy interpolates. A row with an unsupplied token is dropped. */
  fitVars?: CourseFitVars;
  /** Overrides the transcribed copy set the capability map names. */
  fitCards?: readonly CourseFitCard[];

  /* — requirements — */
  requirements?: readonly CourseTrainingRequirement[];
  /** Async state of the requirements query; it is a separate call from the course. */
  requirementsAsync?: CourseBlockAsyncProps;

  className?: string;
}

export function OverviewTab({
  access,
  description,
  objectives,
  prerequisites,
  fitVars,
  fitCards,
  requirements,
  requirementsAsync,
  loading,
  error,
  onRetry,
  className,
}: OverviewTabProps) {
  const capability = courseCapability(access);
  const fitSet = capability.fitSet;
  const cards = fitCards ?? (fitSet ? COURSE_FIT_CARDS[fitSet] : undefined);

  const learn = objectives ?? [];
  const prereqs = prerequisites ?? [];
  const groups = groupRequirements(requirements);

  return (
    <div className={cn('flex flex-col gap-[18px]', className)}>
      {/* ── about + outcomes ────────────────────────────────────────────
          One query (the course) backs all three cards, so one AsyncSection
          covers them and a failure degrades the trio, not the tab. */}
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!description && learn.length === 0 && prereqs.length === 0}
        skeleton={<OverviewCourseSkeleton />}
        errorTitle='Couldn’t load this course'
        emptyTitle='Nothing written up yet'
        emptyDescription='The description, outcomes and prerequisites appear once the creator fills them in.'
      >
        <div className='flex flex-col gap-[18px]'>
          {description ? (
            <OverviewCard>
              <CardHeading icon={<Sparkles className='size-4' />}>About this course</CardHeading>
              <HTMLTextPreview
                htmlContent={description}
                className='text-foreground/80 mt-2.5 text-sm leading-[1.65]'
              />
            </OverviewCard>
          ) : null}

          {learn.length > 0 || prereqs.length > 0 ? (
            <div className='grid gap-[18px] md:grid-cols-2'>
              {learn.length > 0 ? (
                <OverviewCard>
                  <CardHeading icon={<Target className='size-4' />} className='mb-3'>
                    What you&apos;ll learn
                  </CardHeading>
                  <ul className='flex flex-col gap-[9px]'>
                    {learn.map(line => (
                      <li
                        key={line}
                        className='text-foreground/80 flex gap-[9px] text-[13px] leading-[1.5]'
                      >
                        <Check
                          className='text-success mt-0.5 size-[15px] flex-none stroke-[2.5]'
                          aria-hidden
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </OverviewCard>
              ) : null}

              {prereqs.length > 0 ? (
                <OverviewCard>
                  <CardHeading icon={<FileText className='size-4' />} className='mb-3'>
                    Prerequisites
                  </CardHeading>
                  <ul className='flex flex-col gap-[9px]'>
                    {prereqs.map(line => (
                      <li
                        key={line}
                        className='text-foreground/80 flex gap-[9px] text-[13px] leading-[1.5]'
                      >
                        <span
                          className='bg-muted-foreground/70 mt-[7px] size-[5px] flex-none rounded-full'
                          aria-hidden
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </OverviewCard>
              ) : null}
            </div>
          ) : null}
        </div>
      </AsyncSection>

      {/* ── fit cards ───────────────────────────────────────────────────
          Static copy from the capability map's named set — no query, so no
          AsyncSection. Rows whose tokens are unsupplied drop out. */}
      {cards && cards.length > 0 ? (
        <div className='grid gap-[18px] md:grid-cols-2'>
          {cards.map(card => (
            <FitCard key={card.title} card={card} vars={fitVars} />
          ))}
        </div>
      ) : null}

      {/* ── training requirements ───────────────────────────────────── */}
      <OverviewCard>
        <div className='mb-1 flex flex-wrap items-center justify-between gap-3'>
          <CardHeading icon={<Briefcase className='size-4' />}>Training requirements</CardHeading>
          <span className='text-muted-foreground text-xs'>What a delivery site must provide</span>
        </div>

        <AsyncSection
          loading={requirementsAsync?.loading}
          error={requirementsAsync?.error}
          onRetry={requirementsAsync?.onRetry}
          empty={groups.length === 0}
          skeleton={<RequirementsSkeleton />}
          errorTitle='Couldn’t load the training requirements'
          emptyTitle='No requirements listed'
          emptyDescription='The creator has not said what a delivery site must provide.'
        >
          <div className='mt-3 flex flex-col gap-4'>
            {groups.map(group => (
              <div key={group.key}>
                <div className='text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.06em] uppercase'>
                  {group.heading}
                </div>
                <div className='grid gap-2.5 sm:grid-cols-2'>
                  {group.items.map((requirement, index) => (
                    <RequirementCard
                      key={requirement.uuid ?? `${group.key}-${index}`}
                      requirement={requirement}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AsyncSection>
      </OverviewCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pieces
 * ────────────────────────────────────────────────────────────────────────── */

function OverviewCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn('bg-card rounded-xl border px-5 py-[18px] shadow-sm', className)}
    >
      {children}
    </section>
  );
}

function CardHeading({
  icon,
  children,
  className,
  tone = 'primary',
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'primary' | 'success';
}) {
  return (
    <h3 className={cn('flex items-center gap-2 text-[15px] font-bold', className)}>
      <span className={tone === 'success' ? 'text-success' : 'text-primary'} aria-hidden>
        {icon}
      </span>
      {children}
    </h3>
  );
}

function FitCard({ card, vars }: { card: CourseFitCard; vars: CourseFitVars | undefined }) {
  const rows = card.rows.filter(row => hasAll(row.requires, vars));
  if (rows.length === 0) return null;

  const success = card.tone === 'success';
  const sub = hasAll(card.subRequires, vars) ? fillCourseCopy(card.sub, vars ?? {}) : undefined;

  return (
    <section
      className={cn(
        'rounded-xl border px-5 py-[18px] shadow-sm',
        success ? 'border-success/30 bg-success/5' : 'bg-card'
      )}
    >
      <CardHeading
        icon={success ? <Check className='size-4' /> : <Calendar className='size-4' />}
        tone={success ? 'success' : 'primary'}
      >
        {card.title}
      </CardHeading>
      {sub ? <p className='text-muted-foreground mt-1 text-xs'>{sub}</p> : null}

      <dl className='mt-[13px] flex flex-col'>
        {rows.map(row => (
          <div
            key={row.k}
            className='border-muted flex items-start justify-between gap-4 border-t py-2 text-xs'
          >
            <dt className='text-muted-foreground w-[92px] flex-none font-semibold'>{row.k}</dt>
            <dd className='text-foreground/80 flex-1 text-right leading-[1.45]'>
              {fillCourseCopy(row.v, vars ?? {})}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RequirementCard({ requirement }: { requirement: CourseTrainingRequirement }) {
  const mandatory = requirement.is_mandatory === true;
  const type = COURSE_REQUIREMENT_TYPE_LABELS[requirement.requirement_type];
  const quantity = formatQuantity(requirement.quantity, requirement.unit);
  const meta = [type, quantity].filter(Boolean).join(' · ');

  return (
    <div className='rounded-lg border px-[13px] py-[11px]'>
      <div className='flex items-center justify-between gap-2'>
        <span className='min-w-0 truncate text-[13px] font-semibold'>{requirement.name}</span>
        <span
          className={cn(
            'flex-none rounded-[8px] px-[7px] py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase',
            mandatory ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
          )}
        >
          {mandatory ? 'Mandatory' : 'Optional'}
        </span>
      </div>
      {meta ? <div className='text-muted-foreground mt-1 text-xs'>{meta}</div> : null}
      {requirement.description ? (
        <div className='text-muted-foreground mt-1 text-xs leading-[1.5]'>
          {requirement.description}
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

export function OverviewTabSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-[18px]', className)}>
      <OverviewCourseSkeleton />
      <div className='bg-card rounded-xl border px-5 py-[18px] shadow-sm'>
        <Skeleton className='h-4 w-44' />
        <RequirementsSkeleton />
      </div>
    </div>
  );
}

function OverviewCourseSkeleton() {
  return (
    <div className='flex flex-col gap-[18px]'>
      <div className='bg-card rounded-xl border px-5 py-[18px] shadow-sm'>
        <Skeleton className='h-4 w-40' />
        <div className='mt-2.5 space-y-2'>
          <Skeleton className='h-3 w-full' />
          <Skeleton className='h-3 w-full' />
          <Skeleton className='h-3 w-3/4' />
        </div>
      </div>
      <div className='grid gap-[18px] md:grid-cols-2'>
        {[0, 1].map(card => (
          <div key={card} className='bg-card rounded-xl border px-5 py-[18px] shadow-sm'>
            <Skeleton className='mb-3 h-4 w-36' />
            <div className='space-y-[9px]'>
              {[0, 1, 2, 3].map(row => (
                <Skeleton key={row} className='h-3 w-full' />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequirementsSkeleton() {
  return (
    <div className='mt-3 grid gap-2.5 sm:grid-cols-2'>
      {[0, 1, 2, 3].map(cell => (
        <div key={cell} className='rounded-lg border px-[13px] py-[11px]'>
          <div className='flex items-center justify-between gap-2'>
            <Skeleton className='h-3.5 w-32' />
            <Skeleton className='h-4 w-16 rounded-lg' />
          </div>
          <Skeleton className='mt-2 h-3 w-40' />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

interface RequirementGroup {
  key: string;
  heading: string;
  items: CourseTrainingRequirement[];
}

/**
 * Group by `provided_by`, in {@link COURSE_REQUIREMENT_PROVIDER_ORDER}, with the
 * rows that name no provider last under their own heading. Exported so a caller
 * can count the groups without re-deriving them.
 */
export function groupRequirements(
  requirements: readonly CourseTrainingRequirement[] | undefined
): RequirementGroup[] {
  if (!requirements || requirements.length === 0) return [];

  const buckets = new Map<string, CourseTrainingRequirement[]>();
  for (const requirement of requirements) {
    const key = requirement.provided_by ?? 'unstated';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(requirement);
    else buckets.set(key, [requirement]);
  }

  const groups: RequirementGroup[] = [];
  for (const provider of COURSE_REQUIREMENT_PROVIDER_ORDER) {
    const items = buckets.get(provider);
    if (!items) continue;
    groups.push({
      key: provider,
      heading: `Provided by ${COURSE_REQUIREMENT_PROVIDER_LABELS[provider]}`,
      items,
    });
  }

  const unstated = buckets.get('unstated');
  if (unstated) groups.push({ key: 'unstated', heading: 'Provider not stated', items: unstated });

  return groups;
}

/** "2 units", "1 per learner", or nothing when no quantity was given. */
function formatQuantity(quantity: number | undefined, unit: string | undefined): string {
  if (quantity === undefined) return unit ?? '';
  if (unit) return `${quantity} ${unit}`;
  return `${quantity} ${quantity === 1 ? 'unit' : 'units'}`;
}

function hasAll(
  required: readonly string[] | undefined,
  vars: CourseFitVars | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!vars) return false;
  return required.every(name => {
    const value = vars[name];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

/**
 * Split a free-text or rich-text field into the bullets the overview lists.
 *
 * `Course.objectives` and `Course.prerequisites` arrive as one blob — sometimes
 * HTML from the builder's editor, sometimes newline- or bullet-separated plain
 * text. This turns either into the array `OverviewTab` renders, so the block
 * itself stays a renderer.
 */
export function courseBulletLines(value: string | undefined): string[] {
  if (!value) return [];

  const text = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|div|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const seen = new Set<string>();
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n|(?:\s|^)[•·]\s+/)) {
    const line = raw.replace(/^\s*(?:[-*•·—]|\d+[.)])\s*/, '').trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    lines.push(line);
  }
  return lines;
}
