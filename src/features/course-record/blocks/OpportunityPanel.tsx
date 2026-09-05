import { Lock } from 'lucide-react';
import Link from 'next/link';

import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { type CourseBlockAsyncProps, fillCourseCopy } from '../types';

/**
 * "What you would work under" — the terms a trainer weighing this course is
 * deciding against.
 *
 * Applicant only. Everything on it is the creator's side of the deal — the fee
 * floor, the split, the platform's cut — and the one line that is the
 * applicant's own says so: *you* set your rate, on the application. The
 * confidentiality chip is not decoration: these terms are shown to a prospective
 * trainer and to nobody else, which is why it is tinted with the fixed
 * `destructive` step rather than the brand.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

const PANEL_TITLE = 'What you would work under';
const PANEL_SUB = 'The creator’s terms. You set your own rate when you apply.';
const PRIVATE_CHIP = 'Private to you';
const DEMAND_TITLE = 'Demand signal';
const APPLY_CTA = 'Apply to train';

/**
 * How a term reads:
 *
 * - `value`     — the creator's number, stated plainly.
 * - `muted`     — a deduction the trainer does not negotiate.
 * - `highlight` — the one line that is the applicant's own to fill in.
 */
export type CourseOpportunityTone = 'value' | 'muted' | 'highlight';

export interface CourseOpportunityTerm {
  k: string;
  /** The value, as a `{token}` template. */
  v: string;
  /** Tokens the value needs. A term missing one is dropped. */
  requires?: readonly string[];
  tone: CourseOpportunityTone;
}

/**
 * Values the terms interpolate.
 *
 * | token | source |
 * |---|---|
 * | `minimumFee` | the creator's fee floor, formatted with its currency |
 * | `creatorShare` / `trainerShare` | the revenue split, e.g. "40" / "60" |
 * | `platformFee` | the platform's cut, e.g. "10%" |
 */
export type CourseOpportunityVars = Record<string, string | number | null | undefined>;

/** Transcribed from the artboard's `earnings` table. */
export const COURSE_OPPORTUNITY_TERMS: readonly CourseOpportunityTerm[] = [
  {
    k: 'Minimum training fee',
    v: '{minimumFee} / hr / head',
    requires: ['minimumFee'],
    tone: 'value',
  },
  {
    k: 'Revenue split',
    v: 'Creator {creatorShare} / you {trainerShare}',
    requires: ['creatorShare', 'trainerShare'],
    tone: 'value',
  },
  { k: 'Platform fee', v: '{platformFee} of the sale', requires: ['platformFee'], tone: 'muted' },
  { k: 'Your rate', v: 'You set it on the application', tone: 'highlight' },
];

const TERM_LABEL: Record<CourseOpportunityTone, string> = {
  value: 'text-muted-foreground',
  muted: 'text-muted-foreground',
  highlight: 'text-foreground',
};

const TERM_VALUE: Record<CourseOpportunityTone, string> = {
  value: 'font-semibold',
  muted: 'text-muted-foreground font-medium',
  highlight: 'text-success font-bold',
};

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface OpportunityPanelProps extends CourseBlockAsyncProps {
  /** Values the terms interpolate. See {@link CourseOpportunityVars}. */
  vars?: CourseOpportunityVars;
  /** Overrides the transcribed term list. */
  terms?: readonly CourseOpportunityTerm[];
  /**
   * One sentence on where delivery is thin — "No approved provider in Central or
   * North Eastern, and 3 of 17 classes are still taking learners." Omitted when
   * the response carries no such signal; the box goes with it.
   */
  demandSignal?: string;
  applyHref?: string;
  onApply?: () => void;
  className?: string;
}

export function OpportunityPanel({
  vars,
  terms,
  demandSignal,
  applyHref,
  onApply,
  loading,
  error,
  onRetry,
  className,
}: OpportunityPanelProps) {
  const rows = (terms ?? COURSE_OPPORTUNITY_TERMS)
    .filter(term => hasAll(term.requires, vars))
    .map(term => ({ k: term.k, v: fillCourseCopy(term.v, vars ?? {}), tone: term.tone }));

  return (
    <Card className={cn('border-primary/30 gap-0 px-[18px] py-4', className)}>
      <div className='flex items-center justify-between gap-2.5'>
        <h3 className='text-sm font-bold'>{PANEL_TITLE}</h3>
        <span className='bg-destructive/10 text-destructive inline-flex h-[22px] flex-none items-center gap-1.5 rounded-lg px-2 text-[10.5px] font-bold'>
          <Lock className='size-[11px] stroke-[2.2]' aria-hidden />
          {PRIVATE_CHIP}
        </span>
      </div>
      <p className='text-muted-foreground mt-[3px] text-xs'>{PANEL_SUB}</p>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<OpportunityPanelSkeleton />}
        errorTitle='Couldn’t load the training terms'
        emptyTitle='Terms not published yet'
        emptyDescription='The creator sets the fee floor and revenue split before applications open.'
      >
        <dl className='mt-3 flex flex-col gap-2'>
          {rows.map(term => (
            <div
              key={term.k}
              className='border-border/60 flex items-baseline justify-between gap-2.5 border-b pb-[7px] text-[12.5px]'
            >
              <dt className={TERM_LABEL[term.tone]}>{term.k}</dt>
              <dd className={cn('text-right', TERM_VALUE[term.tone])}>{term.v}</dd>
            </div>
          ))}
        </dl>
      </AsyncSection>

      {demandSignal ? (
        <div className='border-success/25 bg-success/8 mt-3 rounded-xl border px-3 py-[11px]'>
          <p className='text-success text-xs font-bold'>{DEMAND_TITLE}</p>
          <p className='text-foreground/80 mt-[3px] text-xs leading-[1.5]'>{demandSignal}</p>
        </div>
      ) : null}

      {applyHref ? (
        <Button asChild className='mt-3 h-[42px] w-full rounded-xl text-[14.5px] font-bold'>
          <Link href={applyHref}>{APPLY_CTA}</Link>
        </Button>
      ) : (
        <Button
          className='mt-3 h-[42px] w-full rounded-xl text-[14.5px] font-bold'
          onClick={onApply}
          disabled={!onApply}
        >
          {APPLY_CTA}
        </Button>
      )}
    </Card>
  );
}

export function OpportunityPanelSkeleton() {
  return (
    <div className='mt-3 flex flex-col gap-2'>
      {[0, 1, 2, 3].map(row => (
        <div
          key={row}
          className='border-border/60 flex items-baseline justify-between gap-2.5 border-b pb-[9px]'
        >
          <Skeleton className='h-3 w-28' />
          <Skeleton className='h-3 w-20' />
        </div>
      ))}
    </div>
  );
}

function hasAll(
  required: readonly string[] | undefined,
  vars: CourseOpportunityVars | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!vars) return false;
  return required.every(name => {
    const value = vars[name];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}
