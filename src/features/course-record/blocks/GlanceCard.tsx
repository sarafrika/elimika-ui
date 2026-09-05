import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  type CourseAccess,
  type CourseBlockAsyncProps,
  type CourseGlanceSetId,
  courseCapability,
  fillCourseCopy,
} from '../types';

/**
 * "At a glance" — the seven label/value rows that answer the questions this
 * viewer asks first.
 *
 * Four sets, transcribed from `Main.dc.html`'s `glanceSets`; which one applies
 * is `capability.glanceSet`. The **labels are copy** and live here; the values
 * are live figures, so each row is a template whose `{token}`s the caller fills.
 *
 * A row whose tokens are not all supplied is **dropped**. That is the honest
 * answer — better a six-row card than a row reading "Class limit — learners" —
 * and it is why the rows are declared rather than assembled by the caller.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseGlanceRow {
  /** The label. Copy — transcribed from the artboard. */
  k: string;
  /** The value, as a `{token}` template. */
  v: string;
  /** Tokens the value needs. A row missing one is dropped. */
  requires?: readonly string[];
}

/**
 * Values the glance rows interpolate. Everything is pre-formatted by the caller,
 * because only the caller knows the currency, the locale and the wording of a
 * lifecycle stage.
 *
 * | token | source |
 * |---|---|
 * | `lifecycle` | course status and version, e.g. "Published · v4" |
 * | `enrolment` | whether the course is taking enrolments, e.g. "Open" |
 * | `classLimit` | `course.class_limit` |
 * | `ageRange` | `course.age_lower_limit` – `age_upper_limit`, e.g. "18 – 45" |
 * | `assessments` | count of `CourseAssessment` rows |
 * | `majorAssessments` | how many of those carry the major weighting |
 * | `assessmentsPassed` | the learner's own passes |
 * | `lastUpdated` | `course.updated_date`, formatted |
 * | `price` | the course price, formatted with its currency |
 * | `nextClassStarts` | start date of the next class taking learners |
 * | `openClasses` / `totalClasses` | classes accepting enrolment, and running |
 * | `formats` | delivery formats on offer, e.g. "Blended, online, in-person" |
 * | `lessons` / `duration` | lesson count and total contact time |
 * | `minimumFee` | the creator's fee floor, formatted |
 * | `creatorShare` / `trainerShare` | the revenue split, e.g. "40" / "60" |
 * | `mandatoryRequirements` | mandatory training requirements |
 * | `approvedTrainers` | `stats.public.approved_trainer_count` |
 * | `decisionDays` | the creator's typical turnaround |
 * | `className` / `trainerName` | the learner's class and who delivers it |
 * | `enrolledOn` / `lastOpened` / `classEnds` | the learner's dates, formatted |
 */
export type CourseGlanceVars = Record<string, string | number | null | undefined>;

export const COURSE_GLANCE_ROWS: Record<CourseGlanceSetId, readonly CourseGlanceRow[]> = {
  full: [
    { k: 'Lifecycle stage', v: '{lifecycle}', requires: ['lifecycle'] },
    { k: 'Enrolment', v: '{enrolment}', requires: ['enrolment'] },
    { k: 'Class limit', v: '{classLimit} learners', requires: ['classLimit'] },
    { k: 'Age range', v: '{ageRange}', requires: ['ageRange'] },
    {
      k: 'Assessments',
      v: '{assessments} ({majorAssessments} major)',
      requires: ['assessments', 'majorAssessments'],
    },
    { k: 'Certificate', v: 'Issued on completion' },
    { k: 'Last updated', v: '{lastUpdated}', requires: ['lastUpdated'] },
  ],

  prospect: [
    { k: 'Price', v: '{price}', requires: ['price'] },
    { k: 'Next class starts', v: '{nextClassStarts}', requires: ['nextClassStarts'] },
    {
      k: 'Classes open now',
      v: '{openClasses} of {totalClasses}',
      requires: ['openClasses', 'totalClasses'],
    },
    { k: 'Formats', v: '{formats}', requires: ['formats'] },
    { k: 'Age range', v: '{ageRange}', requires: ['ageRange'] },
    {
      k: 'Assessments',
      v: '{assessments} ({majorAssessments} major)',
      requires: ['assessments', 'majorAssessments'],
    },
    { k: 'Certificate', v: 'Issued on completion' },
  ],

  applicant: [
    { k: 'Lessons / duration', v: '{lessons} · {duration}', requires: ['lessons', 'duration'] },
    { k: 'Minimum training fee', v: '{minimumFee} / hr / head', requires: ['minimumFee'] },
    {
      k: 'Revenue split',
      v: 'Creator {creatorShare} / Trainer {trainerShare}',
      requires: ['creatorShare', 'trainerShare'],
    },
    {
      k: 'Venue must provide',
      v: '{mandatoryRequirements} mandatory items',
      requires: ['mandatoryRequirements'],
    },
    { k: 'Approved trainers', v: '{approvedTrainers}', requires: ['approvedTrainers'] },
    { k: 'Typical decision time', v: '{decisionDays} working days', requires: ['decisionDays'] },
    { k: 'Admin verification', v: 'Required before applying' },
  ],

  learner: [
    { k: 'Your class', v: '{className}', requires: ['className'] },
    { k: 'Trainer', v: '{trainerName}', requires: ['trainerName'] },
    { k: 'Enrolment', v: 'Active since {enrolledOn}', requires: ['enrolledOn'] },
    {
      k: 'Assessments',
      v: '{assessmentsPassed} of {assessments} passed',
      requires: ['assessmentsPassed', 'assessments'],
    },
    { k: 'Certificate', v: 'On 100% completion' },
    { k: 'Last opened', v: '{lastOpened}', requires: ['lastOpened'] },
    { k: 'Class ends', v: '{classEnds}', requires: ['classEnds'] },
  ],
};

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface GlanceCardProps extends CourseBlockAsyncProps {
  /** From the API. Names the row set through the capability map. */
  access: CourseAccess;
  /** Values the rows interpolate. See {@link CourseGlanceVars}. */
  vars?: CourseGlanceVars;
  /** Overrides the transcribed set the capability map names. */
  rows?: readonly CourseGlanceRow[];
  className?: string;
}

export function GlanceCard({
  access,
  vars,
  rows,
  loading,
  error,
  onRetry,
  className,
}: GlanceCardProps) {
  const capability = courseCapability(access);
  const source = rows ?? COURSE_GLANCE_ROWS[capability.glanceSet];
  const resolved = source
    .filter(row => hasAll(row.requires, vars))
    .map(row => ({ k: row.k, v: fillCourseCopy(row.v, vars ?? {}) }));

  return (
    <Card className={cn('gap-0 px-[18px] py-4', className)}>
      <h3 className='mb-3 text-sm font-bold'>At a glance</h3>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={resolved.length === 0}
        skeleton={<GlanceCardSkeleton />}
        errorTitle='Couldn’t load this summary'
        emptyTitle='Nothing to summarise yet'
        emptyDescription='These rows fill in as the course record does.'
      >
        <dl className='flex flex-col'>
          {resolved.map(row => (
            <div
              key={row.k}
              className='border-border/60 flex items-center justify-between gap-3 border-t py-[7px] text-[12.5px]'
            >
              <dt className='text-muted-foreground'>{row.k}</dt>
              <dd className='text-right font-semibold'>{row.v}</dd>
            </div>
          ))}
        </dl>
      </AsyncSection>
    </Card>
  );
}

/** Seven rows, the height the card settles at. */
export function GlanceCardSkeleton() {
  return (
    <div className='flex flex-col'>
      {[0, 1, 2, 3, 4, 5, 6].map(row => (
        <div
          key={row}
          className='border-border/60 flex items-center justify-between gap-3 border-t py-[9px]'
        >
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-3 w-16' />
        </div>
      ))}
    </div>
  );
}

function hasAll(
  required: readonly string[] | undefined,
  vars: CourseGlanceVars | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!vars) return false;
  return required.every(name => {
    const value = vars[name];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}
