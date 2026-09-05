import { Check } from 'lucide-react';
import Link from 'next/link';

import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { type CourseBlockAsyncProps, fillCourseCopy } from '../types';
import { formatCourseMoney } from './_shared';

/**
 * The enrol panel — price, the way in, and what the money buys.
 *
 * Prospect only: it is the one rail card whose job is to sell, and the
 * capability map puts `enrol` in exactly one viewer's rail. The panel takes the
 * price it is given and no more — if the response carried none, it says the
 * price is not published rather than inventing a zero.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

const ENROL_CTA = 'Enroll in {className}';
/** When the class is not known yet, the button still has to say what it does. */
const ENROL_CTA_PLAIN = 'Enroll';
const COMPARE_CTA = 'Compare all {openClasses} open classes';
const COMPARE_CTA_PLAIN = 'Compare the open classes';
const PRICE_PER_BLOCK = 'or from {priceFrom} per class block';
const PAYMENT_NOTE = 'Pay by M-Pesa or card. Lessons open as soon as the payment is confirmed.';

export interface CourseEnrolInclusion {
  text: string;
  /** Tokens the line needs. A line missing one is dropped. */
  requires?: readonly string[];
}

/**
 * Values the "what's included" lines interpolate.
 *
 * | token | source |
 * |---|---|
 * | `lessons` / `contentItems` / `duration` | the curriculum's shape, pre-formatted |
 * | `assessments` / `majorAssessments` | count of `CourseAssessment` rows, and how many are major |
 * | `practical` | the practical block in one line, as the overview's fit card uses it |
 */
export type CourseEnrolVars = Record<string, string | number | null | undefined>;

/** Transcribed from the artboard's `included` list. */
export const COURSE_ENROL_INCLUSIONS: readonly CourseEnrolInclusion[] = [
  {
    text: '{lessons} lessons · {contentItems} items · {duration}',
    requires: ['lessons', 'contentItems', 'duration'],
  },
  {
    text: '{assessments} assessments, {majorAssessments} of them major',
    requires: ['assessments', 'majorAssessments'],
  },
  { text: '{practical}', requires: ['practical'] },
  { text: 'Certificate issued on completion' },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface EnrolPanelProps extends CourseBlockAsyncProps {
  /** The course price. Absent means unpublished — never render it as a zero. */
  price?: number;
  currency?: string;
  /** The line beside the price. */
  priceNote?: string;
  /** Cheapest per-block price, for courses sold a block at a time. */
  priceFromPerBlock?: number;
  /** The class the primary action enrols into, e.g. "Cohort 12". */
  classTitle?: string;
  /** Classes accepting enrolment right now; fills the compare button. */
  openClassCount?: number;
  /** Values the inclusion lines interpolate. */
  vars?: CourseEnrolVars;
  /** Overrides the transcribed inclusion list. */
  inclusions?: readonly CourseEnrolInclusion[];
  enrolHref?: string;
  onEnrol?: () => void;
  compareHref?: string;
  onCompareClasses?: () => void;
  className?: string;
}

export function EnrolPanel({
  price,
  currency,
  priceNote = 'full course',
  priceFromPerBlock,
  classTitle,
  openClassCount,
  vars,
  inclusions,
  enrolHref,
  onEnrol,
  compareHref,
  onCompareClasses,
  loading,
  error,
  onRetry,
  className,
}: EnrolPanelProps) {
  const headline = formatCourseMoney(price, currency);
  const perBlock = formatCourseMoney(priceFromPerBlock, currency);
  const included = (inclusions ?? COURSE_ENROL_INCLUSIONS)
    .filter(line => hasAll(line.requires, vars))
    .map(line => fillCourseCopy(line.text, vars ?? {}));

  const enrolLabel = classTitle
    ? fillCourseCopy(ENROL_CTA, { className: classTitle })
    : ENROL_CTA_PLAIN;
  const compareLabel =
    openClassCount === undefined
      ? COMPARE_CTA_PLAIN
      : fillCourseCopy(COMPARE_CTA, { openClasses: openClassCount });

  return (
    <Card className={cn('border-primary/30 gap-0 px-[18px] py-4', className)}>
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={headline === undefined}
        skeleton={<EnrolPanelSkeleton />}
        errorTitle='Couldn’t load the price'
        emptyTitle='No price published yet'
        emptyDescription='Enrolment opens once a provider publishes a price for this course.'
      >
        <div>
          <div className='flex items-baseline justify-between gap-2.5'>
            <span className='text-[26px] font-extrabold tracking-[-0.03em]'>{headline}</span>
            {priceNote ? (
              <span className='text-muted-foreground text-xs'>{priceNote}</span>
            ) : null}
          </div>

          {perBlock ? (
            <p className='text-muted-foreground mt-1 text-xs'>
              {fillCourseCopy(PRICE_PER_BLOCK, { priceFrom: perBlock })}
            </p>
          ) : null}

          <div className='mt-[13px] flex flex-col gap-2'>
            {enrolHref ? (
              <Button asChild className='h-[42px] w-full rounded-xl text-[14.5px] font-bold'>
                <Link href={enrolHref}>{enrolLabel}</Link>
              </Button>
            ) : (
              <Button
                className='h-[42px] w-full rounded-xl text-[14.5px] font-bold'
                onClick={onEnrol}
                disabled={!onEnrol}
              >
                {enrolLabel}
              </Button>
            )}

            {/* Only offered when there is somewhere to compare. */}
            {compareHref ? (
              <Button
                asChild
                variant='outline'
                className='h-10 w-full rounded-xl text-[13.5px] font-semibold'
              >
                <Link href={compareHref}>{compareLabel}</Link>
              </Button>
            ) : onCompareClasses ? (
              <Button
                variant='outline'
                className='h-10 w-full rounded-xl text-[13.5px] font-semibold'
                onClick={onCompareClasses}
              >
                {compareLabel}
              </Button>
            ) : null}
          </div>

          {included.length > 0 ? (
            <ul className='border-border/60 mt-[13px] flex flex-col gap-[7px] border-t pt-3'>
              {included.map(line => (
                <li
                  key={line}
                  className='text-foreground/80 flex items-center gap-2 text-[12.5px]'
                >
                  <Check className='text-success size-3.5 flex-none stroke-[2.4]' aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          ) : null}

          <p className='text-muted-foreground mt-3 text-[11.5px] leading-[1.5]'>{PAYMENT_NOTE}</p>
        </div>
      </AsyncSection>
    </Card>
  );
}

export function EnrolPanelSkeleton() {
  return (
    <div>
      <div className='flex items-baseline justify-between gap-2.5'>
        <Skeleton className='h-7 w-32' />
        <Skeleton className='h-3 w-16' />
      </div>
      <Skeleton className='mt-2 h-3 w-40' />
      <div className='mt-[13px] flex flex-col gap-2'>
        <Skeleton className='h-[42px] w-full rounded-xl' />
        <Skeleton className='h-10 w-full rounded-xl' />
      </div>
      <div className='border-border/60 mt-[13px] flex flex-col gap-[9px] border-t pt-3'>
        {[0, 1, 2, 3].map(line => (
          <Skeleton key={line} className='h-3 w-full' />
        ))}
      </div>
    </div>
  );
}

function hasAll(
  required: readonly string[] | undefined,
  vars: CourseEnrolVars | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!vars) return false;
  return required.every(name => {
    const value = vars[name];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}
